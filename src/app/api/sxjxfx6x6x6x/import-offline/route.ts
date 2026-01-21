import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';

// --- SETUP NODEMAILER (Copy dari helper sebelumnya) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: Buat PDF (Versi Ringkas untuk Offline)
async function createPdfBuffer(order: any): Promise<Buffer> {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ size: [300, 600], margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Background Biru
    doc.rect(0, 0, 300, 600).fill('#87CEEB'); 
    doc.save().moveTo(0, 0).lineTo(300, 0).lineTo(300, 390).lineTo(150, 425).lineTo(0, 390).lineTo(0, 0).fill('#ffffff').restore();

    doc.font('Helvetica-Bold').fontSize(30).fillColor('#0e2a47').text('E-TICKET', 0, 260, { align: 'center' });
    
    // QR Code
    const qrData = await QRCode.toDataURL(order.order_id, { margin: 1, width: 150 });
    doc.image(qrData, 75, 90, { width: 150 });

    // Detail Text
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');
    doc.text(`ID: ${order.order_id}`, 30, 460);
    doc.text(`Nama: ${order.nama}`, 30, 480);
    doc.text(`Status: LUNAS (OFFLINE)`, 30, 500);

    doc.end();
  });
}

// Helper: Kirim Email
async function sendTicketEmail(order: any) {
  try {
    // Validasi email sebelum kirim
    if (!order.email || order.email.trim() === '') {
      console.warn(`⚠️  Skipped email send untuk ${order.nama} - email kosong`);
      return;
    }

    const pdfBuffer = await createPdfBuffer(order);
    await transporter.sendMail({
      from: `"Solo Japanese Festival #2" <${process.env.EMAIL_USER}>`,
      to: order.email,
      subject: 'Tiket Event SJF #2 (Offline Purchase)',
      html: `<h3>Halo, ${order.nama}!</h3><p>Terima kasih telah membeli tiket secara offline. Berikut tiket Anda.</p>`,
      attachments: [{ filename: `Tiket-${order.nama}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    });
    console.log(`✅ Email terkirim ke ${order.email}`);
  } catch (err) {
    console.error(`❌ Gagal kirim email offline untuk ${order.email}:`, err);
  }
}

// --- MAIN ROUTE ---
export async function POST(req: NextRequest) {
  // Cek Auth Basic
  const auth = req.headers.get('authorization');
  if (!auth || Buffer.from(auth.split(' ')[1], 'base64').toString() !== `${process.env.ADMIN_USER}:${process.env.ADMIN_PASS}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initializeDatabase();
    const { csv: csvText } = await req.json();

    if (!csvText) return NextResponse.json({ success: false, message: "Data CSV kosong" });

    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return NextResponse.json({ success: false, message: "CSV minimal 2 baris (header + data)" });

    const report = { created: 0, skipped: 0, updated: 0 };

    // Parse header untuk auto-detect kolom
    const headerLine = lines[0].trim();
    const headers = headerLine.split(',').map((h: string) => h.trim().toLowerCase());
    
    console.log('📋 Detected headers:', headers);

    // Find index kolom (flexible - case insensitive, partial match)
    const findColIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };
    
    const colIndex = {
      email: findColIndex(['email']),
      nama: findColIndex(['nama']),
      jenis_kelamin: findColIndex(['jenis_kelamin', 'kelamin', 'gender']),
      no_hp: findColIndex(['no_hp', 'hp', 'telepon', 'phone']),
      asal_kota: findColIndex(['asal_kota', 'kota', 'city']),
      kategori_usia: findColIndex(['kategori_usia', 'usia', 'umur', 'age']),
      sosmed_type: findColIndex(['sosmed_type', 'media_type', 'platform']),
      sosmed_username: findColIndex(['sosmed_username', 'username', 'user']),
    };

    console.log('🔍 Column indices:', colIndex);

    // Validasi kolom required
    if (colIndex.email === -1 || colIndex.nama === -1 || colIndex.no_hp === -1) {
      return NextResponse.json({
        success: false,
        message: "CSV harus punya kolom: email, nama, no_hp",
        headers_found: headers,
        expected_columns: ['email', 'nama', 'no_hp', 'asal_kota/kota', 'kategori_usia/usia', 'sosmed_type', 'sosmed_username']
      }, { status: 400 });
    }

    // Loop setiap baris data (mulai dari baris ke-1, skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));

      // Extract data berdasarkan column index yang terdeteksi
      const email = cols[colIndex.email]?.trim() || '';
      const nama = cols[colIndex.nama]?.trim() || '';
      const jenis_kelamin = colIndex.jenis_kelamin >= 0 ? (cols[colIndex.jenis_kelamin]?.trim() || '-') : '-';
      const no_hp = cols[colIndex.no_hp]?.trim() || '';
      const asal_kota = colIndex.asal_kota >= 0 ? (cols[colIndex.asal_kota]?.trim() || 'Unknown') : 'Unknown';
      const kategori_usia = colIndex.kategori_usia >= 0 ? (cols[colIndex.kategori_usia]?.trim() || 'Unknown') : 'Unknown';
      const sosmed_type = colIndex.sosmed_type >= 0 ? (cols[colIndex.sosmed_type]?.trim() || '') : '';
      const sosmed_username = colIndex.sosmed_username >= 0 ? (cols[colIndex.sosmed_username]?.trim() || '') : '';

      // Validasi data minimal
      if (!email || !nama || !no_hp) {
        console.warn(`⚠️  Skip baris (data tidak lengkap): email=${email}, nama=${nama}, no_hp=${no_hp}`);
        report.skipped++;
        continue;
      }

      // Cek Duplikat
      const existing = Order.findOne({ nama, no_hp });
      
      if (existing) {
        // Jika sudah ada tapi belum lunas, update jadi lunas
        if (existing.status_bayar !== 'settlement') {
          Order.update(existing.order_id, { status_bayar: 'settlement' });
          console.log(`✅ Updated existing order ke settlement: ${existing.order_id}`);
          report.updated++;
          // Kirim email ulang
          await sendTicketEmail(existing); 
        } else {
          console.warn(`⏭️  Skip duplikat (sudah settlement): ${nama}`);
          report.skipped++;
        }
      } else {
        // Create Baru
        const orderId = `SJF2-OFFLINE-${Date.now()}-${i}`;
        
        // --- FIX: Tambahkan jenis_kelamin di sini ---
        const newOrderData = {
          order_id: orderId,
          nama,
          email,
          no_hp,
          jenis_kelamin: jenis_kelamin || '-', // <--- KOLOM WAJIB
          asal_kota,
          kategori_usia,
          sosmed_type,
          sosmed_username,
          status_bayar: 'settlement' // Langsung lunas
        };

        Order.create(newOrderData);
        console.log(`✅ Created new order: ${orderId}`);
        
        // Kirim Email Tiket
        await sendTicketEmail(newOrderData);
        
        report.created++;
      }
    }

    return NextResponse.json({ success: true, report });

  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
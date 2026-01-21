import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// --- SETUP NODEMAILER (Copy dari helper sebelumnya) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: Buat PDF (Sama dengan lib/utils.ts)
async function createPdfBuffer(order: any) {
    return new Promise<Buffer>(async (resolve, reject) => {
        try {
            // Create PDFDocument with standard fonts (Helvetica is built-in)
            // PDFKit will use its internal font data files (now with monkey-patched fs)
            const doc = new PDFDocument({ size: [300, 600], margin: 0 });

            let buffers: any[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- WARNA TEMA ---
            const colorTopBg = '#ffffff';
            const colorBottomBg = '#87CEEB';
            const colorQrBg = '#f4f4f4';
            const colorTextMain = '#333333';
            const colorAccent = '#0e2a47';

            // --- BACKGROUND LAYER ---
            doc.rect(0, 0, 300, 600).fill(colorBottomBg);

            // Putih dengan Chevron
            doc.save();
            doc.moveTo(0, 0)
                .lineTo(300, 0)
                .lineTo(300, 390)
                .lineTo(150, 425)
                .lineTo(0, 390)
                .lineTo(0, 0)
                .fill(colorTopBg);
            doc.restore();

            // --- HEADER (BANNER & URL) ---
            try {
                const bannerPath = path.join(process.cwd(), 'public/assets/banner.png');
                if (fs.existsSync(bannerPath)) {
                    doc.image(bannerPath, 100, 20, { width: 100 });
                }
            } catch (e) { }

            doc.font('Helvetica-Bold').fontSize(9).fillColor(colorTextMain)
                .text('WWW.SOLOJAPANESEFESTIVAL.ONLINE', 0, 55, { align: 'center' });

            // --- QR CODE AREA ---
            doc.roundedRect(65, 80, 170, 170, 10).fill(colorQrBg);
            const qrData = await QRCode.toDataURL(order.order_id, { margin: 0, width: 150 });
            doc.image(qrData, 75, 90, { width: 150 });

            // --- JUDUL TIKET ---
            doc.font('Helvetica-Bold').fontSize(30).fillColor(colorAccent)
                .text('E-TICKET', 0, 260, { align: 'center' });

            doc.font('Helvetica').fontSize(12).fillColor('#666666')
                .text('DAY PASS - 15 FEB 2026', 0, 295, { align: 'center' });

            // --- PRESENTED BY SECTION ---
            const presentedY = 320;
            doc.font('Helvetica').fontSize(8).fillColor('#888888')
                .text('Presented by', 0, presentedY, { align: 'center' });

            try {
                const logoPath = path.join(process.cwd(), 'public/assets/logoblack.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 130, presentedY + 15, { width: 40 });
                } else {
                    doc.font('Helvetica-Bold').fontSize(10).fillColor(colorTextMain)
                        .text('AWSM ORGANIZER', 0, presentedY + 20, { align: 'center' });
                }
            } catch (e) { }

            const linkY = presentedY + 60;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(colorTextMain)
                .text('awsm.eventorganizer', 0, linkY, {
                    align: 'center',
                    link: 'https://instagram.com/awsm.eventorganizer',
                    underline: false
                });

            // --- KONTEN BAWAH (DETAIL EVENT) ---
            const contentStartY = 445;

            doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000')
                .text('ORDER DETAIL', 0, contentStartY, { align: 'center' });

            doc.font('Helvetica').fontSize(10).fillColor('#333333')
                .text('EVENT PLACE - LOKANANTA BLOC', 0, contentStartY + 25, { align: 'center' });

            // --- GRID DETAIL DATA ---
            const col1X = 30;
            const col2X = 160;
            const row1Y = contentStartY + 50;
            const row2Y = row1Y + 35;

            // Label Style
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');

            doc.text('Ticket ID :', col1X, row1Y);
            doc.font('Helvetica').fontSize(12).text(order.order_id, col1X, row1Y + 15);

            doc.font('Helvetica-Bold').fontSize(10).text('Name :', col2X, row1Y);
            doc.font('Helvetica').fontSize(12).text(order.nama.toUpperCase().substring(0, 16), col2X, row1Y + 15);

            doc.font('Helvetica-Bold').fontSize(10).text('Date :', col1X, row2Y);
            doc.font('Helvetica').fontSize(12).text('15.02.2026', col1X, row2Y + 15);

            doc.font('Helvetica-Bold').fontSize(10).text('Status :', col2X, row2Y);

            let statusColor = '#000000';
            let statusText = order.status_bayar.toUpperCase();
            if (order.status_bayar !== 'settlement') {
                statusColor = '#cc0000';
                statusText += ' (UNPAID)';
            }

            doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(12)
                .text(statusText, col2X, row2Y + 15);

            doc.end();
        } catch (error) {
            reject(error);
        }
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
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error(`❌ PDF buffer kosong untuk ${order.email}`);
      return;
    }

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
        const orderId = `SJF2-${Date.now()}-${i}`;
        
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
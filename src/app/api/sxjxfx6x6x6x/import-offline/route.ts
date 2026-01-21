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
    const pdfBuffer = await createPdfBuffer(order);
    await transporter.sendMail({
      from: `"Solo Japanese Festival #2" <${process.env.EMAIL_USER}>`,
      to: order.email,
      subject: 'Tiket Event SJF #2 (Offline Purchase)',
      html: `<h3>Halo, ${order.nama}!</h3><p>Terima kasih telah membeli tiket secara offline. Berikut tiket Anda.</p>`,
      attachments: [{ filename: `Tiket-${order.nama}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
    });
  } catch (err) {
    console.error("Gagal kirim email offline:", err);
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

    const lines = csvText.split('\n');
    const report = { created: 0, skipped: 0, updated: 0 };

    // Loop setiap baris (Skip header baris pertama jika ada 'email')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV manual (split koma)
      // Format: email, nama, jenis_kelamin, hp, kota, usia, sosmed_type, sosmed_user
      const cols = line.split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));

      // Skip header
      if (cols[0].toLowerCase() === 'email' && cols[1].toLowerCase() === 'nama') continue;

      // Pastikan jumlah kolom cukup (minimal 8)
      if (cols.length < 8) {
        report.skipped++;
        continue;
      }

      const [email, nama, jenis_kelamin, no_hp, asal_kota, kategori_usia, sosmed_type, sosmed_username] = cols;

      // Cek Duplikat
      const existing = Order.findOne({ nama, no_hp });
      
      if (existing) {
        // Jika sudah ada tapi belum lunas, update jadi lunas
        if (existing.status_bayar !== 'settlement') {
          Order.update(existing.order_id, { status_bayar: 'settlement' });
          report.updated++;
          // Kirim email (opsional)
          // sendTicketEmail(existing); 
        } else {
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
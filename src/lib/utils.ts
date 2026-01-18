import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import midtransClient from 'midtrans-client';
import { Order } from './database';

// Get the project root directory
const PROJECT_ROOT = process.cwd();

// Monkey-patch fs.readFileSync to handle PDFKit font loading issues
// PDFKit uses __dirname which resolves to /ROOT in Next.js turbopack
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function (filePath: string | Buffer, encoding?: BufferEncoding | null): any {
    let pathStr = typeof filePath === 'string' ? filePath : filePath.toString();

    // Handle /ROOT/node_modules/pdfkit paths (direct case)
    if (pathStr.includes('/ROOT/node_modules/pdfkit')) {
        const actualPath = pathStr.replace('/ROOT/node_modules', path.join(PROJECT_ROOT, 'node_modules'));
        if (fs.existsSync(actualPath)) {
            return originalReadFileSync.call(fs, actualPath, encoding);
        }
    }

    // If trying to read from /ROOT/solo-event/node_modules/pdfkit, redirect to actual location
    if (pathStr.includes('/ROOT/solo-event/node_modules/pdfkit')) {
        const actualPath = pathStr.replace('/ROOT/solo-event', PROJECT_ROOT);
        if (fs.existsSync(actualPath)) {
            return originalReadFileSync.call(fs, actualPath, encoding);
        }
    }

    return originalReadFileSync.call(fs, filePath, encoding);
} as any;

// Setup Nodemailer
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Setup Midtrans
let snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function createPdfBuffer(order: any) {
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

export async function sendTicketEmail(order: any) {
    try {
        console.log(`Mengirim email ke ${order.email}...`);
        const pdfBuffer = await createPdfBuffer(order);
        const mailOptions = {
            from: `"Solo Japanesse Festival #2" <${process.env.EMAIL_USER}>`,
            to: order.email,
            subject: 'Selamat bergabung menjadi warga Desa Ninja Shinobi!',
            html: `
                <h3>Halo, ${order.nama}!</h3>
                <p>Berikut adalah e-tiket Anda.</p>
                <p>Silahkan tunjukkan kepada panitia di venue ya.</p>
                <p>Mohon jaga baik-baik tiket ini dan jangan sampai hilang.</p>
                <p>Terima kasih telah bergabung di Solo Japanese Festival #2!</p>
                <br/>
                <p>Salam,<br/>Minoha.</p>
            `,
            attachments: [{ filename: `Tiket-${order.nama}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        };
        await transporter.sendMail(mailOptions);
        console.log("Email terkirim.");
    } catch (error) {
        console.error("Gagal kirim email:", error);
    }
}

export async function updateStatusFromMidtrans(order: any) {
    if (order.status_bayar === 'settlement') return;

    try {
        const statusResponse = await snap.transaction.status(order.order_id);
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        let newStatus = order.status_bayar;

        if (transactionStatus == 'capture') {
            if (fraudStatus == 'accept') newStatus = 'settlement';
        } else if (transactionStatus == 'settlement') {
            newStatus = 'settlement';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'expire') {
            newStatus = 'failed';
        }

        if (newStatus !== order.status_bayar) {
            await order.update({ status_bayar: newStatus });
        }
    } catch (e: any) {
        console.log(`Gagal cek Midtrans untuk ${order.order_id}: ${e.message}`);
    }
}

export async function getMidtransSnap() {
    return snap;
}

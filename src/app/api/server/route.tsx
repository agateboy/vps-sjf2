// app/api/server/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import midtransClient from 'midtrans-client';
import { Sequelize, DataTypes } from 'sequelize';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import creds from '../../../../google-credentials.json';
import sqlite3 from 'sqlite3';

const upload = multer({ dest: 'uploads/' });

// --- DATABASE ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  dialectModule: sqlite3, // <--- TAMBAHKAN INI
  logging: false,
});

const Order = sequelize.define('Order', {
  order_id: { type: DataTypes.STRING, unique: true },
  nama: DataTypes.STRING,
  email: DataTypes.STRING,
  no_hp: DataTypes.STRING,
  asal_kota: DataTypes.STRING,
  kategori_usia: DataTypes.STRING,
  sosmed_type: DataTypes.STRING,
  sosmed_username: DataTypes.STRING,
  status_bayar: { type: DataTypes.STRING, defaultValue: 'pending' },
  status_tiket: { type: DataTypes.STRING, defaultValue: 'belum_masuk' },
});

sequelize.sync({ alter: true });

// --- MIDTRANS ---
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

// --- NODEMAILER ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

// --- BANTUAN: PDF ---
async function createPdfBuffer(order: any): Promise<Buffer> {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({ size: [300, 450], margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    try {
      doc.image('assets/banner.png', 75, 10, { width: 150 });
    } catch {}

    doc.y = 80;
    doc.font('Helvetica').fontSize(10).fillColor('#000000').text('15 Feb 2026 | Lokananta Bloc', { align: 'center' });
    doc.moveDown(0.5).moveTo(20, doc.y).lineTo(280, doc.y).stroke('#ecf0f1').moveDown(1);

    const startY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
    doc.text('Nama:', 30, startY);
    doc.text('Email:', 30, startY + 20);
    doc.text('No HP:', 30, startY + 40);
    doc.text('ID Order:', 30, startY + 60);

    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    doc.text(order.nama, 100, startY);
    doc.text(order.email, 100, startY + 20);
    doc.text(order.no_hp, 100, startY + 40);
    doc.text(order.order_id, 100, startY + 60);

    const qrData = await QRCode.toDataURL(order.order_id, { margin: 1 });
    doc.image(qrData, 75, startY + 80, { width: 150 });

    doc.font('Helvetica').fontSize(8).fillColor('#000000').text('Mohon jaga e-tiket dengan baik. Kehilangan e-tiket bukan tanggung jawab kami.', 30, 400, { width: 240, align: 'center' });

    doc.end();
  });
}

// --- BANTUAN: SEND EMAIL ---
async function sendTicketEmail(order: any) {
  const pdfBuffer = await createPdfBuffer(order);
  await transporter.sendMail({
    from: `"Solo Japanese Festival #2" <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: 'Tiket Anda SJF #2',
    html: `<h3>Halo, ${order.nama}!</h3><p>Terima kasih sudah membeli tiket. Silakan cek PDF terlampir.</p>`,
    attachments: [{ filename: `Tiket-${order.nama}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }],
  });
}

// --- AUTH UTAMA (Basic Auth) ---
function checkAdminAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.split(' ')[1] || '';
  const [user, pass] = Buffer.from(token, 'base64').toString().split(':');
  return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
}

// --- ROUTE HANDLER ---
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // --- CHECKOUT ---
    if (path.endsWith('/checkout')) {
      const data = await req.json();
      const { nama, email, no_hp, sosmed_type, sosmed_username, asal_kota, kategori_usia } = data;

      const existingTicket = await Order.findOne({ where: { nama, no_hp, status_bayar: 'settlement' } });
      if (existingTicket) return NextResponse.json({ message: 'Sudah terdaftar.' }, { status: 400 });

      const orderId = `SJF#2-${Date.now()}`;
      const transaction = await snap.createTransaction({
        transaction_details: { order_id: orderId, gross_amount: 100 },
        customer_details: { first_name: nama, email, phone: no_hp, city: asal_kota },
      });

      await Order.create({ order_id: orderId, nama, email, no_hp, sosmed_type, sosmed_username, asal_kota, kategori_usia, status_bayar: 'pending' });
      return NextResponse.json({ token: transaction.token, order_id: orderId });
    }

    // --- NOTIFICATION MIDTRANS ---
    if (path.endsWith('/notification')) {
      const body = await req.json();
      const statusResponse = await snap.transaction.notification(body);
      const order = await Order.findOne({ where: { order_id: statusResponse.order_id } });

      if (order) {
        if (['capture', 'settlement'].includes(statusResponse.transaction_status) && (order as any).status_bayar !== 'settlement') {
          await order.update({ status_bayar: 'settlement' });
          sendTicketEmail(order);
        } else if (['cancel', 'deny', 'expire'].includes(statusResponse.transaction_status)) {
          await order.update({ status_bayar: 'failed' });
        }
      }
      return NextResponse.json({ status: 'OK' });
    }

    // --- IMPORT CSV OFFLINE ---
    if (path.endsWith('/sxjxfx6x6x6x/import-offline')) {
      if (!checkAdminAuth(req)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

      // Multer tidak bisa langsung di Next.js route, harus pakai formidable di Next.js.
      return NextResponse.json({ message: 'CSV Import siap, tapi perlu pakai formidable di Next.js' });
    }

    return NextResponse.json({ message: 'Path tidak ditemukan' }, { status: 404 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: 'Server Error', error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // --- PREVIEW PDF ---
    if (path.startsWith('/ticket/view/')) {
      const order_id = path.split('/').pop();
      if (!order_id) return NextResponse.json({ message: 'Order ID tidak ditemukan' }, { status: 400 });

      const order = await Order.findOne({ where: { order_id, status_bayar: 'settlement' } });
      if (!order) return NextResponse.json({ message: 'Tiket belum lunas atau tidak ditemukan.' }, { status: 404 });

      const pdfBuffer = await createPdfBuffer(order);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename=tiket-${(order as any).nama}.pdf`,
        },
      });
    }

    // --- DOWNLOAD PDF ---
    if (path.startsWith('/ticket/download/')) {
      const order_id = path.split('/').pop();
      if (!order_id) return NextResponse.json({ message: 'Order ID tidak ditemukan' }, { status: 400 });

      const order = await Order.findOne({ where: { order_id, status_bayar: 'settlement' } });
      if (!order) return NextResponse.json({ message: 'Tiket belum lunas atau tidak ditemukan.' }, { status: 404 });

      const pdfBuffer = await createPdfBuffer(order);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=tiket-${(order as any).nama}.pdf`,
        },
      });
    }

    return NextResponse.json({ message: 'Path tidak ditemukan' }, { status: 404 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: 'Server Error', error: err.message }, { status: 500 });
  }
}

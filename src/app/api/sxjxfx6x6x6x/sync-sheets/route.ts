import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as fs from 'fs';

function basicAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');

  if (!auth || !auth.startsWith('Basic ')) {
    return false;
  }

  const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
  const [user, pass] = credentials.split(':');

  return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
}

export async function GET(req: NextRequest) {
  if (!basicAuth(req)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  try {
    await initializeDatabase();

    const orders = Order.findAll({ status_bayar: 'settlement' });

    if (orders.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Belum ada data tiket lunas untuk disinkronkan."
      });
    }

    // Load Google credentials
    const credsPath = `${process.cwd()}/google-credentials.json`;
    if (!fs.existsSync(credsPath)) {
      return NextResponse.json({
        success: false,
        message: "File google-credentials.json tidak ditemukan."
      });
    }

    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));

    const serviceAccountAuth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID as string, serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    const headers = [
      'Order ID',
      'Nama',
      'No HP',
      'Email',
      'Asal Kota',
      'Usia',
      'Medsos Type',
      'Medsos User',
      'Status Tiket',
      'Waktu Beli'
    ];

    await sheet.clear();
    await sheet.setHeaderRow(headers);

    const rows = orders.map((o: any) => ({
      'Order ID': o.order_id,
      'Nama': o.nama,
      'No HP': `'${o.no_hp}`,
      'Email': o.email,
      'Asal Kota': o.asal_kota,
      'Usia': o.kategori_usia,
      'Medsos Type': o.sosmed_type,
      'Medsos User': o.sosmed_username,
      'Status Tiket': o.status_tiket,
      'Waktu Beli': new Date(o.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    }));

    await sheet.addRows(rows);

    return NextResponse.json({
      success: true,
      message: `Berhasil sinkronisasi ${rows.length} data ke Google Sheets!`
    });
  } catch (error: any) {
    console.error("Gagal Sync Sheets:", error);
    return NextResponse.json({
      success: false,
      message: "Gagal connect ke Google: " + error.message
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';

function basicAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');

  if (!auth || !auth.startsWith('Basic ')) {
    return false;
  }

  const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
  const [user, pass] = credentials.split(':');

  return user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS;
}

export async function POST(req: NextRequest) {
  if (!basicAuth(req)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  try {
    await initializeDatabase();

    const { qr_content } = await req.json();
    const order = Order.findOne({ order_id: qr_content });

    if (!order) {
      return NextResponse.json({ success: false, message: "TIKET TIDAK TERDAFTAR" });
    }

    if (order.status_bayar !== 'settlement') {
      return NextResponse.json({
        success: false,
        message: `STATUS: ${order.status_bayar.toUpperCase()} (Belum Lunas)`
      });
    }

    // --- PERBAIKAN LOGIKA DOUBLE SCAN ---
    if (order.status_tiket === 'sudah_masuk') {
      // Cek kapan terakhir kali tiket di-update
      const lastUpdate = new Date(order.updatedAt).getTime();
      const now = new Date().getTime();
      const diffInSeconds = (now - lastUpdate) / 1000;

      // Jika update terakhir kurang dari 15 detik yang lalu, 
      // kita anggap ini adalah double-scan dari orang yang sama.
      // Tetap return SUCCESS agar UI tidak menampilkan error merah.
      if (diffInSeconds < 15) {
        return NextResponse.json({
          success: true,
          message: "Scan Berhasil (Scan Ulang)", 
          data: { nama: order.nama, no_hp: order.no_hp }
        });
      }

      // Jika sudah lama dipakai (lebih dari 15 detik), baru tolak.
      return NextResponse.json({ success: false, message: "ALARM: TIKET SUDAH DIPAKAI!" });
    }
    // ------------------------------------

    // Update status tiket dan timestamp (updatedAt otomatis terupdate di database.ts)
    Order.update(qr_content, { status_tiket: 'sudah_masuk' });

    return NextResponse.json({
      success: true,
      message: "Scan Berhasil",
      data: { nama: order.nama, no_hp: order.no_hp }
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}
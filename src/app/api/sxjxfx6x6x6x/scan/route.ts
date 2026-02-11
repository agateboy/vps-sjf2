import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';

function normalizeStatusMasuk(value: any): 'sudah' | 'belum' {
  const raw = String(value || '').toLowerCase().trim();
  if (raw === 'sudah' || raw === 'sudah_masuk' || raw === 'masuk') return 'sudah';
  if (raw === 'belum' || raw === 'belum_masuk' || raw === 'keluar') return 'belum';
  return 'belum';
}

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

    const { qr_content, mode, confirm_masuk } = await req.json();
    const scanMode = mode === 'keluar' ? 'keluar' : mode === 'masuk' ? 'masuk' : null;
    if (!scanMode) {
      return NextResponse.json({ success: false, message: 'MODE SCAN TIDAK VALID' }, { status: 400 });
    }
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

    const statusMasuk = normalizeStatusMasuk(order.status_masuk || (order.status_tiket === 'sudah_masuk' ? 'sudah' : 'belum'));
    const kartuMisi = order.kartu_misi ?? (order.status_tiket === 'sudah_masuk' ? 1 : 0);

    // =============================================
    // CONFIRM MASUK (dari dialog admin)
    // confirm_masuk = 'pertama' → pertama kali, kasih kartu misi
    // confirm_masuk = 'ada_kartu' → re-entry, kartu misi ada
    // =============================================
    if (confirm_masuk === 'pertama') {
      Order.update(qr_content, {
        kartu_misi: 1,
        status_masuk: 'sudah',
        status_tiket: 'sudah_masuk'
      });
      return NextResponse.json({
        success: true,
        message: 'Masuk & Kartu Misi Diberikan',
        action: 'masuk_pertama_ok',
        data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'sudah', kartu_misi: 1 }
      });
    }

    if (confirm_masuk === 'ada_kartu') {
      Order.update(qr_content, {
        status_masuk: 'sudah',
        status_tiket: 'sudah_masuk'
      });
      return NextResponse.json({
        success: true,
        message: 'Masuk Kembali',
        action: 'masuk_lagi',
        data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'sudah', kartu_misi: kartuMisi }
      });
    }

    // =============================================
    // PINTU MASUK: khusus masuk saja
    // =============================================
    if (scanMode === 'masuk') {
      // Sudah di dalam → TOLAK
      if (statusMasuk === 'sudah') {
        return NextResponse.json({ success: false, message: 'DITOLAK: Tiket sudah di dalam' });
      }

      // Pertama kali (belum pernah masuk, belum punya kartu misi)
      // → Tampilkan konfirmasi "Sudah kasih kartu misi?"
      if (!kartuMisi) {
        return NextResponse.json({
          success: true,
          message: 'Konfirmasi Masuk Pertama Kali',
          action: 'konfirmasi_masuk_pertama',
          data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'belum', kartu_misi: 0 }
        });
      }

      // Re-entry (pernah masuk, punya kartu misi, status keluar)
      // → Admin cek kartu misi ADA atau TIDAK
      return NextResponse.json({
        success: true,
        message: 'Admin Cek Kartu Misi ADA atau TIDAK',
        action: 'cek_kartu_misi',
        data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'belum', kartu_misi: kartuMisi }
      });
    }

    // =============================================
    // PINTU KELUAR: khusus keluar saja (otomatis)
    // =============================================

    // Belum pernah masuk → tolak
    if (statusMasuk === 'belum' && !kartuMisi) {
      return NextResponse.json({
        success: false,
        message: 'Silahkan scan di pintu masuk terlebih dahulu'
      });
    }

    // Sudah di luar → info saja
    if (statusMasuk === 'belum') {
      return NextResponse.json({
        success: false,
        message: 'Peserta sudah di luar'
      });
    }

    // Proses keluar otomatis
    Order.update(qr_content, {
      status_masuk: 'belum',
      status_tiket: 'belum_masuk'
    });

    return NextResponse.json({
      success: true,
      message: 'Scan Berhasil (Keluar)',
      action: 'keluar',
      data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'belum', kartu_misi: kartuMisi }
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}
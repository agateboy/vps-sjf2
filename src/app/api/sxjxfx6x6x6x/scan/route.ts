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

    const { qr_content, mode, confirm_kartu_misi, confirm_kartu_fisik, decision } = await req.json();
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

    if (confirm_kartu_misi) {
      Order.update(qr_content, {
        kartu_misi: 1,
        status_masuk: 'sudah',
        status_tiket: 'sudah_masuk'
      });

      return NextResponse.json({
        success: true,
        message: 'Kartu Misi Diberikan',
        action: 'kartu_diberikan',
        data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'sudah', kartu_misi: 1 }
      });
    }

    if (confirm_kartu_fisik) {
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
    // PINTU MASUK: hanya untuk masuk
    // =============================================
    if (scanMode === 'masuk') {
      // Sudah di dalam → TOLAK
      if (statusMasuk === 'sudah') {
        return NextResponse.json({ success: false, message: 'DITOLAK: QR sudah di dalam' });
      }

      // Masuk kembali (pernah masuk sebelumnya, punya kartu misi) → cek kartu misi
      if (kartuMisi) {
        return NextResponse.json({
          success: true,
          message: 'Admin Cek Kartu Misi ADA atau TIDAK',
          action: 'cek_kartu_misi',
          data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'belum', kartu_misi: kartuMisi }
        });
      }

      // Pertama kali masuk → berikan kartu misi
      Order.update(qr_content, {
        status_masuk: 'sudah',
        status_tiket: 'sudah_masuk'
      });

      return NextResponse.json({
        success: true,
        message: 'Berikan Kartu Misi',
        action: 'beri_kartu',
        data: {
          nama: order.nama,
          no_hp: order.no_hp,
          status_masuk: 'sudah',
          kartu_misi: kartuMisi,
          kartu_misi_pending: true
        }
      });
    }

    // =============================================
    // PINTU KELUAR: ada pilihan masuk atau keluar
    // =============================================

    // Pertama kali (belum pernah masuk, tidak punya kartu misi) → harus scan di pintu masuk dulu
    if (statusMasuk === 'belum' && !kartuMisi) {
      return NextResponse.json({
        success: false,
        message: 'Silahkan scan di pintu masuk'
      });
    }

    // Belum ada keputusan → tampilkan pilihan keluar/masuk
    if (!decision) {
      return NextResponse.json({
        success: true,
        message: 'Pilih Aksi Keluar/Masuk',
        action: 'pilih_keluar_masuk',
        data: { nama: order.nama, no_hp: order.no_hp, status_masuk: statusMasuk, kartu_misi: kartuMisi }
      });
    }

    // Pilih MASUK dari pintu keluar
    if (decision === 'masuk') {
      // Sudah di dalam → TOLAK
      if (statusMasuk === 'sudah') {
        return NextResponse.json({ success: false, message: 'DITOLAK: QR sudah di dalam' });
      }

      // Masuk kembali → cek kartu misi
      if (kartuMisi) {
        return NextResponse.json({
          success: true,
          message: 'Admin Cek Kartu Misi ADA atau TIDAK',
          action: 'cek_kartu_misi',
          data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'belum', kartu_misi: kartuMisi }
        });
      }

      // Seharusnya tidak sampai sini (belum+noKartu sudah ditolak di atas)
      return NextResponse.json({ success: false, message: 'Silahkan scan di pintu masuk' });
    }

    // Pilih KELUAR dari pintu keluar
    if (statusMasuk === 'belum') {
      return NextResponse.json({
        success: true,
        message: 'Peserta sudah di luar',
        action: 'keluar_tetap',
        data: { nama: order.nama, no_hp: order.no_hp, status_masuk: 'belum', kartu_misi: kartuMisi }
      });
    }

    // Proses keluar
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
import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import { getMidtransSnap, updateStatusFromMidtrans } from '@/lib/utils';
import db from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();

    // 1. Tambahkan jenis_kelamin di sini (diambil dari request body)
    const { 
      nama, 
      email, 
      no_hp, 
      jenis_kelamin, // <--- BARU
      sosmed_type, 
      sosmed_username, 
      asal_kota, 
      kategori_usia 
    } = await req.json();

    // Cek Duplikat: nama + no_hp
    // Tapi izinkan re-order jika order sebelumnya sudah failed/expired
    const existing = db.prepare('SELECT * FROM orders WHERE nama = ? AND no_hp = ?').get(nama, no_hp) as any;
    
    if (existing) {
      // Jika status pending, coba check ke Midtrans dulu (auto-sync)
      if (existing.status_bayar === 'pending') {
        try {
          console.log(`🔄 Auto-checking payment status untuk ${existing.order_id}...`);
          await updateStatusFromMidtrans(existing);
          
          // Re-fetch data setelah update
          const updated = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(existing.order_id) as any;
          
          // Jika berhasil di-sync ke settlement, tolak
          if (updated.status_bayar === 'settlement') {
            return NextResponse.json({ 
              success: false, 
              message: 'Sudah ada tiket dengan nama dan nomor HP yang sama yang sudah lunas.' 
            }, { status: 400 });
          }
          
          // Jika sudah berubah ke failed, hapus dan allow re-order
          if (updated.status_bayar === 'failed') {
            db.prepare('DELETE FROM orders WHERE order_id = ?').run(existing.order_id);
            console.log(`✅ Deleted expired order: ${existing.order_id}`);
          } else {
            // Masih pending setelah sync - tolak
            return NextResponse.json({ 
              success: false, 
              message: 'Masih ada tiket yang sedang menunggu pembayaran dengan nama dan nomor HP ini. Silakan selesaikan pembayaran atau tunggu hingga expired (15 menit).' 
            }, { status: 400 });
          }
        } catch (err) {
          console.warn('⚠️  Failed to sync payment status:', err);
          // Fallback: cek waktu dibuat
          const createdTime = new Date(existing.createdAt).getTime();
          const nowTime = new Date().getTime();
          const diffMinutes = (nowTime - createdTime) / (1000 * 60);
          
          if (diffMinutes > 15) {
            // Sudah lebih dari 15 menit, anggap expired dan hapus
            db.prepare('DELETE FROM orders WHERE order_id = ?').run(existing.order_id);
            console.log(`✅ Auto-deleted order older than 15 min: ${existing.order_id}`);
          } else {
            // Masih dalam 15 menit, tolak
            return NextResponse.json({ 
              success: false, 
              message: `Masih ada tiket menunggu pembayaran. Tunggu ${Math.ceil(15 - diffMinutes)} menit lagi atau coba ulang.` 
            }, { status: 400 });
          }
        }
      } else if (existing.status_bayar === 'settlement') {
        // Sudah lunas - tidak boleh duplicate
        return NextResponse.json({ 
          success: false, 
          message: 'Sudah ada tiket dengan nama dan nomor HP yang sama yang sudah lunas.' 
        }, { status: 400 });
      } else if (existing.status_bayar === 'failed') {
        // Failed - hapus dan allow re-order
        db.prepare('DELETE FROM orders WHERE order_id = ?').run(existing.order_id);
        console.log(`✅ Deleted failed order: ${existing.order_id}`);
      }
    }
    
    const orderId = `SJF2-${Date.now()}`;

    // 2. Simpan jenis_kelamin ke database
    // Pastikan Order.create ini synchronous (jika pakai better-sqlite3 wrapper)
    // Jika ini Sequelize, harusnya ada 'await' di depannya.
    Order.create({
      order_id: orderId,
      nama,
      email,
      no_hp,
      jenis_kelamin, // <--- BARU (Disimpan ke DB)
      sosmed_type,
      sosmed_username,
      asal_kota,
      kategori_usia,
      status_bayar: 'pending' // Default status
    });

    const snap = await getMidtransSnap();

    let parameter = {
      transaction_details: { order_id: orderId, gross_amount: 40000 },
      customer_details: { 
        first_name: nama, 
        email: email, 
        phone: no_hp,
        billing_address: { city: asal_kota }
      }
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({ token: transaction.token, order_id: orderId });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
  }
}
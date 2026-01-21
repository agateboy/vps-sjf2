import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import { getMidtransSnap } from '@/lib/utils';
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
      // Jika ada order dengan nama+hp sama, cek statusnya
      if (existing.status_bayar === 'settlement') {
        // Sudah lunas - tidak boleh duplicate
        return NextResponse.json({ 
          success: false, 
          message: 'Sudah ada tiket dengan nama dan nomor HP yang sama yang sudah lunas.' 
        }, { status: 400 });
      }
      
      if (existing.status_bayar === 'pending') {
        // Masih pending (belum selesai) - tidak boleh, suruh tungggu atau coba lagi nanti
        return NextResponse.json({ 
          success: false, 
          message: 'Masih ada tiket yang sedang menunggu pembayaran dengan nama dan nomor HP ini. Silakan selesaikan pembayaran atau tunggu hingga expired (15 menit).' 
        }, { status: 400 });
      }
      
      // Jika status 'failed' atau status lainnya, boleh beli lagi (delete order lama)
      if (existing.status_bayar === 'failed') {
        db.prepare('DELETE FROM orders WHERE order_id = ?').run(existing.order_id);
        console.log(`Deleted expired order: ${existing.order_id}`);
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
      transaction_details: { order_id: orderId, gross_amount: 50000 },
      customer_details: { 
        first_name: nama, 
        email: email, 
        phone: no_hp,
        billing_address: { city: asal_kota } // Opsional: kirim kota ke Midtrans
      }
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({ token: transaction.token, order_id: orderId });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
  }
}
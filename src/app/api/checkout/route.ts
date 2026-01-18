import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import { getMidtransSnap } from '@/lib/utils';
import db from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();

    const { nama, email, no_hp, sosmed_type, sosmed_username, asal_kota, kategori_usia } = await req.json();

    // Cek Duplikat: nama + no_hp harus unik (tidak boleh sama keduanya)
    const existing = db.prepare('SELECT * FROM orders WHERE nama = ? AND no_hp = ?').get(nama, no_hp) as any;
    
    if (existing) {
      return NextResponse.json({ 
        success: false, 
        message: 'Sudah ada tiket dengan nama dan nomor HP yang sama. Gunakan nama atau nomor HP yang berbeda.' 
      }, { status: 400 });
    }
    
    const orderId = `SJF2-${Date.now()}`;

    Order.create({
      order_id: orderId,
      nama,
      email,
      no_hp,
      sosmed_type,
      sosmed_username,
      asal_kota,
      kategori_usia
    });

    const snap = await getMidtransSnap();

    let parameter = {
      transaction_details: { order_id: orderId, gross_amount: 50000 },
      customer_details: { first_name: nama, email: email, phone: no_hp }
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({ token: transaction.token, order_id: orderId });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
  }
}

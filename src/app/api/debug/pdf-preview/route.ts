import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import { createPdfBuffer } from '@/lib/utils';

export async function GET() {
  try {
    await initializeDatabase();

    const dummyOrder = {
      order_id: 'SJF2-DEMO-12345',
      nama: 'Uzumaki Naruto',
      email: 'naruto@konoha.ninja',
      no_hp: '081234567890',
      asal_kota: 'Surakarta',
      kategori_usia: '17-24',
      sosmed_type: 'Instagram',
      sosmed_username: '@naruto_hokage',
      status_bayar: 'settlement'
    };

    const pdfBuffer = await createPdfBuffer(dummyOrder);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=preview-tiket.pdf'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Gagal render preview: " + error.message },
      { status: 500 }
    );
  }
}

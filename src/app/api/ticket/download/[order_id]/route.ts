import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import { createPdfBuffer, updateStatusFromMidtrans } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    await initializeDatabase();

    const { order_id } = await params;
    const order = Order.findOne({ order_id });

    if (!order) {
      return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });
    }

    if (order.status_bayar !== 'settlement') {
      // Try to update from Midtrans
      // await updateStatusFromMidtrans(order);
    }

    const pdfBuffer = await createPdfBuffer(order);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=tiket-${order.nama}.pdf`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Gagal generate PDF" }, { status: 500 });
  }
}

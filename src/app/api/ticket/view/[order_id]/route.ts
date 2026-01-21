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
      return NextResponse.json({ message: "Data tidak ditemukan di database." }, { status: 404 });
    }

    // Jika status masih pending, coba cek ulang ke Midtrans
    if (order.status_bayar !== 'settlement') {
      await updateStatusFromMidtrans(order);
      // Refresh order object untuk dapat status terbaru
      const refreshedOrder = Order.findOne({ order_id });
      if (refreshedOrder) {
        const pdfBuffer = await createPdfBuffer(refreshedOrder);
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename=tiket-${refreshedOrder.nama}.pdf`
          }
        });
      }
    }

    const pdfBuffer = await createPdfBuffer(order);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=tiket-${order.nama}.pdf`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Gagal generate PDF: " + error.message }, { status: 500 });
  }
}

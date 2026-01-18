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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  if (!basicAuth(req)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  try {
    await initializeDatabase();

    const { order_id } = await params;
    const order = Order.findOne({ order_id });

    if (!order) {
      return NextResponse.json({
        success: false,
        message: "Order ID tidak ditemukan di Database."
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nama: order.nama,
        email: order.email,
        no_hp: order.no_hp,
        status_bayar: order.status_bayar,
        status_tiket: order.status_tiket
      }
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

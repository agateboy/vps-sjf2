import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import db from '@/lib/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  try {
    await initializeDatabase();
    const { order_id } = await params;
    const orderId = order_id;

    // Fetch order from database
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId) as any;

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }

    // If order is still pending, try to sync payment status from Midtrans
    if (order.status_bayar === 'pending') {
      try {
        const { updateStatusFromMidtrans } = await import('@/lib/utils');
        await updateStatusFromMidtrans(order);
        
        // Re-fetch updated order
        const updatedOrder = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId) as any;
        
        return NextResponse.json({ 
          success: true, 
          order: updatedOrder,
          token: updatedOrder.snap_token,
          synced: true
        });
      } catch (err) {
        console.warn('Failed to sync payment status:', err);
        
        // Return order with existing token if sync fails
        return NextResponse.json({ 
          success: true, 
          order,
          token: order.snap_token,
          synced: false
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      order,
      token: order.snap_token,
      synced: false
    });
  } catch (error: any) {
    console.error('Checkout GET Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server Error', error: error.message },
      { status: 500 }
    );
  }
}
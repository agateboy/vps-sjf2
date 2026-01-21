import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import { updateStatusFromMidtrans } from '@/lib/utils';

/**
 * Endpoint untuk recovery/manual sync payment status dari Midtrans
 * Gunakan untuk handle kasus maintenance atau missed webhooks
 * 
 * Query params:
 *   - order_id: sync hanya 1 order spesifik
 *   - status: filter orders dengan status tertentu (default: pending)
 * 
 * Contoh:
 *   GET /api/sxjxfx6x6x6x/sync-payment-status
 *   GET /api/sxjxfx6x6x6x/sync-payment-status?order_id=SJF2-1234567890
 *   GET /api/sxjxfx6x6x6x/sync-payment-status?status=pending
 */

export async function GET(req: NextRequest) {
  try {
    await initializeDatabase();

    // Validasi akses (opsional: bisa tambahkan API key atau auth)
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.SYNC_API_KEY || 'sync-secret-key';
    
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const orderId = searchParams.get('order_id');
    const statusFilter = searchParams.get('status') || 'pending';

    let ordersToSync = [];

    if (orderId) {
      // Sync 1 order spesifik
      const order = Order.findOne({ order_id: orderId });
      if (!order) {
        return NextResponse.json(
          { message: `Order ${orderId} tidak ditemukan` },
          { status: 404 }
        );
      }
      ordersToSync = [order];
    } else {
      // Sync semua orders dengan status tertentu (default: pending)
      ordersToSync = Order.findAll({ status_bayar: statusFilter });
    }

    const results = [];

    for (const order of ordersToSync) {
      const oldStatus = order.status_bayar;
      try {
        await updateStatusFromMidtrans(order);
        const updatedOrder = Order.findOne({ order_id: order.order_id });
        const newStatus = updatedOrder?.status_bayar || oldStatus;
        
        results.push({
          order_id: order.order_id,
          nama: order.nama,
          oldStatus,
          newStatus,
          changed: oldStatus !== newStatus,
          message: oldStatus !== newStatus 
            ? `Status berubah dari ${oldStatus} ke ${newStatus}`
            : 'Tidak ada perubahan'
        });
      } catch (error: any) {
        results.push({
          order_id: order.order_id,
          nama: order.nama,
          error: error.message
        });
      }
    }

    const summary = {
      totalProcessed: results.length,
      totalChanged: results.filter((r: any) => r.changed).length,
      results
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Sync payment status error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Order, initializeDatabase } from '@/lib/database';
import db from '@/lib/database';
import { sendTicketEmail } from '@/lib/utils';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    // Basic auth check (expect Basic base64(user:pass))
    const authHeader = req.headers.get('authorization') || '';
    const expected = 'Basic ' + Buffer.from(`${process.env.ADMIN_USER}:${process.env.ADMIN_PASS}`).toString('base64');
    if (!authHeader || authHeader !== expected) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { csv } = await req.json();
    if (!csv) return NextResponse.json({ success: false, message: 'csv content missing' }, { status: 400 });

    const rows: any[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from([csv]);
      stream
        .pipe(csvParser())
        .on('data', (data: any) => rows.push(data))
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err));
    });

    const report = { created: 0, updated: 0, skipped: 0, errors: 0 };

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // map columns: email,nama,hp,kota,usia,sosmed_type,sosmed_username
      const email = (r.email || r.Email || '').trim();
      const nama = (r.nama || r.nama_lengkap || r.Name || '').trim();
      const no_hp = (r.hp || r.phone || r.no_hp || '').trim();
      const asal_kota = (r.kota || r.city || '').trim() || 'Unknown';
      const kategori_usia = (r.usia || r.age || '').trim() || '';
      const sosmed_type = (r.sosmed_type || r.sosmed || '').trim() || '';
      const sosmed_username = (r.sosmed_username || r.sosmed_user || r.username || '').trim() || '';

      if (!email || !nama || !no_hp) {
        report.skipped++;
        continue;
      }

      try {
        // check existing by BOTH nama AND no_hp (not email)
        const existing = db.prepare('SELECT * FROM orders WHERE nama = ? AND no_hp = ?').get(nama, no_hp) as any;
        if (existing) {
          if (existing.status_bayar !== 'settlement') {
            Order.update(existing.order_id, { status_bayar: 'settlement' });
            // Send email after update
            const updated = Order.findOne({ order_id: existing.order_id });
            if (updated) await sendTicketEmail(updated);
            report.updated++;
          } else {
            report.skipped++;
          }
        } else {
          const orderId = `SJF2-${Date.now()}-${i}`;
          Order.create({
            order_id: orderId,
            nama,
            email,
            no_hp,
            asal_kota,
            kategori_usia,
            sosmed_type,
            sosmed_username
          });
          // mark as settlement
          Order.update(orderId, { status_bayar: 'settlement' });
          // Send email after creation
          const created = Order.findOne({ order_id: orderId });
          if (created) await sendTicketEmail(created);
          report.created++;
        }
      } catch (e) {
        console.error('Import row error', e);
        report.errors++;
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('Import failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Import error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import db from '@/lib/database';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    // Basic auth check
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

    const preview: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const email = (r.email || r.Email || '').trim();
      const nama = (r.nama || r.nama_lengkap || r.Name || '').trim();
      const no_hp = (r.hp || r.phone || r.no_hp || '').trim();
      const asal_kota = (r.kota || r.city || '').trim() || 'Unknown';
      const kategori_usia = (r.usia || r.age || '').trim() || '';
      const sosmed_type = (r.sosmed_type || r.sosmed || '').trim() || '';
      const sosmed_username = (r.sosmed_username || r.sosmed_user || r.username || '').trim() || '';

      let rowStatus = 'valid';
      if (!email || !nama || !no_hp) {
        rowStatus = 'invalid';
      } else {
        // check existing by BOTH nama AND no_hp
        const existing = db.prepare('SELECT * FROM orders WHERE nama = ? AND no_hp = ?').get(nama, no_hp) as any;
        if (existing) {
          if (existing.status_bayar === 'settlement') {
            rowStatus = 'duplicate_settled';
          } else {
            rowStatus = 'duplicate_unsettled';
          }
        }
      }

      preview.push({
        idx: i + 1,
        email,
        nama,
        no_hp,
        asal_kota,
        kategori_usia,
        sosmed_type,
        sosmed_username,
        status: rowStatus
      });
    }

    return NextResponse.json({ success: true, preview });
  } catch (error: any) {
    console.error('Preview failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Preview error' }, { status: 500 });
  }
}

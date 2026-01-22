import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// 1. Create tables if they don't exist (Updated Schema)
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    jenis_kelamin TEXT, 
    asal_kota TEXT NOT NULL,
    kategori_usia TEXT NOT NULL,
    sosmed_type TEXT NOT NULL,
    sosmed_username TEXT NOT NULL,
    status_bayar TEXT DEFAULT 'pending',
    status_tiket TEXT DEFAULT 'belum_masuk',
    payment_method TEXT,
    qris_image TEXT,
    snap_token TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 2. AUTO MIGRATION: Tambahkan kolom payment_method, qris_image, dan snap_token jika belum ada (untuk DB lama)
try {
  const columns = db.prepare("PRAGMA table_info(orders)").all() as any[];
  const hasPaymentMethod = columns.some(col => col.name === 'payment_method');
  const hasQrisImage = columns.some(col => col.name === 'qris_image');
  const hasSnapToken = columns.some(col => col.name === 'snap_token');
  
  if (!hasPaymentMethod) {
    console.log("Migrating database: Adding column 'payment_method'...");
    db.prepare("ALTER TABLE orders ADD COLUMN payment_method TEXT").run();
  }
  if (!hasQrisImage) {
    console.log("Migrating database: Adding column 'qris_image'...");
    db.prepare("ALTER TABLE orders ADD COLUMN qris_image TEXT").run();
  }
  if (!hasSnapToken) {
    console.log("Migrating database: Adding column 'snap_token'...");
    db.prepare("ALTER TABLE orders ADD COLUMN snap_token TEXT").run();
  }
} catch (error) {
  console.error("Migration warning:", error);
}

// Helper functions
export const Order = {
  // 3. Update Create Function
  create: (data: {
    order_id: string;
    nama: string;
    email: string;
    no_hp: string;
    jenis_kelamin: string;
    asal_kota: string;
    kategori_usia: string;
    sosmed_type: string;
    sosmed_username: string;
    status_bayar?: string;
    payment_method?: string;
    qris_image?: string;
    snap_token?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO orders (
        order_id, nama, email, no_hp, jenis_kelamin, 
        asal_kota, kategori_usia, sosmed_type, sosmed_username, status_bayar, payment_method, qris_image, snap_token
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      data.order_id,
      data.nama,
      data.email,
      data.no_hp,
      data.jenis_kelamin,
      data.asal_kota,
      data.kategori_usia,
      data.sosmed_type,
      data.sosmed_username,
      data.status_bayar || 'pending',
      data.payment_method || null,
      data.qris_image || null,
      data.snap_token || null
    );
  },

  findOne: (where: { order_id?: string; [key: string]: any }) => {
    if (where.order_id) {
      const stmt = db.prepare('SELECT * FROM orders WHERE order_id = ?');
      return stmt.get(where.order_id) as any;
    }
    // Tambahan: Cari berdasarkan Nama & No HP (untuk cek duplikat)
    if (where.nama && where.no_hp) {
      const stmt = db.prepare('SELECT * FROM orders WHERE nama = ? AND no_hp = ?');
      return stmt.get(where.nama, where.no_hp) as any;
    }
    return null;
  },

  findAll: (where?: { status_bayar?: string; [key: string]: any }) => {
    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (where?.status_bayar) {
      query += ' WHERE status_bayar = ?';
      params.push(where.status_bayar);
    }

    query += ' ORDER BY createdAt DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as any[];
  },

  update: (orderId: string, data: { [key: string]: any }) => {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      // Pastikan tidak mengupdate ID
      if (key !== 'id' && key !== 'order_id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    values.push(new Date().toISOString());
    values.push(orderId);

    const query = `UPDATE orders SET ${fields.join(', ')}, updatedAt = ? WHERE order_id = ?`;
    const stmt = db.prepare(query);
    return stmt.run(...values);
  }
};

export async function initializeDatabase() {
  console.log('Database ready at:', dbPath);
}

export default db;
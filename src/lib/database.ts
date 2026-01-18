import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    asal_kota TEXT NOT NULL,
    kategori_usia TEXT NOT NULL,
    sosmed_type TEXT NOT NULL,
    sosmed_username TEXT NOT NULL,
    status_bayar TEXT DEFAULT 'pending',
    status_tiket TEXT DEFAULT 'belum_masuk',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Helper functions
export const Order = {
  create: (data: {
    order_id: string;
    nama: string;
    email: string;
    no_hp: string;
    asal_kota: string;
    kategori_usia: string;
    sosmed_type: string;
    sosmed_username: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO orders (order_id, nama, email, no_hp, asal_kota, kategori_usia, sosmed_type, sosmed_username)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.order_id,
      data.nama,
      data.email,
      data.no_hp,
      data.asal_kota,
      data.kategori_usia,
      data.sosmed_type,
      data.sosmed_username
    );
  },

  findOne: (where: { order_id?: string; [key: string]: any }) => {
    if (where.order_id) {
      const stmt = db.prepare('SELECT * FROM orders WHERE order_id = ?');
      return stmt.get(where.order_id) as any;
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
      fields.push(`${key} = ?`);
      values.push(value);
    });

    values.push(new Date().toISOString());
    values.push(orderId);

    const query = `UPDATE orders SET ${fields.join(', ')}, updatedAt = ? WHERE order_id = ?`;
    const stmt = db.prepare(query);
    return stmt.run(...values);
  }
};

export async function initializeDatabase() {
  // Database is already initialized above
  console.log('Database ready at:', dbPath);
}

export default db;


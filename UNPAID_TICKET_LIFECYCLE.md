# Lifecycle Data Tiket Unpaid (Belum Bayar)

## Pertanyaan Utama
**"Jika user membeli tiket tapi belum bayar, data sudah masuk Google Sheet. Saat di-scan gagal (pending belum bayar). Jika timeout pembayaran (default 15 menit) expired, apakah akan ter-delete dari sheet?"**

---

## Jawaban Singkat: **TIDAK**

Data tiket yang belum dibayar **TIDAK akan otomatis dihapus** dari database lokal maupun Google Sheet setelah timeout pembayaran. Data tersebut akan tetap ada dengan status `pending`.

---

## Detail Lifecycle Data Tiket

### 1️⃣ **Tahap Purchase (User Membeli Tiket)**

```
User → Checkout API → Database Insert
```

**Yang terjadi:**
- Nama: `abc`, No HP: `123` → Diinsert ke tabel `orders` dengan **status_bayar = 'pending'**
- Order ID: `SJF2-{timestamp}` dibuat
- Data **TERSIMPAN di database lokal** (SQLite)
- Email tiket belum dikirim (hanya dikirim saat settlement)

**Kode referensi:** [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts#L50)

---

### 2️⃣ **Tahap Sync ke Google Sheet**

```
Admin Click "Sync" → Query: status_bayar = 'settlement' → Insert ke Sheet
```

**Yang terjadi:**
- Admin melakukan **MANUAL sync** via endpoint `/api/sxjxfx6x6x6x/sync-sheets`
- **Hanya orders dengan status `settlement` (sudah lunas)** yang masuk ke Google Sheet
- Orders dengan status `pending` **TIDAK masuk** ke Google Sheet

⚠️ **PENTING:** Data unpaid Anda (status `pending`) **TIDAK akan masuk ke Google Sheet** jika admin hanya sync lewat endpoint normal.

**Kode referensi:** [src/app/api/sxjxfx6x6x6x/sync-sheets/route.ts](src/app/api/sxjxfx6x6x6x/sync-sheets/route.ts#L30-L35)

---

### 3️⃣ **Tahap QR Scan Gate (Admin Scan Tiket)**

```
Admin Scan QR → Check Status → Accept/Reject
```

**Kondisi Berhasil:**
- ✅ Status pembayaran = `settlement` (sudah lunas)
- ✅ Status tiket = `belum_masuk` (belum pernah masuk)
- ✅ Tiket diterima, status tiket berubah jadi `sudah_masuk`

**Kondisi Gagal (Ditolak):**
- ❌ Status pembayaran = `pending` (belum bayar)
  - **Response:** `"STATUS: PENDING (Belum Lunas)"`
- ❌ Status tiket = `sudah_masuk` (sudah pernah masuk)
  - **Response:** `"ALARM: TIKET SUDAH DIPAKAI!"`

**Untuk data Anda (abc, 123 dengan status pending):**
- Scan akan **DITOLAK** dengan pesan: **`"STATUS: PENDING (Belum Lunas)"`**
- Data tiket tetap ada di database dengan status `pending`

**Kode referensi:** [src/app/api/sxjxfx6x6x6x/scan/route.ts](src/app/api/sxjxfx6x6x6x/scan/route.ts#L22-L30)

---

### 4️⃣ **Tahap Timeout Pembayaran**

```
Payment Created → 15 Menit → Timeout?
```

**Yang terjadi:**

❌ **Ada miskonsepsi di sini!** Sistem SJF2 **TIDAK memiliki auto-delete logic** berdasarkan timeout 15 menit.

**Penjelasan:**
- Midtrans (payment gateway) memiliki default timeout **15 menit** untuk pending payments
- Jika user tidak menyelesaikan pembayaran dalam 15 menit:
  - ✅ Status di Midtrans berubah ke `expire`
  - ✅ Admin bisa trigger `sync-payment-status` untuk update status lokal menjadi `failed`
  - ❌ **TAPI:** Data order **TIDAK otomatis dihapus** dari database

**Lifecycle Status:**
```
pending (0 min)
   ↓
pending (5 min) ← User mulai bayar tapi belum selesai
   ↓
pending (10 min) ← Masih menunggu
   ↓
pending (15 min) ← Timeout di Midtrans
   ↓
[Admin trigger sync] → status_bayar berubah jadi 'failed'
   ↓
failed (tetap tersimpan di DB)
```

---

### 5️⃣ **Final State: Data Tidak Dihapus**

**Database lokal (SQLite):**
```sql
SELECT * FROM orders WHERE nama = 'abc' AND no_hp = '123';
```

**Hasil (setelah timeout):**
```
id | order_id        | nama | no_hp | status_bayar | status_tiket  | createdAt
1  | SJF2-1234567890 | abc  | 123   | failed       | belum_masuk   | 2026-01-21 10:00:00
```

**Google Sheet:**
- ❌ Data **TIDAK ada** di sheet (karena sync hanya ambil `settlement`)
- Data tetap ada di database dengan status `failed`

---

## Alur Lengkap: Skenario Data Anda

```
1. User (nama: abc, no_hp: 123) click "Beli Tiket"
   ↓
2. Database: INSERT INTO orders (nama='abc', no_hp='123', status_bayar='pending', ...)
   ↓
3. Admin lihat belum bayar, tapi click "Sync to Google Sheet" (secara tidak sengaja)
   ↓
4. Sistem check: status_bayar != 'settlement' → Data TIDAK MASUK ke sheet
   ↓
5. 15 menit kemudian: Midtrans timeout status menjadi 'expire'
   ↓
6. Admin trigger sync-payment-status
   ↓
7. Database: UPDATE orders SET status_bayar='failed' WHERE order_id='...'
   ↓
8. Admin scan tiket Anda
   ↓
9. Scan rejected: "STATUS: FAILED (Belum Lunas)"
   ↓
10. END STATE:
    - Database: Data masih ada dengan status = 'failed'
    - Google Sheet: Tidak ada (tidak pernah masuk karena belum settlement)
    - User: Tidak bisa masuk gate
```

---

## Solusi: Apa yang Harus Dilakukan?

### Opsi 1: Jika Ingin Hapus Data Unpaid
Buat endpoint baru untuk **manual cleanup**:
```typescript
// DELETE /api/sxjxfx6x6x6x/cleanup-expired
// Hapus orders dengan status 'failed' yang dibuat > 1 hari yang lalu

const expiredOrders = db.prepare(`
  SELECT * FROM orders 
  WHERE status_bayar = 'failed' 
  AND datetime(createdAt) < datetime('now', '-1 day')
`).all();

expiredOrders.forEach(order => {
  db.prepare('DELETE FROM orders WHERE order_id = ?').run(order.order_id);
});
```

### Opsi 2: Jika Ingin User Bayar Ulang
User membeli tiket lagi dengan order ID baru (tidak perlu cleanup)

### Opsi 3: Jika Ingin Sinkronisasi Hanya Yang Sudah Bayar (Recommended)
✅ Sistem sudah bekerja seperti ini. Hanya data `settlement` yang masuk ke Google Sheet.

---

## Tabel Perbandingan Status

| Status | Arti | Masuk Sheet? | Bisa Scan? | Auto Delete? |
|--------|------|-------------|-----------|-------------|
| `pending` | Menunggu pembayaran | ❌ Tidak | ❌ Tidak | ❌ Tidak |
| `settlement` | Sudah lunas | ✅ Ya | ✅ Ya | ❌ Tidak |
| `failed` | Pembayaran gagal/timeout | ❌ Tidak | ❌ Tidak | ❌ Tidak |

---

## Kesimpulan

✅ **Data tiket unpaid Anda (abc, 123):**
- Tersimpan di database lokal selamanya (tidak pernah auto-delete)
- Tidak akan masuk ke Google Sheet (karena belum settlement)
- Tidak bisa di-scan (akan ditolak dengan pesan status)
- Status berubah dari `pending` → `failed` setelah timeout 15 menit (jika admin trigger sync)
- Bisa dibeli ulang dengan order ID berbeda

📌 **Rekomendasi:** Jika ingin membersihkan data unpaid yang sudah lama, buat scheduled task untuk cleanup, atau buat API endpoint manual cleanup. Tapi jangan cleanup semua—hanya yang sudah expired lebih dari X hari.


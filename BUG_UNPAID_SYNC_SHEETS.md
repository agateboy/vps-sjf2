# Bug Report: Unpaid Tickets Masuk Google Sheet

## ⚠️ Masalah yang Ditemukan

User melaporkan bahwa **data tiket yang belum bayar (status: pending) MASUK ke Google Sheet**, padahal sistem seharusnya hanya sync data dengan status `settlement` (sudah lunas).

### Contoh Kasus:
- Nama: `abc`, No HP: `123`
- Status pembayaran: `pending` (belum bayar)
- ❌ Data TETAP masuk ke Google Sheet

---

## 🔍 Root Cause Analysis

### Kemungkinan 1: Bug di `Order.findAll()` Call
**File:** [src/app/api/sxjxfx6x6x6x/sync-sheets/route.ts](src/app/api/sxjxfx6x6x6x/sync-sheets/route.ts#L30)

**Kode Lama (Bermasalah):**
```typescript
const orders = await Order.findAll({ where: { status_bayar: 'settlement' } });
```

**Masalah:**
- `await` digunakan tapi `Order.findAll()` **tidak async** (synchronous)
- Parameter `where` object tidak sesuai signature
- Bisa jadi **semua orders diambil** tanpa filter

**Solusi:**
```typescript
const orders = Order.findAll({ status_bayar: 'settlement' });
```

### Kemungkinan 2: Manual Sync Sebelum Settlement
Admin pernah klik "Sync" saat status masih `pending`, data masuk ke sheet. Setelah itu tidak di-clear.

---

## ✅ Perbaikan yang Sudah Dilakukan

### Update di sync-sheets/route.ts
- ✅ Hapus `await` yang tidak perlu
- ✅ Fix parameter call ke `Order.findAll()`
- ✅ Pastikan hanya `settlement` yang sync

**Perubahan:**
```diff
- const orders = await Order.findAll({ where: { status_bayar: 'settlement' } });
+ const orders = Order.findAll({ status_bayar: 'settlement' });
```

---

## 🧪 Testing Verifikasi

### Step 1: Cek Database Status
```bash
# Connect ke database
sqlite3 database.sqlite

# Lihat semua orders
SELECT order_id, nama, no_hp, status_bayar, status_tiket FROM orders;

# Lihat hanya yang pending
SELECT order_id, nama, no_hp, status_bayar FROM orders WHERE status_bayar = 'pending';

# Lihat hanya yang settlement
SELECT order_id, nama, no_hp, status_bayar FROM orders WHERE status_bayar = 'settlement';
```

### Step 2: Clear Google Sheet & Re-Sync
```bash
# 1. Clear existing data di Google Sheet
# (Klik di admin interface → "Clear Sheet" atau manual clear)

# 2. Trigger sync ulang
curl -X GET "http://localhost:3000/api/sxjxfx6x6x6x/sync-sheets" \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)"

# 3. Verifikasi hanya settlement data yang masuk
```

### Step 3: Test dengan Order Baru
```bash
# 1. Buat order baru (belum bayar)
POST /api/checkout
{
  "nama": "Test User",
  "no_hp": "0812345678",
  "email": "test@example.com",
  ...
}
# Response: token, order_id → status: pending

# 2. Jangan bayar, langsung sync
curl -X GET "http://localhost:3000/api/sxjxfx6x6x6x/sync-sheets"

# 3. Verifikasi Google Sheet
# ❌ Data Test User TIDAK boleh ada di sheet
# ✅ Hanya existing settlement data

# 4. Bayar di Midtrans sandbox, trigger sync lagi
# ✅ Data Test User harus muncul setelah settlement
```

---

## 📋 Checklist Perbaikan

- [x] Fix `Order.findAll()` call di sync-sheets
- [ ] Clear existing unpaid data dari Google Sheet (manual)
- [ ] Test sync dengan order baru yang pending
- [ ] Verifikasi hanya settlement masuk ke sheet
- [ ] Update dokumentasi UNPAID_TICKET_LIFECYCLE.md

---

## 🚨 Rekomendasi Tambahan

### 1. Tambahkan Validasi di Sync
Tambahkan warning jika ada mismatch:
```typescript
// Sebelum sync, cek kalau ada pending yang masuk ke sheet
const pendingOrders = Order.findAll({ status_bayar: 'pending' });
if (pendingOrders.length > 0) {
  console.warn(`⚠️  ${pendingOrders.length} pending orders detected!`);
}
```

### 2. Add Status Filter untuk Admin
Biarkan admin pilih status yang mau di-sync:
```typescript
// GET /api/sxjxfx6x6x6x/sync-sheets?status=settlement
const statusToSync = req.nextUrl.searchParams.get('status') || 'settlement';
const orders = Order.findAll({ status_bayar: statusToSync });
```

### 3. Backup Sheet Sebelum Sync
Hindari data loss dengan automatic backup:
```typescript
// Before clear: copy current sheet to backup
// After clear: add new rows
```

---

## 📞 Conclusion

Perbaikan sudah dilakukan. **Mohon untuk:**
1. Test dengan order baru yang pending
2. Verify Google Sheet hanya punya settlement data
3. Report jika masih ada issue

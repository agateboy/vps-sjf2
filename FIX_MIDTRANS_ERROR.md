# Fix: Midtrans "Transaksi Tidak Ditemukan" Error

## 🎯 Masalah yang Ditemukan

User mendapat error **"Transaksi tidak ditemukan"** di halaman pembayaran Midtrans meskipun:
- ✅ Sudah production mode
- ✅ Access key benar
- ✅ Ada active payment di Midtrans dashboard

## 🔍 Root Cause

Ada **2 bug kritis** di kode:

### **Bug 1: Sandbox URL Digunakan untuk Production**
File: [src/app/beli-tiket/page.tsx](src/app/beli-tiket/page.tsx#L76)

**Kode Lama (Masalah):**
```javascript
script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'; // ← SANDBOX URL
script.setAttribute('data-client-key', 'SB-Mid-client-XXXX'); // ← HARDCODED SANDBOX KEY
```

**Penjelasan:**
- Snap Token dibuat di **production environment** (server)
- Tapi halaman pembayaran load Snap script dari **sandbox.midtrans.com**
- Mismatch environment → Transaksi tidak ditemukan

### **Bug 2: Client Key Hardcoded dan Tidak Valid**
`data-client-key` di-hardcode jadi `'SB-Mid-client-XXXX'` → Invalid token

---

## ✅ Solusi yang Sudah Dilakukan

### 1. Update [src/app/beli-tiket/page.tsx](src/app/beli-tiket/page.tsx#L76-L83)

**Kode Baru (Fixed):**
```javascript
const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
script.src = isProduction 
  ? 'https://app.midtrans.com/snap/snap.js'           // Production
  : 'https://app.sandbox.midtrans.com/snap/snap.js';  // Sandbox
script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
```

**Keuntungan:**
- ✅ Gunakan production URL saat production
- ✅ Client key dari environment variable (valid)
- ✅ Automatic switch berdasarkan environment

### 2. Update [.env](.env) File

**Kode Lama:**
```dotenv
MIDTRANS_IS_PRODUCTION=false
# Tidak ada NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
```

**Kode Baru:**
```dotenv
MIDTRANS_IS_PRODUCTION=true
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
```

---

## 📋 Checklist Verifikasi

Setelah perbaikan, lakukan **langkah-langkah ini**:

### Step 1: Verify Environment Variables
```bash
# Pastikan .env sudah ter-update
cat .env | grep MIDTRANS

# Output harus:
# MIDTRANS_IS_PRODUCTION=true
# NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
# NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-...
```

### Step 2: Restart Development Server
```bash
# Kill terminal yang sedang running (Ctrl+C)
npm run dev

# Tunggu hingga "ready on http://localhost:3000"
```

### Step 3: Test Pembayaran di Halaman
1. Buka http://localhost:3000/beli-tiket
2. Isi form dengan data test:
   - Nama: Test User
   - HP: 081234567890
   - Email: test@example.com
3. Click "Bayar Sekarang"
4. **Check di DevTools (F12) → Network tab:**
   - Cari request ke script `app.midtrans.com` (bukan sandbox)
   - Lihat di header: `data-client-key` harus valid (bukan `SB-Mid-client-XXXX`)

### Step 4: Verify Snap Token
Di DevTools Console, saat halaman pembayaran muncul:
```javascript
// Cek apakah Snap script loaded
console.log(window.snap);  // Harus ada object Snap

// Cek apakah token terkirim
// Lihat Network → setiap request, cek response dari /api/checkout
// Response harus: { token: "xxxxx", order_id: "SJF2-..." }
```

### Step 5: Complete Test Payment
1. Di halaman pembayaran, pilih metode pembayaran
2. **Perhatian:** Jika masih error "Transaksi tidak ditemukan":
   - ❌ Berarti masih mismatch environment
   - ❌ Cek lagi `.env` file sudah restart server
   - ❌ Clear browser cache (Ctrl+Shift+Del)

---

## 🔍 Debugging Lebih Lanjut

Jika masih error, cek **hal-hal ini**:

### 1. Verify Midtrans Account
- Buka https://app.midtrans.com → **Production Mode** (bukan Sandbox)
- Settings → Access Keys
- Pastikan `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` cocok di `.env`

### 2. Check Server Logs
Terminal di mana Anda run `npm run dev`:
```
# Saat user checkout, cari log:
# ✅ "Checkout Error:" atau error lainnya?
# ✅ Apakah Snap transaction berhasil dibuat?
```

### 3. Cek di Midtrans Dashboard
- Buka https://app.midtrans.com → Transactions
- Cari order_id Anda (SJF2-xxxx)
- Lihat status: `pending` atau error?

### 4. Clear Cache & Rebuild
```bash
# Jika perubahan ENV tidak terbaca
rm -rf .next
npm run dev

# Atau build production
npm run build
npm start
```

---

## 📊 Environment Variable Reference

| Variable | Server | Client | Nilai | Tujuan |
|----------|--------|--------|-------|--------|
| `MIDTRANS_SERVER_KEY` | ✅ | ❌ | Production key | Generate token di server |
| `MIDTRANS_CLIENT_KEY` | ✅ | ❌ | Production key | Untuk Midtrans internal |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | ✅ | ✅ | Production key | Load Snap script di frontend |
| `MIDTRANS_IS_PRODUCTION` | ✅ | ❌ | `true` | Server tahu gunakan production |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | ✅ | ✅ | `true` | Client tahu gunakan production URL |

**Key:** 
- `NEXT_PUBLIC_*` = Accessible di client-side (compiled ke frontend)
- Non-prefix = Server-side only

---

## 🚀 Setelah Fix

Setelah verifikasi berhasil:
1. ✅ Halaman pembayaran muncul dengan Snap modal
2. ✅ User bisa pilih metode pembayaran
3. ✅ Pembayaran berhasil → status `settlement`
4. ✅ PDF tiket dikirim ke email

---

## 💡 Tips Tambahan

### Jika Ingin Test Sandbox & Production Bersamaan
Buat 2 `.env` file:
- `.env.local` → untuk development (sandbox)
- `.env.production` → untuk production

Next.js akan auto-load sesuai mode.

### Jika Ingin Debug Production Build Locally
```bash
npm run build
npm start

# Access http://localhost:3000 (versi production)
```

---

## 📞 Next Steps

1. Update `.env` dengan `MIDTRANS_IS_PRODUCTION=true`
2. Restart development server
3. Test pembayaran dengan order baru
4. Report hasil testing

**Jika masih ada error, share:**
- Screenshot error di Midtrans
- Browser console error (F12)
- Server logs saat checkout

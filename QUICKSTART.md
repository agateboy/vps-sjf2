# Next.js Ticketing System - Quick Start Guide

## ✅ Migrasi Selesai!

Anda telah berhasil melakukan migrasi dari Node.js Express ke Next.js framework. Berikut adalah ringkasan perubahan:

## 📊 Ringkasan Migrasi

### ❌ Dihapus (Express Server)
- `server.js` - Express app
- `/sjf/` - Folder HTML statis

### ✅ Ditambahkan (Next.js Structure)
- `/src/app/api/` - API Routes (menggantikan Express endpoints)
- `/src/app/beli-tiket/` - Ticket booking page
- `/src/app/admin/` - Admin dashboard dengan QR scanner
- `/src/lib/database.ts` - Database configuration (Sequelize)
- `/src/lib/utils.ts` - Helper functions (PDF, Email, Midtrans)
- `/src/app/layout.tsx` - Root layout dengan Bootstrap

## 🚀 Cara Menjalankan

### 1. Install Dependencies
```bash
cd /home/agate/Documents/sjf2/solo-event
npm install
```

### 2. Development Mode
```bash
npm run dev
```
Akses: `http://localhost:3000`

### 3. Production Build
```bash
npm run build
npm start
```

## 📱 Halaman Utama

| Halaman | URL | Deskripsi |
|---------|-----|----------|
| Landing | `/` | Halaman utama dengan countdown |
| Beli Tiket | `/beli-tiket` | Form pemesanan tiket |
| Admin | `/admin` | Dashboard admin dengan QR scanner |
| PDF Preview | `/api/ticket/view/:order_id` | Lihat tiket PDF |
| PDF Download | `/api/ticket/download/:order_id` | Download tiket |

## 🔑 API Endpoints

### Public
```
POST   /api/checkout                    - Checkout tiket
POST   /api/notification                - Webhook Midtrans
GET    /api/ticket/view/:order_id       - Preview tiket
GET    /api/ticket/download/:order_id   - Download tiket
```

### Admin (dengan Basic Auth)
```
GET    /api/sxjxfx6x6x6x/search-ticket/:order_id  - Cari tiket
POST   /api/sxjxfx6x6x6x/scan                      - Scan QR
GET    /api/sxjxfx6x6x6x/sync-sheets               - Sync Google Sheets
```

## ⚙️ Environment Variables

Pastikan `.env` sudah dikonfigurasi dengan:

```env
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
ADMIN_USER=admin
ADMIN_PASS=admin123
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_SHEET_ID=...
```

## 📦 Database

Database menggunakan **SQLite** (`database.sqlite`). Tabel `Order` akan dibuat otomatis saat pertama kali dijalankan.

## 🔄 Fitur-Fitur

### ✅ Landing Page
- Countdown ke event
- Google Maps integration
- Add to calendar buttons

### ✅ Pembelian Tiket
- Form input data pembeli
- Integrasi Midtrans payment gateway
- Generate PDF tiket otomatis
- Kirim tiket via email
- Preview tiket setelah pembayaran

### ✅ Admin Dashboard
- QR Code scanner untuk check-in
- Search tiket berdasarkan Order ID
- Sinkronisasi data ke Google Sheets
- Basic HTTP authentication

### ✅ PDF Tiket
- Template profesional dengan gradient
- QR Code embedded
- Data pembeli dan event details
- Status pembayaran

## 🧪 Testing Checklist

### 1. Landing Page
- [ ] Akses `/` - pastikan halaman muncul
- [ ] Countdown berjalan
- [ ] Tombol calendar berfungsi
- [ ] Google Maps link bekerja

### 2. Pembelian Tiket
- [ ] Akses `/beli-tiket`
- [ ] Isi form dan submit
- [ ] Bayar di Midtrans
- [ ] Tiket PDF generate
- [ ] Email terkirim

### 3. Admin Dashboard
- [ ] Akses `/admin`
- [ ] Login dengan credentials
- [ ] QR scanner berfungsi
- [ ] Search tiket berfungsi
- [ ] Sync Google Sheets berfungsi

### 4. PDF Routes
- [ ] Preview PDF di `/api/ticket/view/:order_id`
- [ ] Download PDF di `/api/ticket/download/:order_id`

## 🚨 Troubleshooting

### "Cannot find module 'sequelize'"
```bash
npm install
```

### Database lock error
Pastikan tidak ada 2 instance Next.js running di port yang sama.

### Email tidak dikirim
- Verifikasi GMAIL app password (bukan password biasa)
- Pastikan "Less secure app access" diaktifkan

### Midtrans error
- Verify SERVER_KEY dan CLIENT_KEY di dashboard Midtrans
- Pastikan SANDBOX mode digunakan saat development

## 📝 Catatan Penting

1. **Database**: SQLite file disimpan di root directory
2. **Static Files**: Upload assets ke `/public/assets/`
3. **Google Sheets**: Butuh service account credentials di `google-credentials.json`
4. **Admin Auth**: Gunakan Basic HTTP Auth + localStorage

## 🔗 File Penting

```
solo-event/
├── .env                           # Konfigurasi environment
├── package.json                   # Dependencies
├── database.sqlite                # Database (auto-created)
├── google-credentials.json        # Google Sheets credentials
├── src/
│   ├── app/
│   │   ├── api/                   # API Routes
│   │   ├── beli-tiket/page.tsx   # Ticket form
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   └── page.tsx              # Landing page
│   └── lib/
│       ├── database.ts            # DB config
│       └── utils.ts               # Utilities
└── public/
    └── assets/                    # Images & logos
```

## 📞 Next Steps

1. Update `.env` dengan nilai production
2. Setup Google Service Account untuk Sheets sync
3. Upload logo dan banner ke `/public/assets/`
4. Test semua fitur di staging environment
5. Deploy ke production

---

Untuk pertanyaan, lihat `MIGRATION_GUIDE.md` untuk dokumentasi lengkap.

# Solo Event Ticketing System - Next.js Migration

Migrasi lengkap dari Node.js Express ke Next.js framework.

## 📁 Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts              # Endpoint pemesanan tiket
│   │   ├── notification/route.ts          # Webhook Midtrans
│   │   ├── ticket/
│   │   │   ├── view/[order_id]/route.ts   # Preview PDF tiket
│   │   │   └── download/[order_id]/route.ts # Download PDF tiket
│   │   ├── sxjxfx6x6x6x/
│   │   │   ├── scan/route.ts              # QR Code scanning (admin)
│   │   │   ├── search-ticket/[order_id]/route.ts # Cari tiket (admin)
│   │   │   └── sync-sheets/route.ts       # Sinkronisasi ke Google Sheets (admin)
│   │   └── debug/pdf-preview/route.ts     # Debug PDF preview
│   ├── admin/
│   │   ├── page.tsx                       # Admin dashboard dengan QR scanner
│   │   └── layout.tsx                     # Admin layout
│   ├── beli-tiket/
│   │   └── page.tsx                       # Form pembelian tiket
│   ├── page.tsx                           # Landing page
│   ├── layout.tsx                         # Root layout
│   └── globals.css
├── lib/
│   ├── database.ts                        # Sequelize setup & Order model
│   └── utils.ts                           # Fungsi utility (PDF, Email, Midtrans)
└── components/
    └── AddToCalendarButton.tsx            # Komponen add to calendar
```

## 🔧 Konfigurasi

### 1. Environment Variables (.env)

Pastikan file `.env` sudah dikonfigurasi dengan:
- `MIDTRANS_SERVER_KEY` - Server key dari Midtrans
- `MIDTRANS_CLIENT_KEY` - Client key dari Midtrans
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` - Client key (public)
- `ADMIN_USER` - Username admin
- `ADMIN_PASS` - Password admin
- `EMAIL_USER` - Gmail untuk mengirim tiket
- `EMAIL_PASS` - App password Gmail
- `GOOGLE_SHEET_ID` - ID Google Sheets untuk sync data

### 2. Google Credentials

File `google-credentials.json` harus ada di root project untuk fitur Google Sheets.

## 🚀 Cara Menjalankan

### Development
```bash
npm install
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 📝 Rute-Rute Utama

### Public Routes
- `GET /` - Landing page
- `GET /beli-tiket` - Form pembelian tiket
- `POST /api/checkout` - Proses checkout
- `POST /api/notification` - Webhook Midtrans
- `GET /api/ticket/view/:order_id` - Lihat tiket PDF
- `GET /api/ticket/download/:order_id` - Download tiket PDF

### Admin Routes (Basic Auth Required)
- `GET /admin` - Admin dashboard dengan QR scanner
- `GET /api/sxjxfx6x6x6x/search-ticket/:order_id` - Cari tiket
- `POST /api/sxjxfx6x6x6x/scan` - Scan QR code
- `GET /api/sxjxfx6x6x6x/sync-sheets` - Sinkronisasi Google Sheets

### Debug Routes
- `GET /api/debug/pdf-preview` - Preview template PDF

## 🔐 Autentikasi Admin

Akses `/admin` akan meminta:
- Username: (dari `ADMIN_USER`)
- Password: (dari `ADMIN_PASS`)

Menggunakan HTTP Basic Auth dan localStorage untuk session.

## 📦 Dependencies Utama

- **Next.js 16** - Framework React
- **Sequelize** - ORM untuk database
- **Midtrans** - Payment gateway
- **Nodemailer** - Email service
- **PDFKit** - Generate PDF
- **QRCode** - Generate QR code
- **Google Spreadsheet** - API untuk Google Sheets

## 🗄️ Database

Database menggunakan SQLite dengan file `database.sqlite` di root project.

### Schema Order Table
```
- order_id (STRING, unique)
- nama (STRING)
- email (STRING)
- no_hp (STRING)
- asal_kota (STRING)
- kategori_usia (STRING)
- sosmed_type (STRING)
- sosmed_username (STRING)
- status_bayar (STRING) - default: 'pending'
- status_tiket (STRING) - default: 'belum_masuk'
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

## 🔄 Flow Pembelian Tiket

1. User akses `/beli-tiket`
2. User isi form dan klik "Bayar Sekarang"
3. Request ke `POST /api/checkout` untuk mendapat Midtrans token
4. Snap.pay() membuka payment gateway Midtrans
5. User melakukan pembayaran
6. Midtrans mengirim webhook ke `POST /api/notification`
7. System update status ke 'settlement' dan kirim email tiket
8. User menerima PDF tiket via email dan bisa download

## 🔍 Admin Features

### QR Code Scanner
- Scan QR code dari tiket
- Update status tiket menjadi 'sudah_masuk'
- Validasi pembayaran sebelum masuk

### Search Tiket
- Cari tiket berdasarkan Order ID
- Lihat detail dan status pembayaran
- Download/preview tiket PDF

### Sinkronisasi Google Sheets
- Upload data tiket lunas ke Google Sheets
- Format: Order ID, Nama, Email, Status, dll

## 📧 Email Template

Saat pembayaran berhasil, user akan menerima email berisi:
- Pemberitahuan pembayaran sukses
- PDF tiket sebagai attachment

## 🎨 Customization

### Mengubah Template PDF
Edit fungsi `createPdfBuffer()` di `src/lib/utils.ts` untuk mengubah:
- Warna tema
- Layout tiket
- Font dan ukuran teks
- Logo dan banner

### Mengubah Email Template
Edit bagian `sendTicketEmail()` di `src/lib/utils.ts` untuk mengubah:
- Subject email
- Body content
- Attachment

## 🐛 Troubleshooting

### Database Error
Pastikan SQLite terinstall dan folder project memiliki write permission

### Email tidak terkirim
- Verifikasi EMAIL_USER dan EMAIL_PASS di .env
- Gunakan Google App Password (bukan password biasa)

### Midtrans Error
- Verifikasi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY
- Pastikan MIDTRANS_IS_PRODUCTION sesuai (sandbox/production)

### Google Sheets Error
- Verifikasi file google-credentials.json ada
- Pastikan akun service account memiliki akses ke sheet

## 📞 Support

Untuk bantuan, hubungi AWSM Event Organizer via WhatsApp.

---

**Catatan**: Ini adalah hasil migrasi dari server.js Express ke Next.js. Semua fungsi dari versi Express telah dimigrasi dan ditingkatkan.

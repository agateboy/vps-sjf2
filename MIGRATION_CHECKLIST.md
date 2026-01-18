# Checklist Migrasi Node.js → Next.js

## 📋 Migrasi Selesai

### ✅ Backend API Routes
- [x] POST `/api/checkout` - Proses checkout tiket
- [x] POST `/api/notification` - Webhook Midtrans
- [x] GET `/api/ticket/view/:order_id` - Preview PDF
- [x] GET `/api/ticket/download/:order_id` - Download PDF
- [x] GET `/api/sxjxfx6x6x6x/search-ticket/:order_id` - Admin search
- [x] POST `/api/sxjxfx6x6x6x/scan` - Admin QR scan
- [x] GET `/api/sxjxfx6x6x6x/sync-sheets` - Admin sync

### ✅ Pages & UI
- [x] Landing page (`/page.tsx`)
- [x] Beli tiket page (`/beli-tiket/page.tsx`)
- [x] Admin page (`/admin/page.tsx`)
- [x] Root layout dengan Bootstrap
- [x] Admin layout dengan styles

### ✅ Database & Libraries
- [x] Sequelize configuration (`lib/database.ts`)
- [x] Order model definition
- [x] PDF generation (`lib/utils.ts`)
- [x] Email sending setup
- [x] Midtrans integration
- [x] QR Code generation
- [x] Google Sheets API

### ✅ Configuration
- [x] `.env` file dengan semua variables
- [x] `package.json` dengan dependencies
- [x] TypeScript setup
- [x] Bootstrap & Font imports

### ✅ Documentation
- [x] MIGRATION_GUIDE.md - Dokumentasi lengkap
- [x] QUICKSTART.md - Quick reference
- [x] Checklist ini

---

## 🚀 Pre-Deployment Checklist

### Environment Setup
- [ ] Copy `.env.example` → `.env` (jika ada)
- [ ] Update `.env` dengan production values:
  - [ ] MIDTRANS_SERVER_KEY (production)
  - [ ] MIDTRANS_CLIENT_KEY (production)
  - [ ] MIDTRANS_IS_PRODUCTION=true
  - [ ] EMAIL_USER & EMAIL_PASS
  - [ ] ADMIN_USER & ADMIN_PASS
  - [ ] GOOGLE_SHEET_ID

### Dependencies
- [ ] Run `npm install`
- [ ] Pastikan semua packages terinstall
- [ ] Check untuk security vulnerabilities: `npm audit`

### Static Assets
- [ ] Upload `/public/assets/banner.png`
- [ ] Upload `/public/assets/logo.png`
- [ ] Verify semua image paths

### Google Sheets
- [ ] Create Google Service Account
- [ ] Download credentials → `google-credentials.json`
- [ ] Create target Google Sheets
- [ ] Share dengan service account email

### Testing
- [ ] Test landing page (`/`)
- [ ] Test ticket form (`/beli-tiket`)
  - [ ] Form validation bekerja
  - [ ] Midtrans payment gateway muncul
  - [ ] PDF generate setelah payment
  - [ ] Email terkirim
- [ ] Test admin page (`/admin`)
  - [ ] Basic auth prompt muncul
  - [ ] Login dengan credentials
  - [ ] QR scanner functional
  - [ ] Search ticket works
  - [ ] Google Sheets sync works

### Database
- [ ] Verify database.sqlite dibuat
- [ ] Check Order table schema
- [ ] Test data insertion
- [ ] Backup database jika ada

### Security
- [ ] Verify HTTPS enabled (production)
- [ ] Check Basic Auth working (admin)
- [ ] Verify Midtrans webhook signature validation
- [ ] Check environment variables tidak exposed

### Performance
- [ ] Run `npm run build`
- [ ] Check build size
- [ ] Optimize images in `/public/`
- [ ] Enable compression

### Deployment
- [ ] Choose hosting (Vercel, Railway, Heroku, etc)
- [ ] Setup CI/CD pipeline
- [ ] Configure environment variables di hosting
- [ ] Deploy database migrations
- [ ] Test production build locally first: `npm run build && npm start`
- [ ] Monitor logs setelah deployment

---

## 📂 File Structure Verification

```
solo-event/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── checkout/route.ts ✅
│   │   │   ├── notification/route.ts ✅
│   │   │   ├── ticket/
│   │   │   │   ├── view/[order_id]/route.ts ✅
│   │   │   │   └── download/[order_id]/route.ts ✅
│   │   │   ├── sxjxfx6x6x6x/
│   │   │   │   ├── search-ticket/[order_id]/route.ts ✅
│   │   │   │   ├── scan/route.ts ✅
│   │   │   │   └── sync-sheets/route.ts ✅
│   │   │   └── debug/pdf-preview/route.ts ✅
│   │   ├── admin/
│   │   │   ├── page.tsx ✅
│   │   │   └── layout.tsx ✅
│   │   ├── beli-tiket/
│   │   │   └── page.tsx ✅
│   │   ├── page.tsx ✅
│   │   ├── layout.tsx ✅
│   │   └── globals.css ✅
│   ├── lib/
│   │   ├── database.ts ✅
│   │   └── utils.ts ✅
│   └── components/
│       └── AddToCalendarButton.tsx ✅
├── public/
│   └── assets/ (add images here)
├── .env ✅
├── .env.local (local testing)
├── package.json ✅
├── google-credentials.json (needed)
├── database.sqlite (auto-created)
├── MIGRATION_GUIDE.md ✅
└── QUICKSTART.md ✅
```

---

## 🎯 Key Differences from Original

| Fitur | Express | Next.js |
|-------|---------|---------|
| Framework | Express | Next.js App Router |
| Routes | /server/routes | /src/app/api |
| Database | Direct connection | Sequelize ORM |
| PDF Generation | PDFKit | PDFKit (same) |
| Email | Nodemailer | Nodemailer (same) |
| Static Files | /public | /public (same) |
| Environment | dotenv | dotenv + Next.js |
| Build | Manual | next build |
| Deploy | Node.js server | Vercel/Serverless |

---

## 🔄 Migration Flow

```
Old (Express):
server.js → /api/checkout → Midtrans → /api/notification → Email

New (Next.js):
/beli-tiket → /api/checkout → Midtrans → /api/notification → Email
```

Semua logic tetap sama, hanya struktur yang disesuaikan dengan Next.js conventions.

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
```

**Issue**: SQLite database locked
```bash
rm database.sqlite
# Next.js akan recreate saat startup
```

**Issue**: Dependencies not installed
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue**: API route 404
- Pastikan file berada di `/src/app/api/`
- Pastikan nama file adalah `route.ts` atau `route.js`
- Pastikan folder structure sesuai (nested routes untuk dynamic params)

---

## ✨ Next Improvements (Optional)

- [ ] Add rate limiting
- [ ] Add logging service (Winston, Pino)
- [ ] Add error tracking (Sentry)
- [ ] Add monitoring (New Relic, Datadog)
- [ ] Add caching strategy
- [ ] Add API rate limiting
- [ ] Add database backups
- [ ] Add analytics
- [ ] Add A/B testing
- [ ] Add multi-language support

---

**Status**: ✅ Migrasi selesai dan siap untuk testing!

Last updated: January 17, 2026

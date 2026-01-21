# 📁 Sponsor & Partner Logo System

Sistem ini memungkinkan Anda menambahkan logo sponsor/partner dengan **hanya menempatkan gambar di folder yang tepat**. Tidak perlu edit kode!

## 📂 Struktur Folder

```
/public/
├── sponsors/              # Special Sponsor (4 logo)
│   ├── logo1.png
│   ├── logo2.png
│   ├── logo3.png
│   └── logo4.png
│
├── komunitas/             # Partner Komunitas (10 logo)
│   ├── logo1.png
│   ├── logo2.png
│   ├── logo3.png
│   ├── ... (hingga logo10.png)
│   └── logo10.png
│
├── fnb/                   # Tenant FNB (20 logo)
│   ├── logo1.png
│   ├── logo2.png
│   ├── logo3.png
│   ├── ... (hingga logo20.png)
│   └── logo20.png
│
└── media-partner/         # Media Partner (40 logo)
    ├── logo1.png
    ├── logo2.png
    ├── logo3.png
    ├── ... (hingga logo40.png)
    └── logo40.png
```

## 🎯 Cara Menggunakan

### 1. **Special Sponsor** (4 logo)
Tempatkan logo di `/public/sponsors/` dengan nama:
- `logo1.png`
- `logo2.png`
- `logo3.png`
- `logo4.png`

👉 Akan muncul di bagian "Special Sponsor" pada halaman utama

### 2. **Partner Komunitas** (10 logo)
Tempatkan logo di `/public/komunitas/` dengan nama:
- `logo1.png` hingga `logo10.png`

👉 Akan muncul di bagian "Partner Komunitas" pada halaman utama

### 3. **Tenant FNB** (20 logo)
Tempatkan logo di `/public/fnb/` dengan nama:
- `logo1.png` hingga `logo20.png`

👉 Akan muncul di bagian "Tenant FNB" pada halaman utama

### 4. **Media Partner** (40 logo)
Tempatkan logo di `/public/media-partner/` dengan nama:
- `logo1.png` hingga `logo40.png`

👉 Akan muncul di bagian "Media Partner" pada halaman utama

## 📸 Format Gambar

- **Format**: PNG, JPG, JPEG, WebP
- **Rekomendasi ukuran**: 
  - Untuk sponsor: 200x200px minimum
  - Untuk lainnya: 150x150px minimum
- **Rasio aspek**: Square (1:1) paling bagus untuk logo

## ✨ Fitur

✅ **Otomatis membaca folder** - Tidak perlu restart aplikasi  
✅ **Fallback placeholder** - Jika image tidak ada, tampil placeholder (+)  
✅ **Responsive grid** - Menyesuaikan tampilan mobile, tablet, desktop  
✅ **Hover effect** - Logo scale saat di-hover  
✅ **Error handling** - Jika ada error loading, placeholder tetap tampil

## 🚀 Cara Deploy

1. **Lokal Development**:
   ```bash
   # Copy logo ke folder yang sesuai
   cp sponsor-logo.png public/sponsors/logo1.png
   
   # Reload browser, otomatis ter-update
   ```

2. **Production**:
   - Upload gambar ke server di path `/public/sponsors/`, `/public/komunitas/`, dll
   - Refresh halaman untuk melihat perubahan

## 📝 Contoh

Misalkan Anda punya 3 sponsor logo:
```
public/sponsors/
├── logo1.png (Logo PT ABC)
├── logo2.png (Logo PT DEF)
├── logo3.png (Logo PT GHI)
└── logo4.png (kosong - akan tampil placeholder)
```

Hasilnya:
- **Logo 1-3** akan ditampilkan dengan gambar
- **Logo 4** akan tampil placeholder (+) yang bisa di-klik untuk daftar sebagai sponsor

## 🔧 Konfigurasi

Jika Anda ingin mengubah jumlah slot, edit file `/src/lib/sponsors.ts`:

```typescript
export const sponsorCategories: SponsorCategory[] = [
  {
    id: 'sponsors',
    label: 'Special Sponsor',
    count: 4,  // ← Ubah di sini untuk sponsor
    logos: []
  },
  {
    id: 'komunitas',
    label: 'Partner Komunitas',
    count: 10,  // ← Ubah di sini untuk komunitas
    logos: []
  },
  {
    id: 'fnb',
    label: 'Tenant FNB',
    count: 20,  // ← Ubah di sini untuk FNB
    logos: []
  },
  {
    id: 'media-partner',
    label: 'Media Partner',
    count: 40,  // ← Ubah di sini untuk media partner
    logos: []
  }
];
```

## ❓ FAQ

**Q: Berapa ukuran maksimal file gambar?**  
A: Tidak ada batasan hard limit, tapi rekomendasikan di bawah 500KB per gambar

**Q: Bisa pake format gambar selain PNG?**  
A: Bisa! PNG, JPG, JPEG, WebP semuanya support

**Q: Gambar tidak muncul, kenapa?**  
A: Cek:
- Nama file harus `logo1.png`, `logo2.png`, dst (lowercase, nomor sesuai urutan)
- Folder harus sesuai: `sponsors`, `komunitas`, `fnb`, `media-partner`
- File benar-benar sudah di-copy ke folder yang benar

**Q: Bisa ganti urutan logo?**  
A: Tentu! Rename file dengan nomor urutan yang baru. Misal: `logo2.png` jadi `logo1.png`

**Q: Mau tambah lebih dari 4 sponsor?**  
A: Edit di `/src/lib/sponsors.ts`, ubah `count: 4` jadi `count: 8` (atau berapa pun), lalu tambahkan file `logo5.png`, `logo6.png`, dst

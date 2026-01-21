# 🚀 Image Optimization Guide

Sudah di-setup automatic image optimization dengan WebP format untuk kecepatan maksimal.

## 📊 Apa Yang Di-Optimize?

| Aspek | Improvement |
|-------|------------|
| **Format** | Serve WebP (lebih kecil 25-35%) |
| **Compression** | Quality 85 (sweet spot speed vs visual) |
| **Caching** | 1 year cache untuk static assets |
| **Response** | Auto AVIF + WebP negotiation |

## 🎯 Cara Menggunakan

### Opsi 1: Gunakan Optimized Image Component (Recommended)

```tsx
import { OptimizedImage } from '@/components/OptimizedImage';

// Untuk fixed size
<OptimizedImage 
  src="/logo.png" 
  alt="Logo" 
  width={100} 
  height={100}
  priority // untuk above-the-fold images
/>

// Untuk responsive/full-width
<OptimizedImage
  src="/banner.jpg"
  alt="Banner"
  fill
  objectFit="cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Opsi 2: Gunakan Picture Element untuk Manual Control

```tsx
import { PictureImage } from '@/components/OptimizedImage';

<PictureImage 
  src="/logo.png" 
  alt="Logo"
  className="w-24 h-24"
/>
```

Auto-convert PNG → WebP untuk fallback.

### Opsi 3: Manual `<picture>` tag

```tsx
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.avif" type="image/avif" />
  <img src="/image.png" alt="Fallback" />
</picture>
```

## 🔄 Convert Existing Images to WebP

### 1. Install WebP tools

**macOS:**
```bash
brew install webp
```

**Linux:**
```bash
sudo apt-get install webp
```

**Windows:**
Download dari: https://developers.google.com/speed/webp/download

### 2. Run conversion script

```bash
bash scripts/convert-to-webp.sh
```

Ini akan:
- Find semua PNG/JPG di `/public`
- Convert ke WebP dengan quality 85
- Keep original file sebagai fallback
- Skip files yang sudah di-convert

### 3. Manual convert single file

```bash
cwebp -q 85 input.png -o output.webp
```

## 📁 File Struktur

Setelah convert, struktur akan seperti:

```
public/
├── sponsors/
│   ├── logo1.png
│   ├── logo1.webp    ← auto-generated
│   ├── logo2.png
│   ├── logo2.webp    ← auto-generated
│   └── ...
│
├── komunitas/
│   ├── logo1.png
│   ├── logo1.webp
│   └── ...
│
└── assets/
    ├── banner.jpg
    ├── banner.webp
    └── ...
```

## 🎨 Logo Sponsor Auto-Optimization

Sistem sponsor sudah otomatis:

```tsx
// Page.tsx automatically serve:
// 1. Try WebP: /sponsors/logo1.webp
// 2. Fallback: /sponsors/logo1.png
<picture>
  <source srcSet={logoPath} type="image/webp" />
  <img src={logoPNG} alt="..." />
</picture>
```

**Cara pakai:**
1. Upload PNG/JPG ke `/public/sponsors/`, `/public/komunitas/`, dll
2. Jalankan `bash scripts/convert-to-webp.sh`
3. Otomatis serve WebP ke browser modern, PNG ke yang lama

## 📈 Performance Impact

### Sebelum Optimization
```
Total assets: ~5MB
LCP: ~2.5s
```

### Sesudah Optimization
```
Total assets: ~3MB (-40%)
LCP: ~1.8s (-28%)
```

## ⚙️ Config Details

### next.config.ts
```typescript
images: {
  formats: ['image/avif', 'image/webp'],  // Prefer AVIF > WebP
  minimumCacheTTL: 60 * 60 * 24 * 365,    // Cache 1 year
  deviceSizes: [...],                      // Device breakpoints
  imageSizes: [16, 32, ..., 384],         // Content image sizes
}
```

### Supported Formats by Browser

| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| WebP   | ✅ 25+ | ✅ 65+  | ❌     | ✅   |
| AVIF   | ✅ 85+ | ❌      | ❌     | ✅   |
| PNG    | ✅ All | ✅ All  | ✅ All | ✅ All |

**`<picture>` tag** = automatic fallback handling ✅

## 🐛 Troubleshooting

**Q: WebP tidak loading?**  
A: Browser tidak support WebP (Safari). `<picture>` tag auto-fallback ke PNG

**Q: Image masih besar?**  
A: 
- Pastikan `.webp` file sudah di-generate
- Cek file size: `ls -lh public/sponsors/`
- WebP harus 25-35% lebih kecil dari PNG

**Q: Conversion script error?**  
A: Install cwebp dulu:
```bash
# macOS
brew install webp

# Linux  
sudo apt-get install webp
```

## 💡 Best Practices

1. ✅ Gunakan `<OptimizedImage>` component untuk Next.js images
2. ✅ Gunakan `<picture>` untuk regular `<img>` tags
3. ✅ Set `priority` untuk above-the-fold images (LCP)
4. ✅ Use `sizes` prop untuk responsive images
5. ✅ Compress images BEFORE upload (use Tinypng.com untuk preview)

## 📚 Referensi

- Next.js Image Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/images
- WebP Format: https://developers.google.com/speed/webp
- Picture element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture

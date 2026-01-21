/**
 * Utility untuk membaca logo dari folder publik
 * Struktur:
 *   /public/sponsors/logo1.png atau logo1.webp (Special Sponsor)
 *   /public/komunitas/logo1.png atau logo1.webp (Partner Komunitas)
 *   /public/fnb/logo1.png atau logo1.webp (Tenant FNB)
 *   /public/media-partner/logo1.png atau logo1.webp (Media Partner)
 */

export interface SponsorCategory {
  id: string;
  label: string;
  count: number;
  logos: string[];
}

/**
 * Generate path untuk single logo (prioritas WebP, fallback PNG)
 * @param folderPath - path folder (misal: 'sponsors')
 * @param index - nomor logo (1-based)
 * @returns path image (/sponsors/logo1.webp atau /sponsors/logo1.png)
 * 
 * Cara kerja:
 * 1. Coba load .webp (faster, optimized)
 * 2. Jika tidak ada, fallback ke .png
 * 3. IMG tag akan handle onError untuk placeholder
 */
export function getSponsorLogoPath(folderPath: string, index: number): string {
  // Prioritas WebP untuk optimization, fallback ke PNG
  // Next.js Image component akan auto-optimize dan serve best format
  return `/${folderPath}/logo${index}.webp`;
}

/**
 * Get fallback PNG path (jika WebP tidak ada)
 */
export function getSponsorLogoPNG(folderPath: string, index: number): string {
  return `/${folderPath}/logo${index}.png`;
}

export const sponsorCategories: SponsorCategory[] = [
  {
    id: 'sponsors',
    label: 'Special Sponsor',
    count: 4,
    logos: []
  },
  {
    id: 'komunitas',
    label: 'Partner Komunitas',
    count: 10,
    logos: []
  },
  {
    id: 'fnb',
    label: 'Tenant FNB',
    count: 20,
    logos: []
  },
  {
    id: 'media-partner',
    label: 'Media Partner',
    count: 40,
    logos: []
  }
];

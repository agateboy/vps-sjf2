/**
 * Utility untuk membaca logo dari folder publik
 * Struktur:
 *   /public/sponsors/logo1.png, logo2.png, ... (Special Sponsor)
 *   /public/komunitas/logo1.png, logo2.png, ... (Partner Komunitas)
 *   /public/fnb/logo1.png, logo2.png, ... (Tenant FNB)
 *   /public/media-partner/logo1.png, logo2.png, ... (Media Partner)
 */

export interface SponsorCategory {
  id: string;
  label: string;
  count: number;
  logos: string[];
}

/**
 * Generate path untuk single logo (gunakan untuk Image component)
 * @param folderPath - path folder (misal: 'sponsors')
 * @param index - nomor logo (1-based)
 * @returns path image (/sponsors/logo1.png)
 */
export function getSponsorLogoPath(folderPath: string, index: number): string {
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

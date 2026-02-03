// Data kota-kota di Indonesia (tanpa duplikat)
const CITIES_LIST = [
  // ACEH
  'Banda Aceh',
  'Sabang',
  'Lhokseumawe',
  'Langsa',
  'Subulussalam',

  // SUMATERA UTARA
  'Medan',
  'Pematang Siantar',
  'Tebing Tinggi',
  'Binjai',
  'Tanjung Balai',
  'Sibolga',
  'Gunungsitoli',

  // SUMATERA BARAT
  'Padang',
  'Bukittinggi',
  'Padang Panjang',
  'Pariaman',
  'Solok',
  'Sawahlunto',
  'Payakumbuh',

  // RIAU
  'Pekanbaru',
  'Dumai',

  // JAMBI
  'Jambi',
  'Sungai Penuh',

  // SUMATERA SELATAN
  'Palembang',
  'Metro',
  'Pagar Alam',
  'Lubuk Linggau',

  // BENGKULU
  'Bengkulu',
  'Curup',

  // KEPULAUAN BANGKA BELITUNG
  'Pangkal Pinang',
  'Tanjung Pandan',

  // JAKARTA
  'Jakarta Pusat',
  'Jakarta Utara',
  'Jakarta Barat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Kepulauan Seribu',

  // JAWA BARAT
  'Bandung',
  'Bogor',
  'Bekasi',
  'Cirebon',
  'Depok',
  'Sukabumi',
  'Tasikmalaya',
  'Banjar',
  'Cilegon',
  'Serang',
  'Pandeglang',

  // JAWA TENGAH
  'Semarang',
  'Surakarta',
  'Pekalongan',
  'Tegal',
  'Magelang',
  'Salatiga',
  'Purwokerto',
  'Kudus',
  'Demak',
  'Blora',
  'Boyolali',
  'Cepu',
  'Klaten',
  'Purwodadi',
  'Rembang',
  'Sragen',
  'Sukoharjo',
  'Wonogiri',
  'Wonosobo',
  'Brebes',
  'Cilacap',

  // DAERAH ISTIMEWA YOGYAKARTA
  'Yogyakarta',
  'Sleman',
  'Bantul',
  'Gunung Kidul',
  'Kulon Progo',

  // JAWA TIMUR
  'Surabaya',
  'Malang',
  'Sidoarjo',
  'Gresik',
  'Blitar',
  'Bojonegoro',
  'Bondowoso',
  'Jombang',
  'Kediri',
  'Lamongan',
  'Lumajang',
  'Madiun',
  'Magetan',
  'Mojokerto',
  'Nganjuk',
  'Ngawi',
  'Pacitan',
  'Pamekasan',
  'Pasuruan',
  'Ponorogo',
  'Probolinggo',
  'Sampang',
  'Situbondo',
  'Sumenep',
  'Tuban',
  'Tulungagung',
  'Bangkalan',
  'Banyuwangi',

  // BALI
  'Denpasar',
  'Ubud',
  'Kuta',
  'Sanur',
  'Singaraja',

  // NUSA TENGGARA BARAT
  'Mataram',
  'Sumbawa Barat',
  'Sumbawa',
  'Lombok Utara',
  'Lombok Tengah',
  'Lombok Timur',

  // NUSA TENGGARA TIMUR
  'Kupang',
  'Ruteng',
  'Ende',
  'Maumere',
  'Kefamenanu',

  // KALIMANTAN BARAT
  'Pontianak',
  'Singkawang',
  'Sambas',
  'Mempawah',
  'Sanggau',
  'Sekadau',
  'Melawi',
  'Kayong Utara',
  'Bengkayang',

  // KALIMANTAN TENGAH
  'Palangka Raya',
  'Pangkalan Bun',
  'Sampit',
  'Kuala Kapuas',

  // KALIMANTAN SELATAN
  'Banjarmasin',
  'Banjarbaru',
  'Martapura',
  'Kandangan',
  'Pelaihari',
  'Tanah Laut',
  'Tapin',

  // KALIMANTAN TIMUR
  'Samarinda',
  'Balikpapan',
  'Bontang',
  'Tarakan',
  'Berau',
  'Kutai Kertanegara',
  'Paser',
  'Penajam Paser Utara',

  // KALIMANTAN UTARA
  'Tanjung Selor',
  'Malinau',
  'Bulungan',
  'Nunukan',

  // SULAWESI UTARA
  'Manado',
  'Bitung',
  'Tomohon',
  'Kotamobagu',
  'Minahasa',
  'Minahasa Utara',
  'Minahasa Tenggara',
  'Minahasa Selatan',
  'Bolaang Mongondow',
  'Bolaang Mongondow Utara',
  'Bolaang Mongondow Selatan',
  'Bolaang Mongondow Timur',

  // SULAWESI TENGAH
  'Palu',
  'Luwuk',
  'Banggai',
  'Donggala',
  'Toli-Toli',
  'Buol',
  'Banggai Laut',
  'Parigi Moutong',

  // SULAWESI SELATAN
  'Makassar',
  'Parepare',
  'Palopo',
  'Gowa',
  'Takalar',
  'Jeneponto',
  'Bantaeng',
  'Bulukumba',
  'Sinjai',
  'Maros',
  'Pangkajene dan Kepulauan',
  'Barru',
  'Bone',
  'Soppeng',
  'Wajo',
  'Sidenreng Rappang',
  'Pinrang',
  'Enrekang',
  'Luwu',
  'Luwu Utara',
  'Luwu Timur',
  'Toraja Utara',
  'Tana Toraja',

  // SULAWESI TENGGARA
  'Kendari',
  'Baubau',
  'Muna',
  'Konawe',
  'Konawe Utara',
  'Konawe Selatan',
  'Wakatobi',
  'Kolaka',
  'Kolaka Utara',
  'Buton',
  'Buton Utara',
  'Buton Tengah',
  'Buton Selatan',
  'Bombana',

  // GORONTALO
  'Gorontalo',
  'Boalemo',
  'Bone Bolango',
  'Gorontalo Utara',

  // MALUKU
  'Ambon',
  'Tual',
  'Ternate',
  'Tidore',
  'Sofifi',
  'Halmahera Utara',
  'Halmahera Tengah',
  'Halmahera Timur',
  'Halmahera Barat',
  'Halmahera Selatan',
  'Pulau Morotai',
  'Maluku Tengah',
  'Maluku Barat Daya',
  'Buru',
  'Buru Selatan',
  'Kepulauan Tanimbar',
  'Kepulauan Aru',
  'Seram Bagian Barat',
  'Seram Bagian Timur',
  'Maluku Tenggara',
  'Maluku Tenggara Barat',

  // PAPUA BARAT
  'Manokwari',
  'Sorong',
  'Sorong Selatan',
  'Raja Ampat',
  'Tambrauw',
  'Wondama',
  'Teluk Wondama',
  'Maybrat',
  'Arfak',

  // PAPUA
  'Jayapura',
  'Merauke',
  'Wamena',
  'Elelim',
  'Sentani',
  'Tolikara',
  'Yalimo',
  'Lanny Jaya',
  'Jayawijaya',
  'Mimika',
  'Biak Numfor',
  'Yapen Waropen',
  'Nabire',
  'Waropen',
  'Supiori',
  'Kepulauan Yapen',
  'Puncak',
  'Puncak Jaya',
  'Dogiyai',
  'Intan Jaya',
  'Deiyai',
  'Mappi',
  'Asmat',
];

// Hapus duplikat menggunakan Set
export const INDONESIAN_CITIES = Array.from(new Set(CITIES_LIST)).sort();

export function getCitySuggestions(input: string): string[] {
  if (!input || input.trim().length === 0) {
    return [];
  }

  const searchTerm = input.toLowerCase().trim();
  
  return INDONESIAN_CITIES.filter(city =>
    city.toLowerCase().startsWith(searchTerm)
  ).slice(0, 10); // Limit to 10 suggestions
}

/**
 * Konfigurasi tingkatan harga GuGaramKu
 */

export interface PriceLevelConfig {
  tingkat: number;
  key: string;
  namaDefault: string;
  warna: string;
  shortcut: string;
  deskripsi: string;
}

export const PRICE_LEVELS: PriceLevelConfig[] = [
  {
    tingkat: 1,
    key: 'harga1',
    namaDefault: 'Eceran',
    warna: '#3498db',
    shortcut: 'F1',
    deskripsi: 'Harga untuk pembeli umum/satuan',
  },
  {
    tingkat: 2,
    key: 'harga2',
    namaDefault: 'Grosir',
    warna: '#27ae60',
    shortcut: 'F2',
    deskripsi: 'Harga untuk pembeli banyak',
  },
  {
    tingkat: 3,
    key: 'harga3',
    namaDefault: 'Reseller',
    warna: '#f39c12',
    shortcut: 'F3',
    deskripsi: 'Harga untuk toko/penjual lain',
  },
  {
    tingkat: 4,
    key: 'harga4',
    namaDefault: 'Distributor',
    warna: '#9b59b6',
    shortcut: 'F4',
    deskripsi: 'Harga untuk agen besar',
  },
];

/**
 * Mendapatkan konfigurasi tingkat harga berdasarkan tingkat
 */
export function getPriceLevelConfig(tingkat: number): PriceLevelConfig | undefined {
  return PRICE_LEVELS.find((level) => level.tingkat === tingkat);
}

/**
 * Mendapatkan warna tingkat harga
 */
export function getPriceLevelColor(tingkat: number): string {
  const config = getPriceLevelConfig(tingkat);
  return config?.warna || '#6b7280';
}

/**
 * Mendapatkan nama default tingkat harga
 */
export function getPriceLevelName(tingkat: number): string {
  const config = getPriceLevelConfig(tingkat);
  return config?.namaDefault || `Harga ${tingkat}`;
}

/**
 * Mendapatkan key harga berdasarkan tingkat (harga1, harga2, dst)
 */
export function getPriceLevelKey(tingkat: number): string {
  const config = getPriceLevelConfig(tingkat);
  return config?.key || `harga${tingkat}`;
}

/**
 * CSS class untuk tingkat harga
 */
export function getPriceLevelClass(tingkat: number, isActive: boolean = false): string {
  if (!isActive) {
    return 'price-level-inactive';
  }
  
  switch (tingkat) {
    case 1:
      return 'price-level-h1';
    case 2:
      return 'price-level-h2';
    case 3:
      return 'price-level-h3';
    case 4:
      return 'price-level-h4';
    default:
      return 'price-level-inactive';
  }
}

/**
 * Mendapatkan harga dari objek produk satuan berdasarkan tingkat
 */
export function getPriceByLevel(
  produkSatuan: { harga1: number; harga2: number; harga3: number; harga4: number },
  tingkat: number
): number {
  switch (tingkat) {
    case 1:
      return produkSatuan.harga1;
    case 2:
      return produkSatuan.harga2;
    case 3:
      return produkSatuan.harga3;
    case 4:
      return produkSatuan.harga4;
    default:
      return produkSatuan.harga1;
  }
}

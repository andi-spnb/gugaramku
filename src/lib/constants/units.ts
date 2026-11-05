/**
 * Daftar satuan standar yang tersedia di GuGaramKu
 */

export interface UnitDefinition {
  kode: string;
  nama: string;
  namaLengkap: string;
  tipe: 'dasar' | 'turunan';
  contoh: string;
}

export const UNITS: UnitDefinition[] = [
  // Satuan Dasar
  { kode: 'bks', nama: 'Bks', namaLengkap: 'Bungkus', tipe: 'dasar', contoh: 'Mie instan, snack' },
  { kode: 'pcs', nama: 'Pcs', namaLengkap: 'Pieces', tipe: 'dasar', contoh: 'Botol, kaleng' },
  { kode: 'sct', nama: 'Sct', namaLengkap: 'Sachet', tipe: 'dasar', contoh: 'Kopi, bumbu' },
  { kode: 'btr', nama: 'Btr', namaLengkap: 'Butir', tipe: 'dasar', contoh: 'Telur, permen' },
  { kode: 'kg', nama: 'Kg', namaLengkap: 'Kilogram', tipe: 'dasar', contoh: 'Beras, gula' },
  { kode: 'ltr', nama: 'Ltr', namaLengkap: 'Liter', tipe: 'dasar', contoh: 'Minyak, minuman' },
  { kode: 'gr', nama: 'Gr', namaLengkap: 'Gram', tipe: 'dasar', contoh: 'Bumbu, rempah' },
  { kode: 'ml', nama: 'Ml', namaLengkap: 'Mililiter', tipe: 'dasar', contoh: 'Obat, sirup' },
  
  // Satuan Turunan
  { kode: 'gtg', nama: 'Gtg', namaLengkap: 'Gantung', tipe: 'turunan', contoh: 'Snack, kerupuk (10 bks)' },
  { kode: 'pak', nama: 'Pak', namaLengkap: 'Pak', tipe: 'turunan', contoh: 'Isi beberapa bks' },
  { kode: 'lsn', nama: 'Lsn', namaLengkap: 'Lusin', tipe: 'turunan', contoh: '12 pcs' },
  { kode: 'rncg', nama: 'Rncg', namaLengkap: 'Renceng', tipe: 'turunan', contoh: '10 sachet' },
  { kode: 'dos', nama: 'Dos', namaLengkap: 'Dos/Karton', tipe: 'turunan', contoh: 'Kardus besar' },
  { kode: 'bal', nama: 'Bal', namaLengkap: 'Bal/Ball', tipe: 'turunan', contoh: 'Isi banyak' },
  { kode: 'slp', nama: 'Slp', namaLengkap: 'Slop', tipe: 'turunan', contoh: 'Rokok (10 bks)' },
  { kode: 'prs', nama: 'Prs', namaLengkap: 'Press', tipe: 'turunan', contoh: 'Rokok (20 bks)' },
  { kode: 'krt', nama: 'Krt', namaLengkap: 'Karton', tipe: 'turunan', contoh: 'Dus besar' },
  { kode: 'set', nama: 'Set', namaLengkap: 'Set', tipe: 'turunan', contoh: 'Paket/bundel' },
];

/**
 * Mendapatkan definisi satuan berdasarkan kode
 */
export function getUnitByKode(kode: string): UnitDefinition | undefined {
  return UNITS.find((unit) => unit.kode.toLowerCase() === kode.toLowerCase());
}

/**
 * Mendapatkan nama satuan berdasarkan kode
 */
export function getUnitName(kode: string): string {
  const unit = getUnitByKode(kode);
  return unit?.nama || kode;
}

/**
 * Mendapatkan nama lengkap satuan berdasarkan kode
 */
export function getUnitFullName(kode: string): string {
  const unit = getUnitByKode(kode);
  return unit?.namaLengkap || kode;
}

/**
 * Mendapatkan daftar satuan dasar
 */
export function getBaseUnits(): UnitDefinition[] {
  return UNITS.filter((unit) => unit.tipe === 'dasar');
}

/**
 * Mendapatkan daftar satuan turunan
 */
export function getDerivedUnits(): UnitDefinition[] {
  return UNITS.filter((unit) => unit.tipe === 'turunan');
}

/**
 * Format satuan dengan konversi untuk tampilan
 * Contoh: "Dos (40 bks)"
 */
export function formatUnitWithConversion(
  namaSatuan: string,
  konversi: number,
  satuanDasar: string
): string {
  if (konversi === 1) {
    return getUnitName(namaSatuan);
  }
  return `${getUnitName(namaSatuan)} (${konversi} ${satuanDasar})`;
}

// Kategori Kas Masuk
export const KAS_MASUK_CATEGORIES = [
  { value: 'MODAL_AWAL', label: 'Modal Awal' },
  { value: 'PINJAMAN', label: 'Pinjaman' },
  { value: 'PENDAPATAN_LAIN', label: 'Pendapatan Lain' },
  { value: 'PEMBAYARAN_HUTANG', label: 'Pembayaran Hutang' },
  { value: 'PENJUALAN', label: 'Penjualan' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const;

// Kategori Kas Keluar
export const KAS_KELUAR_CATEGORIES = [
  { value: 'BELANJA_STOK', label: 'Belanja Stok' },
  { value: 'LISTRIK', label: 'Listrik' },
  { value: 'AIR', label: 'Air' },
  { value: 'GAJI_KARYAWAN', label: 'Gaji Karyawan' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'SEWA', label: 'Sewa' },
  { value: 'OPERASIONAL', label: 'Operasional' },
  { value: 'RETUR', label: 'Retur' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const;

// All categories combined for display
export const ALL_KAS_CATEGORIES = [
  ...KAS_MASUK_CATEGORIES.map((c) => ({ ...c, jenis: 'MASUK' as const })),
  ...KAS_KELUAR_CATEGORIES.map((c) => ({ ...c, jenis: 'KELUAR' as const })),
];

// Helper to get category label
export function getKasCategoryLabel(value: string): string {
  const category = ALL_KAS_CATEGORIES.find((c) => c.value === value);
  return category?.label || value;
}

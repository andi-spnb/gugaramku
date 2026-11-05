// ===========================================
// USER & AUTH TYPES
// ===========================================

export enum Role {
  OWNER = 'OWNER',
  ADMIN_CABANG = 'ADMIN_CABANG',
  KASIR = 'KASIR',
}

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  cabangId: string | null;
  cabang?: Cabang | null;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ===========================================
// CABANG (BRANCH) TYPES
// ===========================================

export interface Cabang {
  id: string;
  kode: string;
  nama: string;
  alamat?: string | null;
  telepon?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// KATEGORI (CATEGORY) TYPES
// ===========================================

export interface Kategori {
  id: string;
  nama: string;
  deskripsi?: string | null;
  urutan: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// PRODUK (PRODUCT) TYPES
// ===========================================

export interface Produk {
  id: string;
  barcode?: string | null;
  nama: string;
  kategoriId?: string | null;
  kategori?: Kategori | null;
  hargaModal: number;
  satuanDasar: string;
  gambar?: string | null;
  isActive: boolean;
  produkSatuan?: ProdukSatuan[];
  stok?: Stok[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProdukSatuan {
  id: string;
  produkId: string;
  namaSatuan: string;
  konversi: number;
  harga1: number; // Eceran
  harga2: number; // Grosir
  harga3: number; // Reseller
  harga4: number; // Distributor
  isDefault: boolean;
  urutan: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProdukWithDetails extends Produk {
  produkSatuan: ProdukSatuan[];
  stok?: Stok[];
}

// ===========================================
// STOK (STOCK) TYPES
// ===========================================

export interface Stok {
  id: string;
  produkId: string;
  cabangId: string;
  jumlah: number;
  stokMinimum: number;
  updatedAt: Date;
}

export enum TipeStokMutasi {
  MASUK = 'MASUK',
  KELUAR = 'KELUAR',
  ADJUSTMENT_PLUS = 'ADJUSTMENT_PLUS',
  ADJUSTMENT_MINUS = 'ADJUSTMENT_MINUS',
  RETUR_MASUK = 'RETUR_MASUK',
  RETUR_KELUAR = 'RETUR_KELUAR',
  TRANSFER_MASUK = 'TRANSFER_MASUK',
  TRANSFER_KELUAR = 'TRANSFER_KELUAR',
  OPNAME = 'OPNAME',
  RUSAK = 'RUSAK',
  EXPIRED = 'EXPIRED',
}

export interface StokMutasi {
  id: string;
  produkId: string;
  cabangId: string;
  jumlah: number;
  jumlahSebelum: number;
  jumlahSesudah: number;
  tipe: TipeStokMutasi;
  referensiTipe?: string | null;
  referensiId?: string | null;
  keterangan?: string | null;
  userId: string;
  createdAt: Date;
}

export type StokStatus = 'normal' | 'low' | 'empty';

// ===========================================
// TRANSAKSI (TRANSACTION) TYPES
// ===========================================

export enum MetodeBayar {
  TUNAI = 'TUNAI',
  QRIS = 'QRIS',
  TRANSFER = 'TRANSFER',
  HUTANG = 'HUTANG',
  SPLIT = 'SPLIT',
}

export enum StatusTransaksi {
  SELESAI = 'SELESAI',
  BATAL = 'BATAL',
  HOLD = 'HOLD',
}

export enum StatusSync {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
}

export interface Transaksi {
  id: string;
  nomor: string;
  cabangId: string;
  kasirId: string;
  pelangganId?: string | null;
  tanggal: Date;
  tingkatHarga: number;
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: MetodeBayar;
  jumlahBayar: number;
  kembalian: number;
  catatan?: string | null;
  status: StatusTransaksi;
  statusSync: StatusSync;
  deviceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DetailTransaksi {
  id: string;
  transaksiId: string;
  produkId?: string | null;
  produkSatuanId?: string | null;
  namaBarang: string;
  barcode?: string | null;
  jumlah: number;
  satuan: string;
  konversi: number;
  hargaModal: number;
  hargaJual: number;
  tingkatHarga: number;
  diskon: number;
  subtotal: number;
  laba: number;
  isQuickSale: boolean;
  createdAt: Date;
}

export interface TransaksiWithDetails extends Transaksi {
  cabang?: Cabang;
  kasir?: User;
  pelanggan?: Pelanggan | null;
  detailTransaksi: DetailTransaksi[];
  totalLaba?: number;
}

// ===========================================
// PELANGGAN (CUSTOMER) TYPES
// ===========================================

export enum KategoriPelanggan {
  RETAIL = 'RETAIL',
  RESELLER = 'RESELLER',
  DISTRIBUTOR = 'DISTRIBUTOR',
}

export interface Pelanggan {
  id: string;
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
  kategori: KategoriPelanggan;
  maxHutang: number;
  totalBelanja: number;
  catatan?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// HUTANG (DEBT) TYPES
// ===========================================

export enum StatusHutang {
  BELUM_LUNAS = 'BELUM_LUNAS',
  LUNAS = 'LUNAS',
}

export interface Hutang {
  id: string;
  transaksiId: string;
  pelangganId: string;
  jumlah: number;
  sisa: number;
  jatuhTempo?: Date | null;
  status: StatusHutang;
  createdAt: Date;
  updatedAt: Date;
}

export interface HutangPembayaran {
  id: string;
  hutangId: string;
  jumlah: number;
  metode: MetodeBayar;
  catatan?: string | null;
  userId: string;
  createdAt: Date;
}

// ===========================================
// KAS (CASH) TYPES
// ===========================================

export enum JenisKas {
  MASUK = 'MASUK',
  KELUAR = 'KELUAR',
}

export interface Kas {
  id: string;
  cabangId: string;
  saldo: number;
  updatedAt: Date;
}

export interface KasMutasi {
  id: string;
  cabangId: string;
  jenis: JenisKas;
  kategori: string;
  nominal: number;
  saldoSebelum: number;
  saldoSesudah: number;
  keterangan?: string | null;
  referensiTipe?: string | null;
  referensiId?: string | null;
  userId: string;
  createdAt: Date;
}

// ===========================================
// SHIFT TYPES
// ===========================================

export enum StatusShift {
  BUKA = 'BUKA',
  TUTUP = 'TUTUP',
}

export interface Shift {
  id: string;
  cabangId: string;
  kasirId: string;
  modalAwal: number;
  totalPenjualan: number;
  totalTransaksi: number;
  kasAkhirSistem?: number | null;
  kasAkhirAktual?: number | null;
  selisih?: number | null;
  catatan?: string | null;
  waktuBuka: Date;
  waktuTutup?: Date | null;
  status: StatusShift;
}

// ===========================================
// RETUR (RETURN) TYPES
// ===========================================

export enum MetodeRefund {
  TUNAI = 'TUNAI',
  TUKAR_BARANG = 'TUKAR_BARANG',
}

export enum AlasanRetur {
  RUSAK = 'RUSAK',
  SALAH = 'SALAH',
  EXPIRED = 'EXPIRED',
  LAINNYA = 'LAINNYA',
}

export interface Retur {
  id: string;
  nomor: string;
  transaksiAsalId: string;
  cabangId: string;
  userId: string;
  tanggal: Date;
  totalRefund: number;
  metodeRefund: MetodeRefund;
  alasan: AlasanRetur;
  catatan?: string | null;
  createdAt: Date;
}

export interface ReturDetail {
  id: string;
  returId: string;
  detailTransaksiId: string;
  jumlah: number;
  nilaiRefund: number;
  createdAt: Date;
}

// ===========================================
// PENGATURAN (SETTINGS) TYPES
// ===========================================

export interface PengaturanHarga {
  id: string;
  tingkat: number;
  nama: string;
  warna: string;
  deskripsi?: string | null;
  updatedAt: Date;
}

export enum PrinterSize {
  SIZE_58MM = '58mm',
  SIZE_80MM = '80mm',
}

export interface PengaturanToko {
  id: string;
  namaToko: string;
  alamat?: string | null;
  telepon?: string | null;
  email?: string | null;
  logo?: string | null;
  footerStruk?: string | null;
  printerSize: PrinterSize;
  autoLogoutMenit: number;
  qrisImage?: string | null;
  rekeningBank?: RekeningBank[] | null;
  updatedAt: Date;
}

export interface RekeningBank {
  bank: string;
  noRekening: string;
  atasNama: string;
}

// ===========================================
// CART TYPES (untuk POS)
// ===========================================

export interface CartItemUnit {
  id: string;
  namaSatuan: string;
  konversi: number;
  harga1: number;
  harga2: number;
  harga3: number;
  harga4: number;
}

export interface CartItem {
  id: string; // Unique cart item id
  produkId: string;
  produkSatuanId: string;
  nama: string;
  barcode?: string | null;
  satuan: string;
  konversi: number;
  jumlah: number;
  hargaModal: number;
  hargaJual: number;
  diskon: number;
  subtotal: number;
  stokTersedia: number;
  availableUnits: CartItemUnit[]; // Daftar satuan yang tersedia untuk produk ini
}

export interface Cart {
  items: CartItem[];
  tingkatHarga: number;
  subtotal: number;
  diskon: number;
  total: number;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ===========================================
// REPORT TYPES
// ===========================================

export interface DashboardSummary {
  today: {
    penjualan: number;
    modal: number;
    laba: number;
    transaksi: number;
    rataRataTransaksi: number;
  };
  week: {
    penjualan: number;
    laba: number;
  };
  month: {
    penjualan: number;
    laba: number;
  };
  alerts: {
    stokMenipis: number;
    stokHabis: number;
    hutangJatuhTempo: number;
  };
  topProducts: Array<{
    id: string;
    nama: string;
    terjual: number;
    omzet: number;
  }>;
}

export interface SalesReportItem {
  tanggal: string;
  penjualan: number;
  modal: number;
  laba: number;
  margin: number;
  transaksi: number;
}

export interface ProfitReport {
  summary: {
    totalPenjualan: number;
    totalModal: number;
    totalLaba: number;
    margin: number;
    jumlahTransaksi: number;
  };
  details: SalesReportItem[];
}

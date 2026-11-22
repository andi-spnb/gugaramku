import { z } from 'zod';

// ===========================================
// HELPERS
// ===========================================

/** ID non-kosong (cuid/uuid) */
const id = z.string().min(1, 'ID tidak valid');

/** String opsional yang bisa null/empty */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullish();

const positiveNumber = z
  .number({ invalid_type_error: 'Harus berupa angka' })
  .positive('Harus lebih dari 0');

const nonNegativeNumber = z
  .number({ invalid_type_error: 'Harus berupa angka' })
  .min(0, 'Tidak boleh negatif');

// ===========================================
// USERS
// ===========================================

export const createUserSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi').max(100),
  email: z.string().email('Email tidak valid').max(255),
  password: z.string().min(6, 'Password minimal 6 karakter').max(100),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'PIN harus 4-6 digit angka')
    .nullish()
    .transform((v) => (v === '' ? null : v)),
  role: z.enum(['OWNER', 'ADMIN_CABANG', 'KASIR']),
  cabangId: id.nullish(),
});

export const updateUserSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  email: z.string().email('Email tidak valid').max(255).optional(),
  role: z.enum(['OWNER', 'ADMIN_CABANG', 'KASIR']).optional(),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'PIN harus 4-6 digit angka')
    .nullish()
    .transform((v) => (v === '' ? null : v)),
  cabangId: id.nullish(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password minimal 6 karakter').max(100),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'PIN harus 4-6 digit angka')
    .nullish()
    .transform((v) => (v === '' ? null : v)),
});

export const updateProfileSchema = z.object({
  nama: z.string().min(1, 'Nama harus diisi').max(100),
  email: z.string().email('Email tidak valid').max(255),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter').max(100).optional(),
  pin: z
    .union([
      z.literal(''),
      z.string().regex(/^\d{4,6}$/, 'PIN harus 4-6 digit angka'),
    ])
    .nullish()
    .transform((v) => (v === '' ? null : v)),
});

// ===========================================
// BRANCHES (CABANG)
// ===========================================

export const createBranchSchema = z.object({
  kode: z.string().min(1, 'Kode cabang harus diisi').max(20),
  nama: z.string().min(1, 'Nama cabang harus diisi').max(100),
  alamat: optionalText(255),
  telepon: optionalText(20),
  isActive: z.boolean().optional(),
});

export const updateBranchSchema = createBranchSchema.partial();

// ===========================================
// CATEGORIES
// ===========================================

export const createCategorySchema = z.object({
  nama: z.string().min(1, 'Nama kategori harus diisi').max(100),
  deskripsi: optionalText(255),
  urutan: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const reorderCategoriesSchema = z.object({
  orders: z
    .array(
      z.object({
        id,
        urutan: z.number().int().min(0),
      })
    )
    .min(1, 'Minimal 1 item diperlukan'),
});

// ===========================================
// CUSTOMERS (PELANGGAN)
// ===========================================

export const createCustomerSchema = z.object({
  nama: z.string().min(1, 'Nama pelanggan harus diisi').max(100),
  telepon: optionalText(20),
  alamat: optionalText(255),
  kategori: z.enum(['RETAIL', 'RESELLER', 'DISTRIBUTOR']).optional(),
  maxHutang: nonNegativeNumber.optional(),
  catatan: optionalText(500),
  isActive: z.boolean().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ===========================================
// PRODUCTS
// ===========================================

const produkSatuanSchema = z.object({
  namaSatuan: z.string().min(1, 'Nama satuan harus diisi').max(30),
  konversi: z.number({ invalid_type_error: 'Konversi harus berupa angka' }).min(
    1,
    'Konversi minimal 1'
  ),
  harga1: nonNegativeNumber,
  harga2: nonNegativeNumber.optional(),
  harga3: nonNegativeNumber.optional(),
  harga4: nonNegativeNumber.optional(),
  isDefault: z.boolean().optional(),
  urutan: z.number().int().min(0).optional(),
});

export const createProductSchema = z.object({
  nama: z.string().min(1, 'Nama produk harus diisi').max(200),
  barcode: optionalText(100),
  kategoriId: id.nullish(),
  satuanDasar: z.string().min(1, 'Satuan dasar harus diisi').max(50),
  hargaModal: nonNegativeNumber.optional(),
  stokAwal: nonNegativeNumber.optional(),
  satuan: z.array(produkSatuanSchema).min(1, 'Minimal 1 satuan diperlukan'),
});

export const updateProductSchema = createProductSchema.partial();

// ===========================================
// STOCK ADJUSTMENT
// ===========================================

export const stockAdjustmentSchema = z.object({
  produkId: id,
  jumlah: positiveNumber,
  tipe: z.enum(['ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'OPNAME', 'RUSAK', 'EXPIRED'], {
    errorMap: () => ({ message: 'Tipe adjustment tidak valid' }),
  }),
  keterangan: optionalText(500),
});

// ===========================================
// KAS (IN/OUT)
// ===========================================

export const kasMutationSchema = z.object({
  kategori: z.string().min(1, 'Kategori harus diisi').max(50),
  nominal: positiveNumber,
  keterangan: optionalText(500),
});

// ===========================================
// DEBTS
// ===========================================

export const debtPaySchema = z.object({
  jumlah: positiveNumber,
  metode: z.enum(['TUNAI', 'QRIS', 'TRANSFER']).default('TUNAI'),
  catatan: optionalText(500),
});

// ===========================================
// RETUR
// ===========================================

export const createReturSchema = z.object({
  transaksiId: id,
  metodeRefund: z.enum(['TUNAI', 'TUKAR_BARANG'], {
    errorMap: () => ({ message: 'Metode refund tidak valid' }),
  }),
  alasan: z.enum(['RUSAK', 'SALAH', 'EXPIRED', 'LAINNYA'], {
    errorMap: () => ({ message: 'Alasan retur tidak valid' }),
  }),
  catatan: optionalText(500),
  items: z
    .array(
      z.object({
        detailTransaksiId: id,
        jumlah: z
          .number({ invalid_type_error: 'Jumlah harus berupa angka' })
          .int('Jumlah harus bilangan bulat')
          .positive('Jumlah harus lebih dari 0'),
      })
    )
    .min(1, 'Minimal 1 item retur diperlukan'),
});

// ===========================================
// TRANSACTIONS
// ===========================================

const transactionItemSchema = z.object({
  // Quick sale tidak punya produk/produkSatuan, jadi null harus diterima (bukan hanya undefined)
  produkId: id.nullable().optional(),
  produkSatuanId: id.nullable().optional(),
  namaBarang: z.string().min(1, 'Nama barang harus diisi').max(200),
  barcode: optionalText(100),
  jumlah: positiveNumber,
  satuan: z.string().min(1).max(50),
  konversi: z
    .number({ invalid_type_error: 'Konversi harus berupa angka' })
    .min(1, 'Konversi minimal 1'),
  hargaModal: nonNegativeNumber,
  hargaJual: nonNegativeNumber,
  diskon: nonNegativeNumber,
  isQuickSale: z.boolean(),
});

export const createTransactionSchema = z.object({
  pelangganId: id.nullish(),
  tingkatHarga: z
    .number({ invalid_type_error: 'Tingkat harga harus berupa angka' })
    .int()
    .min(1, 'Tingkat harga 1-4')
    .max(4, 'Tingkat harga 1-4'),
  metodeBayar: z.enum(['TUNAI', 'QRIS', 'TRANSFER', 'HUTANG', 'SPLIT'], {
    errorMap: () => ({ message: 'Metode pembayaran tidak valid' }),
  }),
  jumlahBayar: nonNegativeNumber,
  catatan: optionalText(500),
  diskonTotal: nonNegativeNumber,
  items: z
    .array(transactionItemSchema)
    .min(1, 'Minimal 1 item diperlukan')
    .max(200, 'Maksimal 200 item per transaksi'),
});

export const holdTransactionSchema = z.object({
  tingkatHarga: z
    .number({ invalid_type_error: 'Tingkat harga harus berupa angka' })
    .int()
    .min(1, 'Tingkat harga 1-4')
    .max(4, 'Tingkat harga 1-4'),
  catatan: optionalText(500),
  diskonTotal: nonNegativeNumber,
  items: z
    .array(transactionItemSchema)
    .min(1, 'Minimal 1 item diperlukan')
    .max(200, 'Maksimal 200 item per transaksi'),
});

// ===========================================
// SETTINGS (PENGATURAN TOKO)
// ===========================================

const rekeningBankSchema = z.array(
  z.object({
    id: z.string().max(100).optional(),
    // Nama field mengikuti yang disimpan UI pengaturan: bank / noRekening / atasNama.
    // namaBank & nomorRekening dipertahankan untuk kompatibilitas data lama.
    bank: z.string().max(100).optional(),
    noRekening: z.string().max(100).optional(),
    namaBank: z.string().max(100).optional(),
    nomorRekening: z.string().max(100).optional(),
    atasNama: z.string().max(100).optional(),
  }).passthrough()
);

export const updateSettingsSchema = z.object({
  namaToko: z.string().min(1, 'Nama toko harus diisi').max(100),
  alamat: z.string().max(255).optional(),
  telepon: z.string().max(20).optional(),
  email: z.string().email('Email tidak valid').max(255).or(z.literal('')).optional(),
  logo: z.string().nullish(),
  footerStruk: z.string().max(500).optional(),
  printerSize: z.enum(['58mm', '80mm']).optional(),
  autoLogoutMenit: z
    .number({ invalid_type_error: 'Auto logout harus berupa angka' })
    .int()
    .min(1, 'Minimal 1 menit')
    .max(1440, 'Maksimal 1440 menit')
    .optional(),
  qrisImage: z.string().nullish(),
  rekeningBank: rekeningBankSchema.optional(),
});

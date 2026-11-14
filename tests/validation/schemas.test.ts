import { describe, it, expect } from 'vitest';
import {
  createUserSchema,
  createCustomerSchema,
  createProductSchema,
  createTransactionSchema,
  createReturSchema,
  debtPaySchema,
  stockAdjustmentSchema,
  kasMutationSchema,
  updateSettingsSchema,
} from '@/lib/validation/schemas';

const validItem = {
  produkId: 'produk-1',
  produkSatuanId: 'satuan-1',
  namaBarang: 'Garam Beryodium 1kg',
  barcode: '8991234567890',
  jumlah: 2,
  satuan: 'kg',
  konversi: 1,
  hargaModal: 5000,
  hargaJual: 7000,
  diskon: 0,
  isQuickSale: false,
};

const validTransaction = {
  pelangganId: null,
  tingkatHarga: 1,
  metodeBayar: 'TUNAI',
  jumlahBayar: 14000,
  catatan: null,
  diskonTotal: 0,
  items: [validItem],
};

describe('createTransactionSchema', () => {
  it('menerima transaksi valid', () => {
    const result = createTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it('menolak items kosong', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, items: [] });
    expect(result.success).toBe(false);
  });

  it('menolak jumlah item <= 0', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      items: [{ ...validItem, jumlah: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('menolak konversi < 1', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      items: [{ ...validItem, konversi: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('menolak diskon negatif', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      items: [{ ...validItem, diskon: -100 }],
    });
    expect(result.success).toBe(false);
  });

  it('menolak metodeBayar tidak dikenal', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      metodeBayar: 'KRYPTO',
    });
    expect(result.success).toBe(false);
  });

  it('menolak tingkatHarga di luar 1-4', () => {
    expect(
      createTransactionSchema.safeParse({ ...validTransaction, tingkatHarga: 0 }).success
    ).toBe(false);
    expect(
      createTransactionSchema.safeParse({ ...validTransaction, tingkatHarga: 5 }).success
    ).toBe(false);
  });

  it('menolak jumlahBayar negatif', () => {
    const result = createTransactionSchema.safeParse({ ...validTransaction, jumlahBayar: -1 });
    expect(result.success).toBe(false);
  });

  it('menolak lebih dari 200 item', () => {
    const items = Array.from({ length: 201 }, (_, i) => ({ ...validItem, namaBarang: `Item ${i}` }));
    const result = createTransactionSchema.safeParse({ ...validTransaction, items });
    expect(result.success).toBe(false);
  });

  it('menerima metode HUTANG dan SPLIT (validasi pelanggan tetap di route)', () => {
    expect(
      createTransactionSchema.safeParse({ ...validTransaction, metodeBayar: 'HUTANG' }).success
    ).toBe(true);
  });
});

describe('createUserSchema', () => {
  const validUser = {
    nama: 'Budi',
    email: 'budi@example.com',
    password: 'rahasia123',
    pin: null,
    role: 'KASIR',
    cabangId: 'cabang-1',
  };

  it('menerima user valid', () => {
    expect(createUserSchema.safeParse(validUser).success).toBe(true);
  });

  it('menolak password < 6 karakter', () => {
    expect(createUserSchema.safeParse({ ...validUser, password: 'abc' }).success).toBe(false);
  });

  it('menolak PIN bukan 4-6 digit', () => {
    expect(createUserSchema.safeParse({ ...validUser, pin: '12' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...validUser, pin: '1234567' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...validUser, pin: '12ab' }).success).toBe(false);
    expect(createUserSchema.safeParse({ ...validUser, pin: '1234' }).success).toBe(true);
  });

  it('menolak role tidak dikenal', () => {
    expect(createUserSchema.safeParse({ ...validUser, role: 'SUPERADMIN' }).success).toBe(false);
  });
});

describe('createCustomerSchema', () => {
  it('menerima pelanggan minimal (nama saja)', () => {
    const result = createCustomerSchema.safeParse({ nama: 'Toko Amanah' });
    expect(result.success).toBe(true);
  });

  it('menolak maxHutang negatif', () => {
    expect(createCustomerSchema.safeParse({ nama: 'X', maxHutang: -1 }).success).toBe(false);
  });

  it('menolak nama kosong', () => {
    expect(createCustomerSchema.safeParse({ nama: '' }).success).toBe(false);
  });
});

describe('createProductSchema', () => {
  const validProduct = {
    nama: 'Garam Premium',
    satuanDasar: 'kg',
    hargaModal: 5000,
    stokAwal: 100,
    satuan: [{ namaSatuan: 'kg', konversi: 1, harga1: 7000 }],
  };

  it('menerima produk valid', () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it('menolak tanpa satuan', () => {
    expect(createProductSchema.safeParse({ ...validProduct, satuan: [] }).success).toBe(false);
  });

  it('menolak konversi < 1', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      satuan: [{ namaSatuan: 'gram', konversi: 0, harga1: 7000 }],
    });
    expect(result.success).toBe(false);
  });

  it('menolak harga1 negatif', () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      satuan: [{ namaSatuan: 'kg', konversi: 1, harga1: -5 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('createReturSchema', () => {
  it('menerima retur valid', () => {
    const result = createReturSchema.safeParse({
      transaksiId: 'trx-1',
      metodeRefund: 'TUNAI',
      alasan: 'RUSAK',
      catatan: null,
      items: [{ detailTransaksiId: 'dt-1', jumlah: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('menolak items kosong', () => {
    const result = createReturSchema.safeParse({
      transaksiId: 'trx-1',
      metodeRefund: 'TUNAI',
      alasan: 'RUSAK',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('menolak jumlah retur non-integer', () => {
    const result = createReturSchema.safeParse({
      transaksiId: 'trx-1',
      metodeRefund: 'TUNAI',
      alasan: 'RUSAK',
      items: [{ detailTransaksiId: 'dt-1', jumlah: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

  it('menolak alasan tidak dikenal', () => {
    const result = createReturSchema.safeParse({
      transaksiId: 'trx-1',
      metodeRefund: 'TUNAI',
      alasan: 'KENYANG',
      items: [{ detailTransaksiId: 'dt-1', jumlah: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('debtPaySchema', () => {
  it('menerima pembayaran valid tanpa metode (default TUNAI)', () => {
    const result = debtPaySchema.parse({ jumlah: 5000 });
    expect(result.metode).toBe('TUNAI');
  });

  it('menolak jumlah <= 0', () => {
    expect(debtPaySchema.safeParse({ jumlah: 0 }).success).toBe(false);
    expect(debtPaySchema.safeParse({ jumlah: -100 }).success).toBe(false);
  });

  it('menolak metode tidak dikenal', () => {
    expect(debtPaySchema.safeParse({ jumlah: 5000, metode: 'GIRO' }).success).toBe(false);
  });
});

describe('stockAdjustmentSchema', () => {
  it('menerima adjustment valid', () => {
    const result = stockAdjustmentSchema.safeParse({
      produkId: 'p1',
      jumlah: 10,
      tipe: 'OPNAME',
      keterangan: null,
    });
    expect(result.success).toBe(true);
  });

  it('menolak tipe tidak dikenal', () => {
    const result = stockAdjustmentSchema.safeParse({
      produkId: 'p1',
      jumlah: 10,
      tipe: 'PINDAH_GUDANG',
    });
    expect(result.success).toBe(false);
  });

  it('menolak jumlah 0', () => {
    const result = stockAdjustmentSchema.safeParse({ produkId: 'p1', jumlah: 0, tipe: 'OPNAME' });
    expect(result.success).toBe(false);
  });
});

describe('kasMutationSchema', () => {
  it('menerima mutasi kas valid', () => {
    const result = kasMutationSchema.safeParse({
      kategori: 'Modal',
      nominal: 100000,
      keterangan: 'Setoran awal',
    });
    expect(result.success).toBe(true);
  });

  it('menolak nominal <= 0', () => {
    expect(kasMutationSchema.safeParse({ kategori: 'Modal', nominal: 0 }).success).toBe(false);
  });

  it('menolak kategori kosong', () => {
    expect(kasMutationSchema.safeParse({ kategori: '', nominal: 1000 }).success).toBe(false);
  });
});

describe('updateSettingsSchema', () => {
  it('menerima setting valid', () => {
    const result = updateSettingsSchema.safeParse({
      namaToko: 'GuGaramKu',
      alamat: 'Jl. Garam No. 1',
      printerSize: '58mm',
      autoLogoutMenit: 30,
    });
    expect(result.success).toBe(true);
  });

  it('menolak namaToko kosong', () => {
    expect(updateSettingsSchema.safeParse({ namaToko: '' }).success).toBe(false);
  });

  it('menolak printerSize tidak dikenal', () => {
    expect(updateSettingsSchema.safeParse({ namaToko: 'X', printerSize: 'A4' }).success).toBe(false);
  });

  it('menolak autoLogoutMenit di luar 1-1440', () => {
    expect(updateSettingsSchema.safeParse({ namaToko: 'X', autoLogoutMenit: 0 }).success).toBe(false);
    expect(
      updateSettingsSchema.safeParse({ namaToko: 'X', autoLogoutMenit: 1441 }).success
    ).toBe(false);
  });

  it('menolak email tidak valid', () => {
    expect(updateSettingsSchema.safeParse({ namaToko: 'X', email: 'bukan-email' }).success).toBe(
      false
    );
  });
});

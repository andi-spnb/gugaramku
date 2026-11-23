/**
 * Test integrasi alur uang & stok (batch 1 audit fix):
 * - K1: laba dihitung dengan konversi satuan
 * - K2: quick sale tidak bisa membawa produk terdaftar (anti-fraud)
 * - K3: idempotency clientRef untuk retry offline
 * - T1: QRIS/TRANSFER wajib lunas
 * - T2: retur transaksi hutang mengkredit sisa hutang
 * - T3: pembayaran hutang anti overpayment (race condition)
 *
 * Route handler dipanggil langsung dengan NextRequest + requireAuth di-mock.
 * DB: prisma/test-api.db (dipush oleh tests/setup-api.ts, ter-ignore git).
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api-auth', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/audit-log', () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import { POST as createTransactionPOST } from '@/app/api/transactions/route';
import { POST as createReturPOST } from '@/app/api/retur/route';
import { POST as payDebtPOST } from '@/app/api/debts/[id]/pay/route';

// ==========================================
// Helpers
// ==========================================

let seq = 0;

function post(body: unknown, url = 'http://localhost/api/test') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

async function json(res: Response) {
  return { status: res.status, body: await res.json() };
}

function mockKasir(cabangId: string, id: string) {
  vi.mocked(requireAuth).mockResolvedValue({
    ok: true,
    user: { id, role: 'KASIR', cabangId },
  } as never);
}

async function seed() {
  seq += 1;
  const suffix = `${seq}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cabang = await prisma.cabang.create({
    data: { kode: `TST${suffix}`, nama: 'Toko Test', isActive: true },
  });
  const kasir = await prisma.user.create({
    data: {
      cabangId: cabang.id,
      nama: 'Kasir Test',
      email: `kasir-${suffix}@test.local`,
      password: 'x',
      role: 'KASIR',
      isActive: true,
    },
  });
  const kategori = await prisma.kategori.create({
    data: { nama: `Sembako-${suffix}`, urutan: 1 },
  });
  const produk = await prisma.produk.create({
    data: {
      barcode: `BC-${suffix}`,
      nama: 'Indomie Goreng',
      kategoriId: kategori.id,
      hargaModal: 3000,
      satuanDasar: 'bks',
      isActive: true,
    },
  });
  // Dos: konversi 40, harga 135.000 (modal dasar 3.000/bks -> modal Dos = 120.000)
  const dos = await prisma.produkSatuan.create({
    data: {
      produkId: produk.id,
      namaSatuan: 'Dos',
      konversi: 40,
      harga1: 135000,
      isDefault: false,
      urutan: 1,
    },
  });
  const bks = await prisma.produkSatuan.create({
    data: {
      produkId: produk.id,
      namaSatuan: 'Bks',
      konversi: 1,
      harga1: 3500,
      isDefault: true,
      urutan: 2,
    },
  });
  await prisma.stok.create({
    data: { produkId: produk.id, cabangId: cabang.id, jumlah: 100, stokMinimum: 10 },
  });
  return { cabang, kasir, produk, dos, bks };
}

async function stokCabang(produkId: string, cabangId: string) {
  const stok = await prisma.stok.findFirst({ where: { produkId, cabangId } });
  return Number(stok?.jumlah);
}

beforeEach(async () => {
  // Bersihkan semua tabel (urut dari child ke parent)
  await prisma.hutangPembayaran.deleteMany();
  await prisma.hutang.deleteMany();
  await prisma.returDetail.deleteMany();
  await prisma.retur.deleteMany();
  await prisma.kasMutasi.deleteMany();
  await prisma.kas.deleteMany();
  await prisma.stokMutasi.deleteMany();
  await prisma.stok.deleteMany();
  await prisma.detailTransaksi.deleteMany();
  await prisma.transaksi.deleteMany();
  await prisma.produkSatuan.deleteMany();
  await prisma.produk.deleteMany();
  await prisma.kategori.deleteMany();
  await prisma.pelanggan.deleteMany();
  await prisma.logAktivitas.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cabang.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ==========================================
// K1: Laba multi-satuan
// ==========================================

describe('POST /api/transactions - perhitungan laba (K1)', () => {
  it('menghitung laba dengan konversi: jual 1 Dos (40 Bks) = harga - modal*koversi', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'TUNAI',
        jumlahBayar: 135000,
        diskonTotal: 0,
        items: [
          {
            produkId: f.produk.id,
            produkSatuanId: f.dos.id,
            namaBarang: 'Indomie Goreng',
            jumlah: 1,
            satuan: 'Dos',
            konversi: 40,
            hargaModal: 3000,
            hargaJual: 135000,
            diskon: 0,
            isQuickSale: false,
          },
        ],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(201);
    // (135.000 - 3.000*40) * 1 = 15.000 (rumus lama: 132.000 — salah)
    expect(body.data.detailTransaksi[0].laba).toBe(15000);
    const detail = await prisma.detailTransaksi.findFirstOrThrow();
    expect(Number(detail.laba)).toBe(15000);
    // stok terpotong 40
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(60);
  });

  it('laba tetap benar untuk satuan dasar (konversi 1)', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'TUNAI',
        jumlahBayar: 10500,
        diskonTotal: 0,
        items: [
          {
            produkId: f.produk.id,
            produkSatuanId: f.bks.id,
            namaBarang: 'Indomie Goreng',
            jumlah: 3,
            satuan: 'Bks',
            konversi: 1,
            hargaModal: 3000,
            hargaJual: 3500,
            diskon: 0,
            isQuickSale: false,
          },
        ],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(201);
    // (3.500 - 3.000*1) * 3 = 1.500
    expect(body.data.detailTransaksi[0].laba).toBe(1500);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(97);
  });
});

// ==========================================
// K2: Quick sale anti-fraud
// ==========================================

describe('POST /api/transactions - quick sale (K2)', () => {
  it('menolak quick sale yang membawa produk terdaftar', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'TUNAI',
        jumlahBayar: 0,
        diskonTotal: 0,
        items: [
          {
            produkId: f.produk.id,
            produkSatuanId: f.dos.id,
            namaBarang: 'Indomie Goreng',
            jumlah: 1,
            satuan: 'Dos',
            konversi: 40,
            hargaModal: 0,
            hargaJual: 0,
            diskon: 0,
            isQuickSale: true,
          },
        ],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    // Tidak ada transaksi & stok utuh
    expect(await prisma.transaksi.count()).toBe(0);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(100);
  });

  it('quick sale barang tak terdaftar tetap berjalan & tidak menyentuh stok', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'TUNAI',
        jumlahBayar: 5000,
        diskonTotal: 0,
        items: [
          {
            produkId: null,
            produkSatuanId: null,
            namaBarang: 'Produk Tanpa Nama',
            jumlah: 1,
            satuan: 'pcs',
            konversi: 1,
            hargaModal: 0,
            hargaJual: 5000,
            diskon: 0,
            isQuickSale: true,
          },
        ],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(201);
    expect(body.data.detailTransaksi[0].laba).toBe(5000);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(100);
  });

  it('barang terdaftar tanpa produkSatuanId ditolak', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'TUNAI',
        jumlahBayar: 3500,
        diskonTotal: 0,
        items: [
          {
            produkId: f.produk.id,
            produkSatuanId: null,
            namaBarang: 'Indomie Goreng',
            jumlah: 1,
            satuan: 'Bks',
            konversi: 1,
            hargaModal: 3000,
            hargaJual: 3500,
            diskon: 0,
            isQuickSale: false,
          },
        ],
      })
    );
    const { status } = await json(res);
    expect(status).toBe(400);
    expect(await prisma.transaksi.count()).toBe(0);
  });
});

// ==========================================
// K3: Idempotency retry offline
// ==========================================

describe('POST /api/transactions - idempotency (K3)', () => {
  it('payload sama dengan clientRef sama hanya dibuat sekali', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const payload = {
      clientRef: 'test-client-ref-001',
      tingkatHarga: 1,
      metodeBayar: 'TUNAI',
      jumlahBayar: 3500,
      diskonTotal: 0,
      items: [
        {
          produkId: f.produk.id,
          produkSatuanId: f.bks.id,
          namaBarang: 'Indomie Goreng',
          jumlah: 1,
          satuan: 'Bks',
          konversi: 1,
          hargaModal: 3000,
          hargaJual: 3500,
          diskon: 0,
          isQuickSale: false,
        },
      ],
    };

    const r1 = await json(await createTransactionPOST(post(payload)));
    const r2 = await json(await createTransactionPOST(post(payload)));

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    // Transaksi sama (nomor sama), bukan transaksi baru
    expect(r2.body.data.nomor).toBe(r1.body.data.nomor);
    expect(await prisma.transaksi.count()).toBe(1);
    // Stok hanya terpotong sekali
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(99);
  });

  it('clientRef berbeda = transaksi berbeda', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const base = {
      tingkatHarga: 1,
      metodeBayar: 'TUNAI',
      jumlahBayar: 3500,
      diskonTotal: 0,
      items: [
        {
          produkId: f.produk.id,
          produkSatuanId: f.bks.id,
          namaBarang: 'Indomie Goreng',
          jumlah: 1,
          satuan: 'Bks',
          konversi: 1,
          hargaModal: 3000,
          hargaJual: 3500,
          diskon: 0,
          isQuickSale: false,
        },
      ],
    };

    const r1 = await createTransactionPOST(post({ ...base, clientRef: 'ref-a' }));
    const r2 = await createTransactionPOST(post({ ...base, clientRef: 'ref-b' }));
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(await prisma.transaksi.count()).toBe(2);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(98);
  });
});

// ==========================================
// T1: QRIS/TRANSFER wajib lunas
// ==========================================

describe('POST /api/transactions - validasi pembayaran (T1)', () => {
  it('menolak QRIS dengan jumlah bayar kurang dari total', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'QRIS',
        jumlahBayar: 0,
        diskonTotal: 0,
        items: [
          {
            produkId: f.produk.id,
            produkSatuanId: f.dos.id,
            namaBarang: 'Indomie Goreng',
            jumlah: 1,
            satuan: 'Dos',
            konversi: 40,
            hargaModal: 3000,
            hargaJual: 135000,
            diskon: 0,
            isQuickSale: false,
          },
        ],
      })
    );
    const { status } = await json(res);

    expect(status).toBe(400);
    expect(await prisma.transaksi.count()).toBe(0);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(100);
  });

  it('QRIS dengan jumlah bayar pas diterima', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const res = await createTransactionPOST(
      post({
        tingkatHarga: 1,
        metodeBayar: 'QRIS',
        jumlahBayar: 135000,
        diskonTotal: 0,
        items: [
          {
            produkId: f.produk.id,
            produkSatuanId: f.dos.id,
            namaBarang: 'Indomie Goreng',
            jumlah: 1,
            satuan: 'Dos',
            konversi: 40,
            hargaModal: 3000,
            hargaJual: 135000,
            diskon: 0,
            isQuickSale: false,
          },
        ],
      })
    );
    const { status } = await json(res);
    expect(status).toBe(201);
  });
});

// ==========================================
// T2: Retur transaksi hutang
// ==========================================

describe('POST /api/retur - retur transaksi HUTANG (T2)', () => {
  it('refund dikreditkan ke sisa hutang, kas tidak berkurang', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const pelanggan = await prisma.pelanggan.create({
      data: { nama: 'Bu Test', maxHutang: 0, isActive: true },
    });

    // Transaksi hutang: 2 Bks @3.500 = 7.000
    const trxRes = await json(
      await createTransactionPOST(
        post({
          tingkatHarga: 1,
          metodeBayar: 'HUTANG',
          jumlahBayar: 0,
          diskonTotal: 0,
          pelangganId: pelanggan.id,
          items: [
            {
              produkId: f.produk.id,
              produkSatuanId: f.bks.id,
              namaBarang: 'Indomie Goreng',
              jumlah: 2,
              satuan: 'Bks',
              konversi: 1,
              hargaModal: 3000,
              hargaJual: 3500,
              diskon: 0,
              isQuickSale: false,
            },
          ],
        })
      )
    );
    expect(trxRes.status).toBe(201);
    const trx = await prisma.transaksi.findFirstOrThrow({ include: { detailTransaksi: true } });
    const hutangAwal = await prisma.hutang.findFirstOrThrow();
    expect(Number(hutangAwal.sisa)).toBe(7000);

    // Kas punya saldo 50.000 sebelum retur
    await prisma.kas.create({ data: { cabangId: f.cabang.id, saldo: 50000 } });

    // Retur 1 Bks -> refund proporsional 3.500
    const res = await createReturPOST(
      post({
        transaksiId: trx.id,
        metodeRefund: 'TUNAI',
        alasan: 'RUSAK',
        items: [{ detailTransaksiId: trx.detailTransaksi[0].id, jumlah: 1 }],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(201);
    expect(body.data.hutangKredit).toBe(3500);

    // Hutang berkurang
    const hutangAfter = await prisma.hutang.findFirstOrThrow();
    expect(Number(hutangAfter.sisa)).toBe(3500);
    expect(hutangAfter.status).toBe('BELUM_LUNAS');

    // Kas TIDAK keluar (refund jadi kredit hutang)
    const kas = await prisma.kas.findFirstOrThrow({ where: { cabangId: f.cabang.id } });
    expect(Number(kas.saldo)).toBe(50000);
    expect(await prisma.kasMutasi.count()).toBe(0);

    // Stok: 100 - 2 (jual) + 1 (retur) = 99
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(99);
  });

  it('retur lebih besar dari sisa hutang: hutang lunas, sisanya tunai', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    const pelanggan = await prisma.pelanggan.create({
      data: { nama: 'Bu Test', maxHutang: 0, isActive: true },
    });

    // Transaksi hutang: 1 Dos = 135.000
    const trxRes = await json(
      await createTransactionPOST(
        post({
          tingkatHarga: 1,
          metodeBayar: 'HUTANG',
          jumlahBayar: 0,
          diskonTotal: 0,
          pelangganId: pelanggan.id,
          items: [
            {
              produkId: f.produk.id,
              produkSatuanId: f.dos.id,
              namaBarang: 'Indomie Goreng',
              jumlah: 1,
              satuan: 'Dos',
              konversi: 40,
              hargaModal: 3000,
              hargaJual: 135000,
              diskon: 0,
              isQuickSale: false,
            },
          ],
        })
      )
    );
    expect(trxRes.status).toBe(201);
    const trx = await prisma.transaksi.findFirstOrThrow({ include: { detailTransaksi: true } });

    await prisma.kas.create({ data: { cabangId: f.cabang.id, saldo: 10000 } });

    // Retur 1 Dos penuh: refund 135.000, hutang 135.000 -> lunas semua via kredit
    const res = await createReturPOST(
      post({
        transaksiId: trx.id,
        metodeRefund: 'TUNAI',
        alasan: 'SALAH',
        items: [{ detailTransaksiId: trx.detailTransaksi[0].id, jumlah: 1 }],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(201);
    expect(body.data.hutangKredit).toBe(135000);

    const hutangAfter = await prisma.hutang.findFirstOrThrow();
    expect(Number(hutangAfter.sisa)).toBe(0);
    expect(hutangAfter.status).toBe('LUNAS');

    // Kas tidak berkurang (refund pas dengan hutang)
    const kas = await prisma.kas.findFirstOrThrow({ where: { cabangId: f.cabang.id } });
    expect(Number(kas.saldo)).toBe(10000);
  });

  it('retur transaksi TUNAI tetap mengeluarkan kas', async () => {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);

    // Cabang sudah punya row Kas sebelum transaksi (pembuatan otomatis = temuan S3, batch berikutnya)
    await prisma.kas.create({ data: { cabangId: f.cabang.id, saldo: 0 } });

    const trxRes = await json(
      await createTransactionPOST(
        post({
          tingkatHarga: 1,
          metodeBayar: 'TUNAI',
          jumlahBayar: 7000,
          diskonTotal: 0,
          items: [
            {
              produkId: f.produk.id,
              produkSatuanId: f.bks.id,
              namaBarang: 'Indomie Goreng',
              jumlah: 2,
              satuan: 'Bks',
              konversi: 1,
              hargaModal: 3000,
              hargaJual: 3500,
              diskon: 0,
              isQuickSale: false,
            },
          ],
        })
      )
    );
    expect(trxRes.status).toBe(201);
    const trx = await prisma.transaksi.findFirstOrThrow({ include: { detailTransaksi: true } });

    // Kas dari penjualan tunai: 7.000
    const kasSebelum = await prisma.kas.findFirstOrThrow({ where: { cabangId: f.cabang.id } });
    expect(Number(kasSebelum.saldo)).toBe(7000);

    const res = await createReturPOST(
      post({
        transaksiId: trx.id,
        metodeRefund: 'TUNAI',
        alasan: 'RUSAK',
        items: [{ detailTransaksiId: trx.detailTransaksi[0].id, jumlah: 1 }],
      })
    );
    const { status, body } = await json(res);

    expect(status).toBe(201);
    expect(body.data.hutangKredit).toBe(0);
    const kas = await prisma.kas.findFirstOrThrow({ where: { cabangId: f.cabang.id } });
    expect(Number(kas.saldo)).toBe(3500);
    const mutasi = await prisma.kasMutasi.findFirstOrThrow({ where: { jenis: 'KELUAR' } });
    expect(mutasi.jenis).toBe('KELUAR');
    expect(Number(mutasi.nominal)).toBe(3500);
  });
});

// ==========================================
// T3: Pembayaran hutang anti overpayment
// ==========================================

describe('POST /api/debts/[id]/pay - overpayment (T3)', () => {
  async function seedHutang(total = 100000) {
    const f = await seed();
    mockKasir(f.cabang.id, f.kasir.id);
    const pelanggan = await prisma.pelanggan.create({
      data: { nama: 'Bu Test', maxHutang: 0, isActive: true },
    });
    const trx = await prisma.transaksi.create({
      data: {
        nomor: `TRX-TST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cabangId: f.cabang.id,
        kasirId: f.kasir.id,
        tanggal: new Date(),
        tingkatHarga: 1,
        subtotal: total,
        diskon: 0,
        total,
        metodeBayar: 'HUTANG',
        jumlahBayar: 0,
        kembalian: 0,
        status: 'SELESAI',
      },
    });
    const hutang = await prisma.hutang.create({
      data: { transaksiId: trx.id, pelangganId: pelanggan.id, jumlah: total, sisa: total, status: 'BELUM_LUNAS' },
    });
    await prisma.kas.create({ data: { cabangId: f.cabang.id, saldo: 0 } });
    return { f, hutang };
  }

  it('dua pembayaran bersamaan: satu sukses, satu ditolak OVERPAYMENT', async () => {
    const { hutang } = await seedHutang(100000);

    const [r1, r2] = await Promise.all([
      payDebtPOST(post({ jumlah: 60000, metode: 'TUNAI' }), { params: Promise.resolve({ id: hutang.id }) }),
      payDebtPOST(post({ jumlah: 60000, metode: 'TUNAI' }), { params: Promise.resolve({ id: hutang.id }) }),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 400]);

    const after = await prisma.hutang.findUniqueOrThrow({ where: { id: hutang.id } });
    expect(Number(after.sisa)).toBe(40000);
    expect(after.status).toBe('BELUM_LUNAS');
    expect(await prisma.hutangPembayaran.count()).toBe(1);
  });

  it('pembayaran parsial bertahap sampai lunas', async () => {
    const { hutang } = await seedHutang(100000);

    const r1 = await json(await payDebtPOST(post({ jumlah: 60000 }), { params: Promise.resolve({ id: hutang.id }) }));
    expect(r1.status).toBe(200);
    expect(r1.body.data.hutang.sisa).toBe(40000);

    const r2 = await json(await payDebtPOST(post({ jumlah: 40000 }), { params: Promise.resolve({ id: hutang.id }) }));
    expect(r2.status).toBe(200);
    expect(Number(r2.body.data.hutang.sisa)).toBe(0);
    expect(r2.body.data.hutang.status).toBe('LUNAS');

    // Bayar lagi setelah lunas -> ditolak
    const r3 = await json(await payDebtPOST(post({ jumlah: 5000 }), { params: Promise.resolve({ id: hutang.id }) }));
    expect(r3.status).toBe(400);
    expect(r3.body.error.code).toBe('ALREADY_PAID');
  });

  it('pembayaran melebihi sisa ditolak', async () => {
    const { hutang } = await seedHutang(100000);

    const r1 = await json(await payDebtPOST(post({ jumlah: 150000 }), { params: Promise.resolve({ id: hutang.id }) }));
    expect(r1.status).toBe(400);
    expect(r1.body.error.code).toBe('OVERPAYMENT');
    expect(Number((await prisma.hutang.findUniqueOrThrow({ where: { id: hutang.id } })).sisa)).toBe(100000);
    expect(await prisma.hutangPembayaran.count()).toBe(0);
  });
});

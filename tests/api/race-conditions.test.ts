/**
 * Test race conditions (batch 3 audit fix):
 * - K6: saldo kas di-update atomik (increment/decrement), bukan read-then-write
 * - T7: nomor transaksi/HOLD tidak bentrok saat dua kasir submit bersamaan
 * - T4: user tanpa cabang tidak bisa bayar hutang / hapus HOLD lintas cabang
 * - T5: stock adjustment tidak menimpa penjualan bersamaan
 *
 * Route handler dipanggil langsung dengan NextRequest + requireAuth di-mock.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api-auth', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/audit-log', () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import { POST as createTransactionPOST } from '@/app/api/transactions/route';
import { DELETE as deleteHoldPOST } from '@/app/api/transactions/hold/[id]/route';
import { POST as adjustStockPOST } from '@/app/api/stock/adjustment/route';
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

function del(url = 'http://localhost/api/test') {
  return new NextRequest(url, { method: 'DELETE' });
}

async function json(res: Response) {
  return { status: res.status, body: await res.json() };
}

function mockUser(user: { id: string; role: string; cabangId: string | null }) {
  vi.mocked(requireAuth).mockResolvedValue({ ok: true, user } as never);
}

async function seed(suffix: string) {
  const cabang = await prisma.cabang.create({
    data: { kode: `TST${suffix}`, nama: 'Toko Test', isActive: true },
  });
  const cabangLain = await prisma.cabang.create({
    data: { kode: `OTH${suffix}`, nama: 'Cabang Lain', isActive: true },
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
  const bks = await prisma.produkSatuan.create({
    data: {
      produkId: produk.id,
      namaSatuan: 'Bks',
      konversi: 1,
      harga1: 3500,
      isDefault: true,
      urutan: 1,
    },
  });
  await prisma.stok.create({
    data: { produkId: produk.id, cabangId: cabang.id, jumlah: 100, stokMinimum: 10 },
  });
  await prisma.kas.create({ data: { cabangId: cabang.id, saldo: 0 } });
  return { cabang, cabangLain, kasir, produk, bks };
}

async function stokCabang(produkId: string, cabangId: string) {
  const stok = await prisma.stok.findFirst({ where: { produkId, cabangId } });
  return Number(stok?.jumlah);
}

function bksItem(f: Awaited<ReturnType<typeof seed>>, jumlah = 1) {
  return {
    produkId: f.produk.id,
    produkSatuanId: f.bks.id,
    namaBarang: 'Indomie Goreng',
    jumlah,
    satuan: 'Bks',
    konversi: 1,
    hargaModal: 3000,
    hargaJual: 3500,
    diskon: 0,
    isQuickSale: false,
  };
}

beforeEach(async () => {
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
// K6 + T7: penjualan tunai bersamaan
// ==========================================

describe('POST /api/transactions - kas & nomor bersamaan (K6+T7)', () => {
  it('3 penjualan tunai bersamaan: semua sukses, nomor unik, kas & mutasi konsisten', async () => {
    const f = await seed(`k6-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const payload = (clientRef: string) => ({
      clientRef,
      tingkatHarga: 1,
      metodeBayar: 'TUNAI',
      jumlahBayar: 3500,
      diskonTotal: 0,
      items: [bksItem(f)],
    });

    const results = await Promise.all([
      json(await createTransactionPOST(post(payload('k6-a')))),
      json(await createTransactionPOST(post(payload('k6-b')))),
      json(await createTransactionPOST(post(payload('k6-c')))),
    ]);

    // Semua sukses (dulu: nomor bentrok -> P2002 -> 500)
    for (const r of results) {
      expect(r.status, JSON.stringify(r.body)).toBe(201);
    }
    const nomors = results.map((r) => r.body.data.nomor);
    expect(new Set(nomors).size).toBe(3);

    // Kas bertambah tepat 3 x 3.500 (dulu: saldo bisa 3.500 atau 7.000)
    const kas = await prisma.kas.findFirstOrThrow({ where: { cabangId: f.cabang.id } });
    expect(Number(kas.saldo)).toBe(10500);

    // Mutasi kas: rantai saldoSebelum -> saldoSesudah konsisten
    const mutasi = await prisma.kasMutasi.findMany({ where: { cabangId: f.cabang.id } });
    expect(mutasi.length).toBe(3);
    const sesudah = mutasi.map((m) => Number(m.saldoSesudah)).sort((a, b) => a - b);
    const sebelum = mutasi.map((m) => Number(m.saldoSebelum)).sort((a, b) => a - b);
    expect(sesudah).toEqual([3500, 7000, 10500]);
    expect(sebelum).toEqual([0, 3500, 7000]);
    for (const m of mutasi) {
      expect(Number(m.saldoSesudah) - Number(m.saldoSebelum)).toBe(3500);
    }

    // Stok terpotong tepat 3
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(97);
  });
});

// ==========================================
// T5: adjustment vs penjualan bersamaan
// ==========================================

describe('POST /api/stock/adjustment - race dengan penjualan (T5)', () => {
  it('adjustment plus bersamaan penjualan: hasil akhir tepat (tidak saling menimpa)', async () => {
    const f = await seed(`t5-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const [sale, adj] = await Promise.all([
      json(
        await createTransactionPOST(
          post({
            tingkatHarga: 1,
            metodeBayar: 'TUNAI',
            jumlahBayar: 3500,
            diskonTotal: 0,
            items: [bksItem(f)],
          })
        )
      ),
      json(
        await adjustStockPOST(
          post({ produkId: f.produk.id, jumlah: 5, tipe: 'ADJUSTMENT_PLUS' })
        )
      ),
    ]);

    expect(sale.status, JSON.stringify(sale.body)).toBe(201);
    expect(adj.status, JSON.stringify(adj.body)).toBe(201);

    // Dulu: adjustment set absolute 105 dari bacaan 100 -> penjualan hilang (105/99)
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(104);
  });

  it('ADJUSTMENT_MINUS melebihi stok ditolak & stok tidak berubah', async () => {
    const f = await seed(`t5b-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const res = await json(
      await adjustStockPOST(
        post({ produkId: f.produk.id, jumlah: 200, tipe: 'ADJUSTMENT_MINUS' })
      )
    );
    expect(res.status).toBe(400);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(100);
  });

  it('OPNAME set stok absolut', async () => {
    const f = await seed(`t5c-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const res = await json(
      await adjustStockPOST(post({ produkId: f.produk.id, jumlah: 50, tipe: 'OPNAME' }))
    );
    expect(res.status).toBe(201);
    expect(await stokCabang(f.produk.id, f.cabang.id)).toBe(50);

    const mutasi = await prisma.stokMutasi.findFirstOrThrow();
    expect(Number(mutasi.jumlahSebelum)).toBe(100);
    expect(Number(mutasi.jumlahSesudah)).toBe(50);
    expect(Number(mutasi.jumlah)).toBe(-50);
  });

  it('OPNAME pada produk tanpa row stok membuat row baru', async () => {
    const f = await seed(`t5d-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const produkBaru = await prisma.produk.create({
      data: {
        barcode: `BC-NEW-${seq}-${Date.now()}`,
        nama: 'Produk Baru',
        satuanDasar: 'pcs',
        hargaModal: 1000,
        isActive: true,
      },
    });

    const res = await json(
      await adjustStockPOST(post({ produkId: produkBaru.id, jumlah: 12, tipe: 'OPNAME' }))
    );
    expect(res.status).toBe(201);
    expect(await stokCabang(produkBaru.id, f.cabang.id)).toBe(12);
  });
});

// ==========================================
// T4: guard cabang (user tanpa cabang / cabang lain)
// ==========================================

describe('POST /api/debts/[id]/pay - guard cabang (T4)', () => {
  async function seedHutang(suffix: string) {
    const f = await seed(suffix);
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
        subtotal: 100000,
        diskon: 0,
        total: 100000,
        metodeBayar: 'HUTANG',
        jumlahBayar: 0,
        kembalian: 0,
        status: 'SELESAI',
      },
    });
    const hutang = await prisma.hutang.create({
      data: {
        transaksiId: trx.id,
        pelangganId: pelanggan.id,
        jumlah: 100000,
        sisa: 100000,
        status: 'BELUM_LUNAS',
      },
    });
    return { f, hutang };
  }

  it('user tanpa cabang ditolak 403', async () => {
    const { f, hutang } = await seedHutang(`t4a-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: null });

    const res = await json(await payDebtPOST(post({ jumlah: 50000 }), { params: Promise.resolve({ id: hutang.id }) }));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    // Hutang tidak berubah
    expect(Number((await prisma.hutang.findUniqueOrThrow({ where: { id: hutang.id } })).sisa)).toBe(100000);
  });

  it('user cabang lain ditolak 403', async () => {
    const { f, hutang } = await seedHutang(`t4b-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabangLain.id });

    const res = await json(await payDebtPOST(post({ jumlah: 50000 }), { params: Promise.resolve({ id: hutang.id }) }));
    expect(res.status).toBe(403);
  });

  it('dua pembayaran bersamaan: kas & mutasi tetap konsisten (K6)', async () => {
    const { f, hutang } = await seedHutang(`t4c-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const [r1, r2] = await Promise.all([
      json(await payDebtPOST(post({ jumlah: 60000 }), { params: Promise.resolve({ id: hutang.id }) })),
      json(await payDebtPOST(post({ jumlah: 20000 }), { params: Promise.resolve({ id: hutang.id }) })),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    const kas = await prisma.kas.findFirstOrThrow({ where: { cabangId: f.cabang.id } });
    expect(Number(kas.saldo)).toBe(80000);

    const mutasi = await prisma.kasMutasi.findMany({ where: { cabangId: f.cabang.id } });
    expect(mutasi.length).toBe(2);
    const sesudah = mutasi.map((m) => Number(m.saldoSesudah)).sort((a, b) => a - b);
    // Urutan antar pembayaran tidak deterministik; yang penting rantai konsisten
    // dan nilai akhir = saldo kas.
    expect(Math.max(...sesudah)).toBe(80000);
    for (const m of mutasi) {
      expect(Number(m.saldoSesudah) - Number(m.saldoSebelum)).toBe(Number(m.nominal));
    }
  });
});

describe('DELETE /api/transactions/hold/[id] - guard cabang (T4)', () => {
  async function seedHold(suffix: string) {
    const f = await seed(suffix);
    const hold = await prisma.transaksi.create({
      data: {
        nomor: `HLD-TST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cabangId: f.cabang.id,
        kasirId: f.kasir.id,
        tanggal: new Date(),
        tingkatHarga: 1,
        subtotal: 3500,
        diskon: 0,
        total: 3500,
        metodeBayar: 'TUNAI',
        jumlahBayar: 0,
        kembalian: 0,
        status: 'HOLD',
      },
    });
    return { f, hold };
  }

  it('user tanpa cabang ditolak 403', async () => {
    const { f, hold } = await seedHold(`t4d-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: null });

    const res = await json(await deleteHoldPOST(del(), { params: Promise.resolve({ id: hold.id }) }));
    expect(res.status).toBe(403);
    expect(await prisma.transaksi.count({ where: { id: hold.id } })).toBe(1);
  });

  it('user cabang lain ditolak 403', async () => {
    const { f, hold } = await seedHold(`t4e-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabangLain.id });

    const res = await json(await deleteHoldPOST(del(), { params: Promise.resolve({ id: hold.id }) }));
    expect(res.status).toBe(403);
    expect(await prisma.transaksi.count({ where: { id: hold.id } })).toBe(1);
  });

  it('user satu cabang bisa menghapus HOLD', async () => {
    const { f, hold } = await seedHold(`t4f-${++seq}-${Date.now()}`);
    mockUser({ id: f.kasir.id, role: 'KASIR', cabangId: f.cabang.id });

    const res = await json(await deleteHoldPOST(del(), { params: Promise.resolve({ id: hold.id }) }));
    expect(res.status).toBe(200);
    expect(await prisma.transaksi.count({ where: { id: hold.id } })).toBe(0);
  });
});

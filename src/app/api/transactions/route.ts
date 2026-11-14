import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse, TransaksiWithDetails } from '@/types';
import { MetodeBayar, StatusTransaksi, StatusSync, Role, KategoriPelanggan } from '@/types';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

// Request body type for creating transaction
interface CreateTransactionBody {
  pelangganId?: string | null;
  tingkatHarga: number;
  metodeBayar: MetodeBayar;
  jumlahBayar: number;
  catatan?: string | null;
  diskonTotal: number;
  items: Array<{
    produkId?: string | null;
    produkSatuanId?: string | null;
    namaBarang: string;
    barcode?: string | null;
    jumlah: number;
    satuan: string;
    konversi: number;
    hargaModal: number;
    hargaJual: number;
    diskon: number;
    isQuickSale: boolean;
  }>;
}

function validationError(
  message: string,
  details?: Array<{ field: string; message: string }>
): NextResponse {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details,
    },
  };
  return NextResponse.json(response, { status: 400 });
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    // Autentikasi: identitas kasir & cabang diambil dari session, bukan body
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const sessionUser = authResult.user;

    const cabangId = sessionUser.cabangId;
    const kasirId = sessionUser.id;

    const body: CreateTransactionBody = await request.json();

    // Validate required fields
    if (!cabangId || !body.items?.length) {
      return validationError('Data transaksi tidak lengkap', [
        ...(!cabangId ? [{ field: 'cabangId', message: 'Cabang user tidak ditemukan' }] : []),
        ...(!body.items?.length ? [{ field: 'items', message: 'Minimal 1 item diperlukan' }] : []),
      ]);
    }

    if (body.items.length > 200) {
      return validationError('Terlalu banyak item dalam satu transaksi (maks 200)');
    }

    // Validasi dasar per item & kumpulkan produk yang perlu diverifikasi harganya
    for (const item of body.items) {
      if (!Number.isFinite(item.jumlah) || item.jumlah <= 0) {
        return validationError(`Jumlah untuk "${item.namaBarang}" harus lebih dari 0`);
      }
      if (!item.isQuickSale) {
        if (!item.produkSatuanId) {
          return validationError(`Item "${item.namaBarang}" tidak memiliki satuan`);
        }
        if (!Number.isFinite(item.diskon) || item.diskon < 0) {
          return validationError(`Diskon untuk "${item.namaBarang}" tidak valid`);
        }
      }
    }

    if (!Number.isFinite(body.diskonTotal) || body.diskonTotal < 0) {
      return validationError('Diskon total tidak valid');
    }

    // Ambil harga resmi dari database untuk item non-quick-sale
    const satuanIds = body.items
      .filter((i) => !i.isQuickSale && i.produkSatuanId)
      .map((i) => i.produkSatuanId as string);

    const satuanRecords = satuanIds.length
      ? await prisma.produkSatuan.findMany({
          where: { id: { in: satuanIds } },
          include: { produk: true },
        })
      : [];
    const satuanMap = new Map(satuanRecords.map((s) => [s.id, s]));

    const tingkat = Number(body.tingkatHarga) || 1;
    const hargaField = (tingkat === 2 ? 'harga2' : tingkat === 3 ? 'harga3' : tingkat === 4 ? 'harga4' : 'harga1') as
      'harga1' | 'harga2' | 'harga3' | 'harga4';

    // Susun detail dengan harga dari database
    interface PreparedItem {
      produkId: string | null;
      produkSatuanId: string | null;
      namaBarang: string;
      barcode: string | null;
      jumlah: number;
      satuan: string;
      konversi: number;
      hargaModal: number;
      hargaJual: number;
      diskon: number;
      subtotal: number;
      laba: number;
      isQuickSale: boolean;
      tingkatHarga: number;
      qtyInBaseUnit: number;
    }

    let subtotal = 0;
    const detailItems: PreparedItem[] = [];

    for (const item of body.items) {
      if (item.isQuickSale) {
        // Quick sale: harga & modal dari client tetap dipakai (barang tak terdaftar)
        const hargaJual = Number(item.hargaJual);
        const hargaModal = Number(item.hargaModal) || 0;
        if (!Number.isFinite(hargaJual) || hargaJual < 0) {
          return validationError(`Harga quick sale untuk "${item.namaBarang}" tidak valid`);
        }
        if (!Number.isFinite(item.diskon) || item.diskon < 0 || item.diskon > hargaJual * item.jumlah) {
          return validationError(`Diskon untuk "${item.namaBarang}" tidak valid`);
        }
        const itemSubtotal = hargaJual * item.jumlah - item.diskon;
        subtotal += itemSubtotal;
        detailItems.push({
          produkId: null,
          produkSatuanId: null,
          namaBarang: item.namaBarang,
          barcode: item.barcode || null,
          jumlah: item.jumlah,
          satuan: item.satuan,
          konversi: item.konversi,
          hargaModal,
          hargaJual,
          diskon: item.diskon,
          subtotal: itemSubtotal,
          laba: (hargaJual - hargaModal) * item.jumlah - item.diskon,
          isQuickSale: true,
          tingkatHarga: tingkat,
          qtyInBaseUnit: 0,
        });
        continue;
      }

      const satuan = satuanMap.get(item.produkSatuanId as string);
      if (!satuan) {
        return validationError(`Satuan untuk "${item.namaBarang}" tidak ditemukan`);
      }

      const hargaJual = Number(satuan[hargaField]);
      const hargaModal = Number(satuan.produk.hargaModal);
      const konversi = Number(satuan.konversi) || 1;

      if (item.diskon > hargaJual * item.jumlah) {
        return validationError(`Diskon untuk "${item.namaBarang}" melebihi subtotal item`);
      }

      const itemSubtotal = hargaJual * item.jumlah - item.diskon;
      subtotal += itemSubtotal;
      detailItems.push({
        produkId: satuan.produkId,
        produkSatuanId: satuan.id,
        namaBarang: satuan.produk.nama,
        barcode: satuan.produk.barcode || null,
        jumlah: item.jumlah,
        satuan: satuan.namaSatuan,
        konversi,
        hargaModal,
        hargaJual,
        diskon: item.diskon,
        subtotal: itemSubtotal,
        laba: (hargaJual - hargaModal) * item.jumlah - item.diskon,
        isQuickSale: false,
        tingkatHarga: tingkat,
        qtyInBaseUnit: item.jumlah * konversi,
      });
    }

    const total = subtotal - body.diskonTotal;
    if (total < 0) {
      return validationError('Diskon total melebihi subtotal');
    }

    // Validasi metode pembayaran
    const metodeBayar = body.metodeBayar;
    if (!['TUNAI', 'QRIS', 'TRANSFER', 'HUTANG'].includes(metodeBayar)) {
      return validationError('Metode pembayaran tidak valid');
    }

    const jumlahBayar = Number(body.jumlahBayar);
    if (!Number.isFinite(jumlahBayar) || jumlahBayar < 0) {
      return validationError('Jumlah bayar tidak valid');
    }

    // Tunai harus lunas
    if (metodeBayar === 'TUNAI' && jumlahBayar < total) {
      return validationError('Jumlah bayar kurang dari total untuk pembayaran tunai');
    }

    const kembalian = metodeBayar === 'TUNAI' ? jumlahBayar - total : 0;

    // HUTANG wajib pelanggan
    if (metodeBayar === 'HUTANG' && !body.pelangganId) {
      return validationError('Pembayaran HUTANG wajib memilih pelanggan');
    }

    // Buat transaksi atomik
    const result = await prisma.$transaction(async (tx) => {
      // Cek limit hutang pelanggan (di dalam transaction)
      if (metodeBayar === 'HUTANG' && body.pelangganId) {
        const pelanggan = await tx.pelanggan.findUnique({
          where: { id: body.pelangganId },
        });
        if (!pelanggan || !pelanggan.isActive) {
          throw new Error('PELANGGAN_TIDAK_VALID');
        }
        const hutangAktif = await tx.hutang.aggregate({
          where: { pelangganId: body.pelangganId, status: 'BELUM_LUNAS' },
          _sum: { sisa: true },
        });
        const totalHutang = Number(hutangAktif._sum.sisa || 0) + total;
        if (Number(pelanggan.maxHutang) > 0 && totalHutang > Number(pelanggan.maxHutang)) {
          throw new Error('LIMIT_HUTANG_TERLAMPAUI');
        }
      }

      // Cek & kurangi stok secara atomik (tahan race condition antar kasir)
      for (const item of detailItems) {
        if (item.isQuickSale || !item.produkId) continue;

        const updated = await tx.stok.updateMany({
          where: {
            produkId: item.produkId,
            cabangId,
            jumlah: { gte: item.qtyInBaseUnit },
          },
          data: {
            jumlah: { decrement: item.qtyInBaseUnit },
          },
        });

        if (updated.count === 0) {
          throw new Error(`STOK_TIDAK_CUKUP:${item.namaBarang}`);
        }
      }

      // Generate nomor di dalam transaction
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const count = await tx.transaksi.count({
        where: { cabangId, tanggal: { gte: startOfDay, lt: endOfDay } },
      });
      const nomor = `TRX-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      // Create main transaction
      const transaksi = await tx.transaksi.create({
        data: {
          nomor,
          cabangId,
          kasirId,
          pelangganId: body.pelangganId || null,
          tanggal: new Date(),
          tingkatHarga: tingkat,
          subtotal,
          diskon: body.diskonTotal,
          total,
          metodeBayar,
          jumlahBayar,
          kembalian,
          catatan: body.catatan || null,
          status: 'SELESAI' as StatusTransaksi,
          statusSync: 'SYNCED',
          detailTransaksi: {
            create: detailItems.map(({ qtyInBaseUnit: _q, ...rest }) => rest),
          },
        },
        include: {
          cabang: true,
          kasir: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true,
              cabangId: true,
              isActive: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          pelanggan: true,
          detailTransaksi: true,
        },
      });

      // Catat mutasi stok (jumlahSebelum/Sesudah dibaca ulang di dalam tx)
      for (const item of detailItems) {
        if (item.isQuickSale || !item.produkId) continue;

        const currentStock = await tx.stok.findFirst({
          where: { produkId: item.produkId, cabangId },
        });

        if (currentStock) {
          await tx.stokMutasi.create({
            data: {
              produkId: item.produkId,
              cabangId,
              jumlah: -item.qtyInBaseUnit,
              jumlahSebelum: Number(currentStock.jumlah) + item.qtyInBaseUnit,
              jumlahSesudah: Number(currentStock.jumlah),
              tipe: 'KELUAR',
              referensiTipe: 'TRANSAKSI',
              referensiId: transaksi.id,
              keterangan: `Penjualan ${nomor}`,
              userId: kasirId,
            },
          });
        }
      }

      // Kas masuk untuk pembayaran tunai
      if (metodeBayar === 'TUNAI') {
        const kas = await tx.kas.findUnique({
          where: { cabangId },
        });

        if (kas) {
          const newSaldo = Number(kas.saldo) + total;

          await tx.kas.update({
            where: { cabangId },
            data: { saldo: newSaldo },
          });

          await tx.kasMutasi.create({
            data: {
              cabangId,
              jenis: 'MASUK',
              kategori: 'PENJUALAN',
              nominal: total,
              saldoSebelum: Number(kas.saldo),
              saldoSesudah: newSaldo,
              keterangan: `Penjualan ${nomor}`,
              referensiTipe: 'TRANSAKSI',
              referensiId: transaksi.id,
              userId: kasirId,
            },
          });
        }
      }

      // Catat hutang
      if (metodeBayar === 'HUTANG' && body.pelangganId) {
        await tx.hutang.create({
          data: {
            transaksiId: transaksi.id,
            pelangganId: body.pelangganId,
            jumlah: total,
            sisa: total,
            status: 'BELUM_LUNAS',
          },
        });
      }

      return transaksi;
    });

    // Transform response
    const transformedResult: TransaksiWithDetails = {
      id: result.id,
      nomor: result.nomor,
      cabangId: result.cabangId,
      kasirId: result.kasirId,
      pelangganId: result.pelangganId,
      tanggal: result.tanggal,
      tingkatHarga: result.tingkatHarga,
      subtotal: Number(result.subtotal),
      diskon: Number(result.diskon),
      total: Number(result.total),
      metodeBayar: result.metodeBayar as MetodeBayar,
      jumlahBayar: Number(result.jumlahBayar),
      kembalian: Number(result.kembalian),
      catatan: result.catatan,
      status: result.status as StatusTransaksi,
      statusSync: result.statusSync as StatusSync,
      deviceId: result.deviceId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      cabang: result.cabang ? {
        id: result.cabang.id,
        kode: result.cabang.kode,
        nama: result.cabang.nama,
        alamat: result.cabang.alamat,
        telepon: result.cabang.telepon,
        isActive: result.cabang.isActive,
        createdAt: result.cabang.createdAt,
        updatedAt: result.cabang.updatedAt,
      } : undefined,
      kasir: {
        id: result.kasir.id,
        nama: result.kasir.nama,
        email: result.kasir.email,
        role: result.kasir.role as Role,
        cabangId: result.kasir.cabangId,
        isActive: result.kasir.isActive,
        lastLogin: result.kasir.lastLogin,
        createdAt: result.kasir.createdAt,
        updatedAt: result.kasir.updatedAt,
      },
      pelanggan: result.pelanggan ? {
        id: result.pelanggan.id,
        nama: result.pelanggan.nama,
        telepon: result.pelanggan.telepon,
        alamat: result.pelanggan.alamat,
        kategori: result.pelanggan.kategori as KategoriPelanggan,
        maxHutang: Number(result.pelanggan.maxHutang),
        totalBelanja: Number(result.pelanggan.totalBelanja),
        catatan: result.pelanggan.catatan,
        isActive: result.pelanggan.isActive,
        createdAt: result.pelanggan.createdAt,
        updatedAt: result.pelanggan.updatedAt,
      } : null,
      detailTransaksi: result.detailTransaksi.map((d) => ({
        id: d.id,
        transaksiId: d.transaksiId,
        produkId: d.produkId,
        produkSatuanId: d.produkSatuanId,
        namaBarang: d.namaBarang,
        barcode: d.barcode,
        jumlah: Number(d.jumlah),
        satuan: d.satuan,
        konversi: Number(d.konversi),
        hargaModal: Number(d.hargaModal),
        hargaJual: Number(d.hargaJual),
        tingkatHarga: d.tingkatHarga,
        diskon: Number(d.diskon),
        subtotal: Number(d.subtotal),
        laba: Number(d.laba),
        isQuickSale: d.isQuickSale,
        createdAt: d.createdAt,
      })),
    };

    const response: ApiResponse<TransaksiWithDetails> = {
      success: true,
      data: transformedResult,
      message: 'Transaksi berhasil disimpan',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('STOK_TIDAK_CUKUP:')) {
        const nama = error.message.split(':')[1];
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'STOCK_INSUFFICIENT', message: `Stok tidak cukup untuk "${nama}"` },
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (error.message === 'LIMIT_HUTANG_TERLAMPAUI') {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'DEBT_LIMIT_EXCEEDED', message: 'Limit hutang pelanggan terlampaui' },
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (error.message === 'PELANGGAN_TIDAK_VALID') {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Pelanggan tidak ditemukan atau tidak aktif' },
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    console.error('Error creating transaction:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menyimpan transaksi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/transactions - List transactions (for history)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);

    const cabangId = searchParams.get('cabangId');
    const kasirId = searchParams.get('kasirId');
    const tanggalMulai = searchParams.get('tanggalMulai');
    const tanggalAkhir = searchParams.get('tanggalAkhir');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Build where clause
    const where: Record<string, unknown> = {};

    // Scope ke cabang user untuk keamanan
    where.cabangId = authResult.user.cabangId ?? cabangId;
    if (kasirId) where.kasirId = kasirId;
    if (status) where.status = status;

    if (tanggalMulai || tanggalAkhir) {
      where.tanggal = {};
      if (tanggalMulai) {
        (where.tanggal as Record<string, unknown>).gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        (where.tanggal as Record<string, unknown>).lte = new Date(tanggalAkhir);
      }
    }

    const total = await prisma.transaksi.count({ where });

    const transactions = await prisma.transaksi.findMany({
      where,
      include: {
        cabang: true,
        kasir: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            cabangId: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pelanggan: true,
        detailTransaksi: true,
      },
      orderBy: { tanggal: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: ApiResponse<typeof transactions> = {
      success: true,
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data transaksi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

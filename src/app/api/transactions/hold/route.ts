import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withTransactionRetry } from '@/lib/db/retry';
import type { ApiResponse, TransaksiWithDetails } from '@/types';
import { MetodeBayar, StatusSync } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { logActivity } from '@/lib/audit-log';
import { parseBody } from '@/lib/validation/parse';
import { holdTransactionSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// POST /api/transactions/hold - Hold (simpan sementara) transaksi
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const user = authResult.user;

  try {
    const rawBody: unknown = await request.json();
    const parsed = parseBody(holdTransactionSchema, rawBody);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    if (!user.cabangId || !user.id) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data transaksi hold tidak lengkap',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
    const cabangId = user.cabangId;
    const kasirId = user.id;

    // Calculate totals
    let subtotal = 0;
    const detailItems = body.items.map((item) => {
      const itemSubtotal = item.jumlah * item.hargaJual - item.diskon;
      subtotal += itemSubtotal;

      return {
        produkId: item.produkId || null,
        produkSatuanId: item.produkSatuanId || null,
        namaBarang: item.namaBarang,
        barcode: item.barcode || null,
        jumlah: item.jumlah,
        satuan: item.satuan,
        konversi: item.konversi,
        hargaModal: item.hargaModal,
        hargaJual: item.hargaJual,
        tingkatHarga: body.tingkatHarga,
        diskon: item.diskon,
        subtotal: itemSubtotal,
        // Quick sale: modal dari client per satuan jual (UI kirim 0).
        // Barang terdaftar: modal per satuan dasar, kalikan konversi.
        laba:
          (item.hargaJual - item.hargaModal * (item.isQuickSale ? 1 : item.konversi)) *
            item.jumlah -
          item.diskon,
        isQuickSale: item.isQuickSale,
      };
    });

    const total = subtotal - body.diskonTotal;

    // Create held transaction (status HOLD)
    // Stok TIDAK dikurangi, kas TIDAK diubah
    // (retry P2002: nomor HLD bisa bentrok bila dua kasir hold bersamaan)
    const result = await withTransactionRetry(async (tx) => {
      // Generate hold number: HLD-YYYYMMDD-XXXX
      // PENTING: dateStr & rentang hari HARUS memakai basis waktu yang sama (lokal).
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;
      const startOfDay = new Date(yyyy, today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Ambil nomor HLD terakhir hari ini (bukan count) agar tidak tabrakan
      const lastToday = await tx.transaksi.findFirst({
        where: { cabangId, nomor: { startsWith: `HLD-${dateStr}-` } },
        orderBy: { nomor: 'desc' },
        select: { nomor: true },
      });
      const lastSeq = lastToday ? parseInt(lastToday.nomor.split('-').pop() || '0', 10) : 0;

      const nomor = `HLD-${dateStr}-${String((Number.isNaN(lastSeq) ? 0 : lastSeq) + 1).padStart(4, '0')}`;

      return tx.transaksi.create({
        data: {
          nomor,
          cabangId,
          kasirId,
          tanggal: new Date(),
          tingkatHarga: body.tingkatHarga,
          subtotal,
          diskon: body.diskonTotal,
          total,
          metodeBayar: 'TUNAI',
          jumlahBayar: 0,
          kembalian: 0,
          catatan: body.catatan || null,
          status: 'HOLD',
          statusSync: 'SYNCED',
          detailTransaksi: {
            create: detailItems,
          },
        },
        include: {
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
          detailTransaksi: true,
        },
      });
    });

    await logActivity({
      userId: authResult.user.id,
      aksi: 'TRANSAKSI_HOLD',
      tabel: 'transaksi',
      recordId: result.id,
      dataBaru: { nomor: result.nomor },
      request,
    });

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
      status: result.status as never,
      statusSync: result.statusSync as StatusSync,
      deviceId: result.deviceId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      kasir: result.kasir as never,
      detailTransaksi: result.detailTransaksi.map((d) => ({
        ...d,
        jumlah: Number(d.jumlah),
        konversi: Number(d.konversi),
        hargaModal: Number(d.hargaModal),
        hargaJual: Number(d.hargaJual),
        diskon: Number(d.diskon),
        subtotal: Number(d.subtotal),
        laba: Number(d.laba),
      })),
    };

    const response: ApiResponse<TransaksiWithDetails> = {
      success: true,
      data: transformedResult,
      message: 'Transaksi berhasil ditahan',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error holding transaction:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menahan transaksi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/transactions/hold?cabangId=xxx - List held transactions
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const user = authResult.user;

  try {
    const cabangId = user.cabangId;

    if (!cabangId) {
      const response: ApiResponse<never[]> = {
        success: true,
        data: [],
      };
      return NextResponse.json(response);
    }

    const transactions = await prisma.transaksi.findMany({
      where: {
        cabangId,
        status: 'HOLD',
      },
      include: {
        detailTransaksi: true,
      },
      orderBy: { tanggal: 'desc' },
    });

    const transformed = transactions.map((t) => ({
      id: t.id,
      nomor: t.nomor,
      cabangId: t.cabangId,
      kasirId: t.kasirId,
      pelangganId: t.pelangganId,
      tanggal: t.tanggal,
      tingkatHarga: t.tingkatHarga,
      subtotal: Number(t.subtotal),
      diskon: Number(t.diskon),
      total: Number(t.total),
      metodeBayar: t.metodeBayar,
      jumlahBayar: Number(t.jumlahBayar),
      kembalian: Number(t.kembalian),
      catatan: t.catatan,
      status: t.status,
      statusSync: t.statusSync,
      deviceId: t.deviceId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      detailTransaksi: t.detailTransaksi.map((d) => ({
        ...d,
        jumlah: Number(d.jumlah),
        konversi: Number(d.konversi),
        hargaModal: Number(d.hargaModal),
        hargaJual: Number(d.hargaJual),
        diskon: Number(d.diskon),
        subtotal: Number(d.subtotal),
        laba: Number(d.laba),
      })),
    }));

    const response: ApiResponse<typeof transformed> = {
      success: true,
      data: transformed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching held transactions:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memuat transaksi tertahan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

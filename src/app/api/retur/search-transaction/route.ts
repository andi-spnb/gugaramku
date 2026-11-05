import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/retur/search-transaction - Search transaction for retur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';

    if (!search) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Search by transaction number or date
    const transactions = await prisma.transaksi.findMany({
      where: {
        cabangId,
        status: 'SELESAI',
        OR: [
          { nomor: { contains: search } },
        ],
      },
      include: {
        pelanggan: {
          select: {
            id: true,
            nama: true,
          },
        },
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
        detailTransaksi: {
          include: {
            produk: {
              select: {
                id: true,
                nama: true,
                barcode: true,
              },
            },
          },
        },
        retur: {
          include: {
            detail: true,
          },
        },
      },
      orderBy: { tanggal: 'desc' },
      take: 10,
    });

    // Transform and calculate returnable quantities
    const data = transactions.map((t) => {
      // Calculate already returned quantities per detail
      const returnedQty: Record<string, number> = {};
      t.retur.forEach((r) => {
        r.detail.forEach((d) => {
          returnedQty[d.detailTransaksiId] = (returnedQty[d.detailTransaksiId] || 0) + d.jumlah;
        });
      });

      return {
        id: t.id,
        nomor: t.nomor,
        tanggal: t.tanggal.toISOString(),
        pelanggan: t.pelanggan?.nama || 'Umum',
        kasir: t.kasir.nama,
        total: t.total,
        metodeBayar: t.metodeBayar,
        items: t.detailTransaksi.map((d) => {
          const alreadyReturned = returnedQty[d.id] || 0;
          const returnable = d.jumlah - alreadyReturned;
          return {
            id: d.id,
            produkId: d.produkId,
            namaBarang: d.namaBarang,
            barcode: d.barcode,
            jumlah: d.jumlah,
            satuan: d.satuan,
            hargaJual: d.hargaJual,
            diskon: d.diskon,
            subtotal: d.subtotal,
            alreadyReturned,
            returnable,
          };
        }),
        hasReturnableItems: t.detailTransaksi.some((d) => {
          const alreadyReturned = returnedQty[d.id] || 0;
          return d.jumlah - alreadyReturned > 0;
        }),
      };
    });

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error searching transaction:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mencari transaksi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

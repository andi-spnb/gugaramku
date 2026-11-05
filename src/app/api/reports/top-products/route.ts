import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/reports/top-products - Get top selling products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';
    const periode = searchParams.get('periode') || 'bulanan';
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determine date range
    let dateStart: Date;
    let dateEnd: Date = new Date();
    dateEnd.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      dateStart = new Date();
      switch (periode) {
        case 'harian':
          dateStart.setHours(0, 0, 0, 0);
          break;
        case 'mingguan':
          dateStart.setDate(dateStart.getDate() - 7);
          break;
        case 'tahunan':
          dateStart.setFullYear(dateStart.getFullYear() - 1);
          break;
        default: // bulanan
          dateStart.setMonth(dateStart.getMonth() - 1);
      }
    }

    // Get all transaction details in date range
    const details = await prisma.detailTransaksi.findMany({
      where: {
        transaksi: {
          cabangId,
          status: 'SELESAI',
          tanggal: {
            gte: dateStart,
            lte: dateEnd,
          },
        },
        produkId: { not: null },
      },
      include: {
        produk: {
          include: {
            kategori: true,
          },
        },
      },
    });

    // Aggregate by product
    const productMap: Record<string, {
      produkId: string;
      nama: string;
      barcode: string | null;
      kategori: string | null;
      totalTerjual: number;
      totalPendapatan: number;
      totalLaba: number;
      transaksiCount: number;
    }> = {};

    details.forEach((d) => {
      if (!d.produkId || !d.produk) return;

      if (!productMap[d.produkId]) {
        productMap[d.produkId] = {
          produkId: d.produkId,
          nama: d.produk.nama,
          barcode: d.produk.barcode,
          kategori: d.produk.kategori?.nama || null,
          totalTerjual: 0,
          totalPendapatan: 0,
          totalLaba: 0,
          transaksiCount: 0,
        };
      }

      // Convert to base unit
      const qtyInBaseUnit = d.jumlah * d.konversi;
      productMap[d.produkId].totalTerjual += qtyInBaseUnit;
      productMap[d.produkId].totalPendapatan += d.subtotal;
      productMap[d.produkId].totalLaba += d.laba;
      productMap[d.produkId].transaksiCount++;
    });

    // Sort by total sold and take top N
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalTerjual - a.totalTerjual)
      .slice(0, limit);

    // Also get slow-moving products (bottom N)
    const slowProducts = Object.values(productMap)
      .sort((a, b) => a.totalTerjual - b.totalTerjual)
      .slice(0, limit);

    // Get products that never sold in the period
    const soldProductIds = Object.keys(productMap);
    const neverSold = await prisma.produk.findMany({
      where: {
        isActive: true,
        id: { notIn: soldProductIds },
      },
      include: {
        kategori: true,
        stok: {
          where: { cabangId },
        },
      },
      take: limit,
    });

    const neverSoldList = neverSold.map((p) => ({
      produkId: p.id,
      nama: p.nama,
      barcode: p.barcode,
      kategori: p.kategori?.nama || null,
      stok: p.stok[0]?.jumlah || 0,
    }));

    const data = {
      periode: {
        start: dateStart.toISOString(),
        end: dateEnd.toISOString(),
        type: periode,
      },
      topProducts,
      slowProducts,
      neverSold: neverSoldList,
      totalProducts: Object.keys(productMap).length,
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching top products:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data produk terlaris',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

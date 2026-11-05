import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/reports/dashboard - Get dashboard summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's transactions
    const todayTransactions = await prisma.transaksi.findMany({
      where: {
        cabangId,
        status: 'SELESAI',
        tanggal: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        detailTransaksi: true,
      },
    });

    // Yesterday's transactions for comparison
    const yesterdayTransactions = await prisma.transaksi.findMany({
      where: {
        cabangId,
        status: 'SELESAI',
        tanggal: {
          gte: yesterday,
          lt: today,
        },
      },
      include: {
        detailTransaksi: true,
      },
    });

    // Calculate today's stats
    const todayStats = {
      totalPenjualan: todayTransactions.reduce((sum, t) => sum + t.total, 0),
      totalTransaksi: todayTransactions.length,
      totalLaba: todayTransactions.reduce(
        (sum, t) => sum + t.detailTransaksi.reduce((s, d) => s + d.laba, 0),
        0
      ),
      totalItem: todayTransactions.reduce(
        (sum, t) => sum + t.detailTransaksi.reduce((s, d) => s + d.jumlah, 0),
        0
      ),
    };

    // Calculate yesterday's stats for comparison
    const yesterdayStats = {
      totalPenjualan: yesterdayTransactions.reduce((sum, t) => sum + t.total, 0),
      totalTransaksi: yesterdayTransactions.length,
      totalLaba: yesterdayTransactions.reduce(
        (sum, t) => sum + t.detailTransaksi.reduce((s, d) => s + d.laba, 0),
        0
      ),
    };

    // Calculate percentage changes
    const changes = {
      penjualan: yesterdayStats.totalPenjualan > 0
        ? ((todayStats.totalPenjualan - yesterdayStats.totalPenjualan) / yesterdayStats.totalPenjualan) * 100
        : todayStats.totalPenjualan > 0 ? 100 : 0,
      transaksi: yesterdayStats.totalTransaksi > 0
        ? ((todayStats.totalTransaksi - yesterdayStats.totalTransaksi) / yesterdayStats.totalTransaksi) * 100
        : todayStats.totalTransaksi > 0 ? 100 : 0,
      laba: yesterdayStats.totalLaba > 0
        ? ((todayStats.totalLaba - yesterdayStats.totalLaba) / yesterdayStats.totalLaba) * 100
        : todayStats.totalLaba > 0 ? 100 : 0,
    };

    // Get low stock count
    const products = await prisma.produk.findMany({
      where: { isActive: true },
      include: {
        stok: {
          where: { cabangId },
        },
      },
    });

    let lowStockCount = 0;
    let emptyStockCount = 0;
    products.forEach((p) => {
      const stok = p.stok[0];
      const jumlah = stok?.jumlah || 0;
      const minimum = stok?.stokMinimum || 0;
      if (jumlah <= 0) {
        emptyStockCount++;
      } else if (jumlah <= minimum) {
        lowStockCount++;
      }
    });

    // Get pending debts
    const pendingDebts = await prisma.hutang.aggregate({
      where: {
        status: 'BELUM_LUNAS',
        pelanggan: {
          isActive: true,
        },
      },
      _sum: {
        sisa: true,
      },
      _count: true,
    });

    // Get kas balance
    let kas = await prisma.kas.findUnique({
      where: { cabangId },
    });
    if (!kas) {
      kas = await prisma.kas.create({
        data: { cabangId, saldo: 0 },
      });
    }

    const data = {
      today: todayStats,
      changes,
      alerts: {
        lowStock: lowStockCount,
        emptyStock: emptyStockCount,
        pendingDebts: pendingDebts._count,
        totalDebt: pendingDebts._sum.sisa || 0,
      },
      kas: {
        saldo: kas.saldo,
      },
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data dashboard',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

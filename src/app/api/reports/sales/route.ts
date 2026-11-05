import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/reports/sales - Get sales report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';
    const periode = searchParams.get('periode') || 'harian'; // harian, mingguan, bulanan, tahunan
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determine date range based on periode
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
        case 'mingguan':
          dateStart.setDate(dateStart.getDate() - 7);
          break;
        case 'bulanan':
          dateStart.setMonth(dateStart.getMonth() - 1);
          break;
        case 'tahunan':
          dateStart.setFullYear(dateStart.getFullYear() - 1);
          break;
        default: // harian
          dateStart.setHours(0, 0, 0, 0);
      }
    }

    // Get transactions in date range
    const transactions = await prisma.transaksi.findMany({
      where: {
        cabangId,
        status: 'SELESAI',
        tanggal: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      include: {
        detailTransaksi: true,
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
      },
      orderBy: { tanggal: 'desc' },
    });

    // Calculate summary
    const summary = {
      totalPenjualan: transactions.reduce((sum, t) => sum + t.total, 0),
      totalTransaksi: transactions.length,
      totalLaba: transactions.reduce(
        (sum, t) => sum + t.detailTransaksi.reduce((s, d) => s + d.laba, 0),
        0
      ),
      totalItem: transactions.reduce(
        (sum, t) => sum + t.detailTransaksi.reduce((s, d) => s + d.jumlah, 0),
        0
      ),
      totalDiskon: transactions.reduce((sum, t) => sum + t.diskon, 0),
      rataRataPerTransaksi: transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length
        : 0,
    };

    // Group by payment method
    const byPaymentMethod: Record<string, { count: number; total: number }> = {};
    transactions.forEach((t) => {
      if (!byPaymentMethod[t.metodeBayar]) {
        byPaymentMethod[t.metodeBayar] = { count: 0, total: 0 };
      }
      byPaymentMethod[t.metodeBayar].count++;
      byPaymentMethod[t.metodeBayar].total += t.total;
    });

    // Group by date for chart
    const byDate: Record<string, { date: string; penjualan: number; laba: number; transaksi: number }> = {};
    transactions.forEach((t) => {
      const dateKey = t.tanggal.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, penjualan: 0, laba: 0, transaksi: 0 };
      }
      byDate[dateKey].penjualan += t.total;
      byDate[dateKey].laba += t.detailTransaksi.reduce((s, d) => s + d.laba, 0);
      byDate[dateKey].transaksi++;
    });

    // Convert to array and sort by date
    const chartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

    // Transform transactions for response
    const transactionList = transactions.map((t) => ({
      id: t.id,
      nomor: t.nomor,
      tanggal: t.tanggal.toISOString(),
      pelanggan: t.pelanggan?.nama || 'Umum',
      kasir: t.kasir.nama,
      metodeBayar: t.metodeBayar,
      subtotal: t.subtotal,
      diskon: t.diskon,
      total: t.total,
      laba: t.detailTransaksi.reduce((s, d) => s + d.laba, 0),
      itemCount: t.detailTransaksi.length,
    }));

    const data = {
      periode: {
        start: dateStart.toISOString(),
        end: dateEnd.toISOString(),
        type: periode,
      },
      summary,
      byPaymentMethod: Object.entries(byPaymentMethod).map(([method, data]) => ({
        method,
        ...data,
      })),
      chartData,
      transactions: transactionList,
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales report:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil laporan penjualan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

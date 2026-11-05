import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/stock/mutations - Get stock mutation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const produkId = searchParams.get('produkId');
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';
    const tipe = searchParams.get('tipe');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {
      cabangId,
    };

    if (produkId) {
      where.produkId = produkId;
    }

    if (tipe) {
      where.tipe = tipe;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59');
      }
    }

    const total = await prisma.stokMutasi.count({ where });

    const mutations = await prisma.stokMutasi.findMany({
      where,
      include: {
        produk: {
          select: {
            id: true,
            nama: true,
            barcode: true,
            satuanDasar: true,
          },
        },
        user: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const transformedMutations = mutations.map((m) => ({
      id: m.id,
      produkId: m.produkId,
      namaProduk: m.produk.nama,
      barcode: m.produk.barcode,
      satuanDasar: m.produk.satuanDasar,
      cabangId: m.cabangId,
      jumlah: m.jumlah,
      jumlahSebelum: m.jumlahSebelum,
      jumlahSesudah: m.jumlahSesudah,
      tipe: m.tipe,
      referensiTipe: m.referensiTipe,
      referensiId: m.referensiId,
      keterangan: m.keterangan,
      userId: m.userId,
      namaUser: m.user.nama,
      createdAt: m.createdAt,
    }));

    const response: ApiResponse<typeof transformedMutations> = {
      success: true,
      data: transformedMutations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching mutations:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil riwayat mutasi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

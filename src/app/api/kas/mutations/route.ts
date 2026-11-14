import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/kas/mutations - Get kas mutations list
export async function GET(request: NextRequest) {
    const authResult = await requireAuth(['OWNER', 'ADMIN_CABANG']);
    if (!authResult.ok) return authResult.response;
    const user = authResult.user;

    if (!user.cabangId) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cabang tidak ditemukan pada user',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  try {
    const { searchParams } = new URL(request.url);

    const cabangId = user.cabangId;
    const jenis = searchParams.get('jenis'); // MASUK, KELUAR
    const kategori = searchParams.get('kategori');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {
      cabangId,
    };

    if (jenis) {
      where.jenis = jenis;
    }

    if (kategori) {
      where.kategori = kategori;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    // Get total count
    const total = await prisma.kasMutasi.count({ where });

    // Get mutations with user info
    const mutations = await prisma.kasMutasi.findMany({
      where,
      include: {
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

    // Transform data
    const data = mutations.map((m) => ({
      id: m.id,
      cabangId: m.cabangId,
      jenis: m.jenis,
      kategori: m.kategori,
      nominal: m.nominal,
      saldoSebelum: m.saldoSebelum,
      saldoSesudah: m.saldoSesudah,
      keterangan: m.keterangan,
      referensiTipe: m.referensiTipe,
      referensiId: m.referensiId,
      userId: m.userId,
      namaUser: m.user.nama,
      createdAt: m.createdAt.toISOString(),
    }));

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching kas mutations:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data mutasi kas',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

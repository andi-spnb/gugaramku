import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/debts - List debts
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    const { searchParams } = new URL(request.url);
    
    const pelangganId = searchParams.get('pelangganId');
    const status = searchParams.get('status'); // BELUM_LUNAS, LUNAS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    // Scope ke cabang user (cegah IDOR lintas cabang)
    if (!authResult.user.cabangId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NO_CABANG', message: 'Akun Anda tidak terhubung ke cabang mana pun.' },
      };
      return NextResponse.json(response, { status: 400 });
    }
    where.transaksi = { cabangId: authResult.user.cabangId };

    if (pelangganId) {
      where.pelangganId = pelangganId;
    }

    if (status) {
      where.status = status;
    }

    const total = await prisma.hutang.count({ where });

    const debts = await prisma.hutang.findMany({
      where,
      include: {
        pelanggan: {
          select: {
            id: true,
            nama: true,
            telepon: true,
          },
        },
        transaksi: {
          select: {
            id: true,
            nomor: true,
            tanggal: true,
            total: true,
          },
        },
        pembayaran: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: ApiResponse<typeof debts> = {
      success: true,
      data: debts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching debts:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data hutang',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

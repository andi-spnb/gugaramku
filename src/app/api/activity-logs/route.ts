import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/activity-logs - Log aktivitas (audit trail, hanya OWNER)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['OWNER']);
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const aksi = searchParams.get('aksi') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = {};
    if (aksi) where.aksi = aksi;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) {
        // Sertakan seluruh hari endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    const total = await prisma.logAktivitas.count({ where });

    const logs = await prisma.logAktivitas.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: ApiResponse<typeof logs> = {
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching activity logs:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil log aktivitas',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

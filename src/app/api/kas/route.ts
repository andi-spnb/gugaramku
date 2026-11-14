import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/kas - Get kas balance for a branch
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
    const cabangId = user.cabangId;

    // Get or create kas for branch
    let kas = await prisma.kas.findUnique({
      where: { cabangId },
    });

    if (!kas) {
      // Create kas with 0 balance if not exists
      kas = await prisma.kas.create({
        data: {
          cabangId,
          saldo: 0,
        },
      });
    }

    const response: ApiResponse<typeof kas> = {
      success: true,
      data: kas,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching kas:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data kas',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

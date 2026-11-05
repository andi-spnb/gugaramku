import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/kas - Get kas balance for a branch
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';

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

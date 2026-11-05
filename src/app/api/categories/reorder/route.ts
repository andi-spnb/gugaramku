import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// PUT /api/categories/reorder - Reorder categories
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.orders)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data urutan tidak valid',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Update each category's order
    await prisma.$transaction(
      body.orders.map((item: { id: string; urutan: number }) =>
        prisma.kategori.update({
          where: { id: item.id },
          data: { urutan: item.urutan },
        })
      )
    );

    const response: ApiResponse<null> = {
      success: true,
      message: 'Urutan kategori berhasil diperbarui',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reordering categories:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memperbarui urutan kategori',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

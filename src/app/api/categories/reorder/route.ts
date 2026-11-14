import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { parseBody } from '@/lib/validation/parse';
import { reorderCategoriesSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// PUT /api/categories/reorder - Reorder categories
export async function PUT(request: NextRequest) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    const body = await request.json();

    const parsed = parseBody(reorderCategoriesSchema, body);
    if (!parsed.ok) return parsed.response;

    // Update each category's order
    await prisma.$transaction(
      parsed.data.orders.map((item) =>
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

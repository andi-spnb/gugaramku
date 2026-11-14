import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse, Kategori } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { parseBody } from '@/lib/validation/parse';
import { updateCategorySchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    const category = await prisma.kategori.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Kategori tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Kategori> = {
      success: true,
      data: {
        id: category.id,
        nama: category.nama,
        deskripsi: category.deskripsi,
        urutan: category.urutan,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching category:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data kategori',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    const body = await request.json();

    const parsed = parseBody(updateCategorySchema, body);
    if (!parsed.ok) return parsed.response;

    // Check if category exists
    const existing = await prisma.kategori.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Kategori tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check name uniqueness (exclude current)
    if (parsed.data.nama && parsed.data.nama !== existing.nama) {
      const nameExists = await prisma.kategori.findFirst({
        where: {
          nama: parsed.data.nama,
          id: { not: params.id },
        },
      });

      if (nameExists) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'Nama kategori sudah digunakan',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const category = await prisma.kategori.update({
      where: { id: params.id },
      data: {
        nama: parsed.data.nama?.trim() ?? existing.nama,
        deskripsi: parsed.data.deskripsi?.trim() || null,
        urutan: parsed.data.urutan ?? existing.urutan,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    const response: ApiResponse<Kategori> = {
      success: true,
      data: {
        id: category.id,
        nama: category.nama,
        deskripsi: category.deskripsi,
        urutan: category.urutan,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      message: 'Kategori berhasil diperbarui',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memperbarui kategori',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    // Check if category exists
    const existing = await prisma.kategori.findUnique({
      where: { id: params.id },
      include: {
        produk: { take: 1 },
      },
    });

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Kategori tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if category has products
    if (existing.produk.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'HAS_PRODUCTS',
          message: 'Kategori tidak dapat dihapus karena masih memiliki produk',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    await prisma.kategori.delete({
      where: { id: params.id },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Kategori berhasil dihapus',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting category:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menghapus kategori',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

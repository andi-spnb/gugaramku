import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse, Kategori } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  try {
    const body = await request.json();

    if (!body.nama?.trim()) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nama kategori harus diisi',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

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
    if (body.nama !== existing.nama) {
      const nameExists = await prisma.kategori.findFirst({
        where: {
          nama: body.nama,
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
        nama: body.nama.trim(),
        deskripsi: body.deskripsi?.trim() || null,
        urutan: body.urutan ?? existing.urutan,
        isActive: body.isActive ?? existing.isActive,
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

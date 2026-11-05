import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse, Kategori } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.kategori.findMany({
      where: { isActive: true },
      orderBy: { urutan: 'asc' },
    });

    const transformedCategories: Kategori[] = categories.map((c) => ({
      id: c.id,
      nama: c.nama,
      deskripsi: c.deskripsi,
      urutan: c.urutan,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    const response: ApiResponse<Kategori[]> = {
      success: true,
      data: transformedCategories,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
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

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nama) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nama kategori harus diisi',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check name uniqueness
    const exists = await prisma.kategori.findUnique({
      where: { nama: body.nama },
    });

    if (exists) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: 'Nama kategori sudah digunakan',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get max urutan
    const maxUrutan = await prisma.kategori.aggregate({
      _max: { urutan: true },
    });

    const category = await prisma.kategori.create({
      data: {
        nama: body.nama,
        deskripsi: body.deskripsi || null,
        urutan: (maxUrutan._max.urutan || 0) + 1,
        isActive: true,
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
      message: 'Kategori berhasil ditambahkan',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menambahkan kategori',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

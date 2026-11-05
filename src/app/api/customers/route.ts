import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const kategori = searchParams.get('kategori');
    const isActive = searchParams.get('isActive') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { telepon: { contains: search } },
      ];
    }

    if (kategori) {
      where.kategori = kategori;
    }

    const total = await prisma.pelanggan.count({ where });

    const customers = await prisma.pelanggan.findMany({
      where,
      orderBy: { nama: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: ApiResponse<typeof customers> = {
      success: true,
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data pelanggan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nama?.trim()) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nama pelanggan harus diisi',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const customer = await prisma.pelanggan.create({
      data: {
        nama: body.nama.trim(),
        telepon: body.telepon?.trim() || null,
        alamat: body.alamat?.trim() || null,
        kategori: body.kategori || 'RETAIL',
        maxHutang: body.maxHutang || 0,
        catatan: body.catatan?.trim() || null,
        isActive: true,
      },
    });

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
      message: 'Pelanggan berhasil ditambahkan',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menambahkan pelanggan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

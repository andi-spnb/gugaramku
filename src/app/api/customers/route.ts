import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { parseBody } from '@/lib/validation/parse';
import { createCustomerSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
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
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    const body = await request.json();

    const parsed = parseBody(createCustomerSchema, body);
    if (!parsed.ok) return parsed.response;

    const customer = await prisma.pelanggan.create({
      data: {
        nama: parsed.data.nama.trim(),
        telepon: parsed.data.telepon?.trim() || null,
        alamat: parsed.data.alamat?.trim() || null,
        kategori: parsed.data.kategori || 'RETAIL',
        maxHutang: parsed.data.maxHutang || 0,
        catatan: parsed.data.catatan?.trim() || null,
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

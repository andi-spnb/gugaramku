import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/branches - Get branches list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { kode: { contains: search } },
        { alamat: { contains: search } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Get total count
    const total = await prisma.cabang.count({ where });

    // Get branches with stats
    const branches = await prisma.cabang.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            transaksi: true,
          },
        },
        kas: {
          select: {
            saldo: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform data
    const data = branches.map((branch) => ({
      id: branch.id,
      kode: branch.kode,
      nama: branch.nama,
      alamat: branch.alamat,
      telepon: branch.telepon,
      isActive: branch.isActive,
      userCount: branch._count.users,
      transactionCount: branch._count.transaksi,
      kasSaldo: branch.kas?.saldo || 0,
      createdAt: branch.createdAt.toISOString(),
      updatedAt: branch.updatedAt.toISOString(),
    }));

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching branches:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data cabang',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/branches - Create new branch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      kode,
      nama,
      alamat,
      telepon,
    } = body;

    // Validate required fields
    if (!kode || kode.trim() === '') {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Kode cabang harus diisi' },
      }, { status: 400 });
    }

    if (!nama || nama.trim() === '') {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nama cabang harus diisi' },
      }, { status: 400 });
    }

    // Check if kode already exists
    const existingBranch = await prisma.cabang.findUnique({
      where: { kode },
    });

    if (existingBranch) {
      return NextResponse.json({
        success: false,
        error: { code: 'DUPLICATE_ERROR', message: 'Kode cabang sudah digunakan' },
      }, { status: 400 });
    }

    // Create branch and kas in transaction
    const branch = await prisma.$transaction(async (tx) => {
      const newBranch = await tx.cabang.create({
        data: {
          kode: kode.toUpperCase(),
          nama,
          alamat: alamat || null,
          telepon: telepon || null,
          isActive: true,
        },
      });

      // Create kas for the branch
      await tx.kas.create({
        data: {
          cabangId: newBranch.id,
          saldo: 0,
        },
      });

      return newBranch;
    });

    const data = {
      id: branch.id,
      kode: branch.kode,
      nama: branch.nama,
      alamat: branch.alamat,
      telepon: branch.telepon,
      isActive: branch.isActive,
      createdAt: branch.createdAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menambah cabang',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

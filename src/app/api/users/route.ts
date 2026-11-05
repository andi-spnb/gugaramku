import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/users - Get users list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const cabangId = searchParams.get('cabangId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    if (cabangId) {
      where.cabangId = cabangId;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      include: {
        cabang: {
          select: {
            id: true,
            nama: true,
            kode: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { nama: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform data (exclude password)
    const data = users.map((user) => ({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      pin: user.pin ? '****' : null,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      cabang: user.cabang ? {
        id: user.cabang.id,
        nama: user.cabang.nama,
        kode: user.cabang.kode,
      } : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
    console.error('Error fetching users:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data karyawan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      nama,
      email,
      password,
      pin,
      role = 'KASIR',
      cabangId,
    } = body;

    // Validate required fields
    if (!nama || nama.trim() === '') {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nama harus diisi' },
      }, { status: 400 });
    }

    if (!email || email.trim() === '') {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email harus diisi' },
      }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password minimal 6 karakter' },
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['OWNER', 'ADMIN_CABANG', 'KASIR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Role tidak valid' },
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: { code: 'DUPLICATE_ERROR', message: 'Email sudah terdaftar' },
      }, { status: 400 });
    }

    // Validate PIN if provided
    if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'PIN harus 4-6 digit angka' },
      }, { status: 400 });
    }

    // Create user (in production, password should be hashed)
    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password, // TODO: Hash password in production
        pin: pin || null,
        role,
        cabangId: cabangId || null,
        isActive: true,
      },
      include: {
        cabang: {
          select: {
            id: true,
            nama: true,
            kode: true,
          },
        },
      },
    });

    const data = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      pin: user.pin ? '****' : null,
      isActive: user.isActive,
      cabang: user.cabang,
      createdAt: user.createdAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menambah karyawan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

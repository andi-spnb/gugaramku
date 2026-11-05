import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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

    if (!user) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Karyawan tidak ditemukan' },
      }, { status: 404 });
    }

    const data = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      pin: user.pin ? '****' : null,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString() || null,
      cabang: user.cabang,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);

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

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const {
      nama,
      email,
      role,
      pin,
      cabangId,
      isActive,
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Karyawan tidak ditemukan' },
      }, { status: 404 });
    }

    // Validate email uniqueness if changed
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json({
          success: false,
          error: { code: 'DUPLICATE_ERROR', message: 'Email sudah digunakan' },
        }, { status: 400 });
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['OWNER', 'ADMIN_CABANG', 'KASIR'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Role tidak valid' },
        }, { status: 400 });
      }
    }

    // Validate PIN if provided
    if (pin !== undefined && pin !== null && pin !== '') {
      if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'PIN harus 4-6 digit angka' },
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (nama !== undefined) updateData.nama = nama;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (pin !== undefined) updateData.pin = pin || null;
    if (cabangId !== undefined) updateData.cabangId = cabangId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
      lastLogin: user.lastLogin?.toISOString() || null,
      cabang: user.cabang,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memperbarui karyawan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (soft delete by setting isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Karyawan tidak ditemukan' },
      }, { status: 404 });
    }

    // Prevent deleting OWNER
    if (existingUser.role === 'OWNER') {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Tidak dapat menghapus akun Owner' },
      }, { status: 403 });
    }

    // Soft delete
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    const response: ApiResponse<null> = {
      success: true,
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting user:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menghapus karyawan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/branches/[id] - Get branch by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branch = await prisma.cabang.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            transaksi: true,
            stok: true,
          },
        },
        kas: {
          select: {
            saldo: true,
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cabang tidak ditemukan' },
      }, { status: 404 });
    }

    const data = {
      id: branch.id,
      kode: branch.kode,
      nama: branch.nama,
      alamat: branch.alamat,
      telepon: branch.telepon,
      isActive: branch.isActive,
      userCount: branch._count.users,
      transactionCount: branch._count.transaksi,
      productCount: branch._count.stok,
      kasSaldo: branch.kas?.saldo || 0,
      createdAt: branch.createdAt.toISOString(),
      updatedAt: branch.updatedAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching branch:', error);

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

// PUT /api/branches/[id] - Update branch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const {
      kode,
      nama,
      alamat,
      telepon,
      isActive,
    } = body;

    // Check if branch exists
    const existingBranch = await prisma.cabang.findUnique({
      where: { id: params.id },
    });

    if (!existingBranch) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cabang tidak ditemukan' },
      }, { status: 404 });
    }

    // Validate kode uniqueness if changed
    if (kode && kode !== existingBranch.kode) {
      const kodeExists = await prisma.cabang.findUnique({
        where: { kode },
      });

      if (kodeExists) {
        return NextResponse.json({
          success: false,
          error: { code: 'DUPLICATE_ERROR', message: 'Kode cabang sudah digunakan' },
        }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (kode !== undefined) updateData.kode = kode.toUpperCase();
    if (nama !== undefined) updateData.nama = nama;
    if (alamat !== undefined) updateData.alamat = alamat || null;
    if (telepon !== undefined) updateData.telepon = telepon || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const branch = await prisma.cabang.update({
      where: { id: params.id },
      data: updateData,
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
    });

    const data = {
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
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating branch:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memperbarui cabang',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/branches/[id] - Delete branch (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if branch exists
    const existingBranch = await prisma.cabang.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            transaksi: true,
            users: true,
          },
        },
      },
    });

    if (!existingBranch) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cabang tidak ditemukan' },
      }, { status: 404 });
    }

    // Check if branch has transactions
    if (existingBranch._count.transaksi > 0) {
      // Soft delete - just deactivate
      await prisma.cabang.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        data: null,
        message: 'Cabang dinonaktifkan karena memiliki data transaksi',
      });
    }

    // Hard delete if no transactions
    await prisma.cabang.delete({
      where: { id: params.id },
    });

    const response: ApiResponse<null> = {
      success: true,
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting branch:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menghapus cabang',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

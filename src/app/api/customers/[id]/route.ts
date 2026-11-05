import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.pelanggan.findUnique({
      where: { id: params.id },
      include: {
        hutang: {
          where: { status: 'BELUM_LUNAS' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Pelanggan tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customer:', error);
    
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

// PUT /api/customers/[id]
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
          message: 'Nama pelanggan harus diisi',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const existing = await prisma.pelanggan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Pelanggan tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const customer = await prisma.pelanggan.update({
      where: { id: params.id },
      data: {
        nama: body.nama.trim(),
        telepon: body.telepon?.trim() || null,
        alamat: body.alamat?.trim() || null,
        kategori: body.kategori || existing.kategori,
        maxHutang: body.maxHutang ?? existing.maxHutang,
        catatan: body.catatan?.trim() || null,
        isActive: body.isActive ?? existing.isActive,
      },
    });

    const response: ApiResponse<typeof customer> = {
      success: true,
      data: customer,
      message: 'Pelanggan berhasil diperbarui',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating customer:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memperbarui pelanggan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.pelanggan.findUnique({
      where: { id: params.id },
      include: {
        transaksi: { take: 1 },
        hutang: { where: { status: 'BELUM_LUNAS' }, take: 1 },
      },
    });

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Pelanggan tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check unpaid debts
    if (existing.hutang.length > 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'HAS_UNPAID_DEBT',
          message: 'Pelanggan masih memiliki hutang yang belum lunas',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Soft delete if has transactions
    if (existing.transaksi.length > 0) {
      await prisma.pelanggan.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Pelanggan dinonaktifkan (memiliki riwayat transaksi)',
      };
      return NextResponse.json(response);
    }

    // Hard delete
    await prisma.pelanggan.delete({
      where: { id: params.id },
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Pelanggan berhasil dihapus',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menghapus pelanggan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

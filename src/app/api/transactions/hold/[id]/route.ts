import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// DELETE /api/transactions/hold/[id] - Hapus (batalkan) transaksi tertahan
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = params;

    // Pastikan transaksi ada dan berstatus HOLD
    const transaksi = await prisma.transaksi.findUnique({
      where: { id },
    });

    if (!transaksi) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaksi tertahan tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (transaksi.status !== 'HOLD') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaksi bukan transaksi tertahan',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Detail transaksi otomatis terhapus (cascade)
    await prisma.transaksi.delete({
      where: { id },
    });

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Transaksi tertahan berhasil dihapus',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting held transaction:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menghapus transaksi tertahan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

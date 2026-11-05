import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/debts/[id]/pay - Pay debt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { jumlah, metode, catatan, userId } = body;

    if (!jumlah || jumlah <= 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Jumlah pembayaran harus lebih dari 0',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const hutang = await prisma.hutang.findUnique({
      where: { id: params.id },
    });

    if (!hutang) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Data hutang tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (hutang.status === 'LUNAS') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'ALREADY_PAID',
          message: 'Hutang sudah lunas',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const sisaBaru = Number(hutang.sisa) - jumlah;

    if (sisaBaru < 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'OVERPAYMENT',
          message: `Pembayaran melebihi sisa hutang (Rp ${Number(hutang.sisa).toLocaleString('id-ID')})`,
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const pembayaran = await tx.hutangPembayaran.create({
        data: {
          hutangId: params.id,
          jumlah,
          metode: metode || 'TUNAI',
          catatan: catatan || null,
          userId: userId || 'demo-kasir-001',
        },
      });

      // Update debt
      const updatedHutang = await tx.hutang.update({
        where: { id: params.id },
        data: {
          sisa: sisaBaru,
          status: sisaBaru === 0 ? 'LUNAS' : 'BELUM_LUNAS',
        },
        include: {
          pelanggan: true,
          pembayaran: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return { pembayaran, hutang: updatedHutang };
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: result.hutang.status === 'LUNAS' ? 'Hutang telah lunas!' : 'Pembayaran berhasil dicatat',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing payment:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memproses pembayaran',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

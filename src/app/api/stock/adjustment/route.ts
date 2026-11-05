import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/stock/adjustment - Create stock adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { produkId, cabangId, jumlah, tipe, keterangan, userId } = body;

    // Validate
    if (!produkId || !cabangId || jumlah === undefined || !tipe) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data adjustment tidak lengkap',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Valid tipe: ADJUSTMENT_PLUS, ADJUSTMENT_MINUS, OPNAME, RUSAK, EXPIRED
    const validTipes = ['ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'OPNAME', 'RUSAK', 'EXPIRED'];
    if (!validTipes.includes(tipe)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tipe adjustment tidak valid',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get or create stock record
      let stok = await tx.stok.findUnique({
        where: {
          produkId_cabangId: { produkId, cabangId },
        },
      });

      const jumlahSebelum = stok?.jumlah || 0;
      let jumlahSesudah: number;

      // Calculate new stock based on tipe
      if (tipe === 'OPNAME') {
        // Opname sets absolute value
        jumlahSesudah = jumlah;
      } else if (tipe === 'ADJUSTMENT_PLUS') {
        jumlahSesudah = Number(jumlahSebelum) + jumlah;
      } else {
        // ADJUSTMENT_MINUS, RUSAK, EXPIRED
        jumlahSesudah = Number(jumlahSebelum) - jumlah;
      }

      // Update or create stock
      if (stok) {
        stok = await tx.stok.update({
          where: { id: stok.id },
          data: { jumlah: jumlahSesudah },
        });
      } else {
        stok = await tx.stok.create({
          data: {
            produkId,
            cabangId,
            jumlah: jumlahSesudah,
            stokMinimum: 0,
          },
        });
      }

      // Create mutation record
      const mutasi = await tx.stokMutasi.create({
        data: {
          produkId,
          cabangId,
          jumlah: tipe === 'OPNAME' ? jumlahSesudah - Number(jumlahSebelum) : (tipe === 'ADJUSTMENT_PLUS' ? jumlah : -jumlah),
          jumlahSebelum: Number(jumlahSebelum),
          jumlahSesudah,
          tipe,
          keterangan: keterangan || null,
          userId: userId || 'demo-kasir-001',
        },
      });

      return { stok, mutasi };
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Adjustment stok berhasil',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating adjustment:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menyimpan adjustment',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

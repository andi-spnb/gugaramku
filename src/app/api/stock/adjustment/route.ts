import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';
import { logActivity } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// POST /api/stock/adjustment - Create stock adjustment
export async function POST(request: NextRequest) {
  // Hanya Owner & Admin Cabang boleh adjust stok
  const authResult = await requireAuth(['OWNER', 'ADMIN_CABANG']);
  if (!authResult.ok) return authResult.response;
  const sessionUser = authResult.user;

  try {
    const body = await request.json();

    const { produkId, jumlah, tipe, keterangan } = body;

    // cabangId diambil dari session (bukan body) untuk cegah IDOR lintas cabang
    const cabangId = sessionUser.cabangId;

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

    // Validasi jumlah
    if (!Number.isFinite(Number(jumlah)) || Number(jumlah) <= 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Jumlah adjustment harus lebih dari 0',
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
      // Get or create stock record (baca di dalam tx untuk konsistensi)
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
        jumlahSesudah = Number(jumlah);
      } else if (tipe === 'ADJUSTMENT_PLUS') {
        jumlahSesudah = Number(jumlahSebelum) + Number(jumlah);
      } else {
        // ADJUSTMENT_MINUS, RUSAK, EXPIRED
        jumlahSesudah = Number(jumlahSebelum) - Number(jumlah);
      }

      // Stok tidak boleh negatif
      if (jumlahSesudah < 0) {
        throw new Error('STOK_NEGATIF');
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

      // Create mutation record (userId dari session, bukan body)
      const mutasi = await tx.stokMutasi.create({
        data: {
          produkId,
          cabangId,
          jumlah: tipe === 'OPNAME' ? jumlahSesudah - Number(jumlahSebelum) : (tipe === 'ADJUSTMENT_PLUS' ? Number(jumlah) : -Number(jumlah)),
          jumlahSebelum: Number(jumlahSebelum),
          jumlahSesudah,
          tipe,
          keterangan: keterangan || null,
          userId: sessionUser.id,
        },
      });

      return { stok, mutasi };
    });

    await logActivity({
      userId: authResult.user.id,
      aksi: 'STOCK_ADJUSTMENT',
      tabel: 'stok',
      recordId: produkId,
      dataBaru: {
        produkId,
        tipe,
        jumlah: Number(jumlah),
        jumlahSebelum: Number(result.mutasi.jumlahSebelum),
        jumlahSesudah: Number(result.mutasi.jumlahSesudah),
      },
      request,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Adjustment stok berhasil',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'STOK_NEGATIF') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Hasil adjustment tidak boleh membuat stok negatif',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

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

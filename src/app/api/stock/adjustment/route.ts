import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';
import { logActivity } from '@/lib/audit-log';
import { parseBody } from '@/lib/validation/parse';
import { stockAdjustmentSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// POST /api/stock/adjustment - Create stock adjustment
export async function POST(request: NextRequest) {
  // Hanya Owner & Admin Cabang boleh adjust stok
  const authResult = await requireAuth(['OWNER', 'ADMIN_CABANG']);
  if (!authResult.ok) return authResult.response;
  const sessionUser = authResult.user;

  try {
    const body = await request.json();

    const parsed = parseBody(stockAdjustmentSchema, body);
    if (!parsed.ok) return parsed.response;

    const { produkId, jumlah, tipe, keterangan } = parsed.data;

    // cabangId diambil dari session (bukan body) untuk cegah IDOR lintas cabang
    const cabangId = sessionUser.cabangId;

    if (!cabangId) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data adjustment tidak lengkap',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const stok = await tx.stok.findUnique({
        where: {
          produkId_cabangId: { produkId, cabangId },
        },
      });

      let jumlahSebelum = Number(stok?.jumlah ?? 0);
      let jumlahSesudah: number;
      // Baris stok terbaru (dibaca ulang setelah update atomik)
      let stokAfter: { id: string; jumlah: number };

      if (tipe === 'OPNAME') {
        // Opname men-set nilai absolut. Optimistic lock: update hanya bila stok
        // masih sama seperti yang dilihat — bila ada penjualan bersamaan, stok
        // berubah dan opname wajib diulang dengan data terbaru (jangan menimpa).
        jumlahSesudah = Number(jumlah);
        if (stok) {
          const updated = await tx.stok.updateMany({
            where: { id: stok.id, jumlah: stok.jumlah },
            data: { jumlah: jumlahSesudah },
          });
          if (updated.count === 0) {
            throw new Error('STOK_BERUBAH');
          }
          const fresh = await tx.stok.findUniqueOrThrow({
            where: { id: stok.id },
            select: { id: true, jumlah: true },
          });
          stokAfter = { id: fresh.id, jumlah: Number(fresh.jumlah) };
        } else {
          const created = await tx.stok.create({
            data: { produkId, cabangId, jumlah: jumlahSesudah, stokMinimum: 0 },
          });
          stokAfter = { id: created.id, jumlah: Number(created.jumlah) };
        }
      } else {
        // ADJUSTMENT_PLUS / ADJUSTMENT_MINUS / RUSAK / EXPIRED: perubahan relatif,
        // atomik lewat increment/decrement (tidak menimpa penjualan bersamaan).
        const delta = tipe === 'ADJUSTMENT_PLUS' ? Number(jumlah) : -Number(jumlah);

        if (!stok) {
          if (delta < 0) throw new Error('STOK_NEGATIF');
          const created = await tx.stok.create({
            data: { produkId, cabangId, jumlah: delta, stokMinimum: 0 },
          });
          jumlahSebelum = 0;
          jumlahSesudah = delta;
          stokAfter = { id: created.id, jumlah: Number(created.jumlah) };
        } else {
          // Minus tidak boleh membuat stok negatif: guard di where-clause
          const updated = await tx.stok.updateMany({
            where: {
              id: stok.id,
              ...(delta < 0 ? { jumlah: { gte: Number(jumlah) } } : {}),
            },
            data: { jumlah: { increment: delta } },
          });
          if (updated.count === 0) {
            throw new Error(delta < 0 ? 'STOK_NEGATIF' : 'STOK_BERUBAH');
          }
          const fresh = await tx.stok.findUniqueOrThrow({
            where: { id: stok.id },
            select: { id: true, jumlah: true },
          });
          jumlahSesudah = Number(fresh.jumlah);
          jumlahSebelum = jumlahSesudah - delta;
          stokAfter = { id: fresh.id, jumlah: Number(fresh.jumlah) };
        }
      }

      // Create mutation record (userId dari session, bukan body)
      const mutasi = await tx.stokMutasi.create({
        data: {
          produkId,
          cabangId,
          jumlah: tipe === 'OPNAME' ? jumlahSesudah - jumlahSebelum : (tipe === 'ADJUSTMENT_PLUS' ? Number(jumlah) : -Number(jumlah)),
          jumlahSebelum,
          jumlahSesudah,
          tipe,
          keterangan: keterangan || null,
          userId: sessionUser.id,
        },
      });

      return { stok: stokAfter, mutasi };
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

    if (error instanceof Error && error.message === 'STOK_BERUBAH') {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'STOCK_CONFLICT',
          message:
            'Stok berubah saat penyimpanan (kemungkinan ada transaksi bersamaan). Muat ulang data lalu coba lagi.',
        },
      };
      return NextResponse.json(response, { status: 409 });
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

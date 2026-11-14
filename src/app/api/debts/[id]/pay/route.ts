import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';
import { logActivity } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// POST /api/debts/[id]/pay - Pay debt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const sessionUser = authResult.user;

  try {
    const body = await request.json();
    const { jumlah, metode, catatan } = body;

    if (!Number.isFinite(Number(jumlah)) || Number(jumlah) <= 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Jumlah pembayaran harus lebih dari 0',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const metodeValid = ['TUNAI', 'QRIS', 'TRANSFER'].includes(metode || 'TUNAI');
    if (!metodeValid) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Metode pembayaran tidak valid',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Baca hutang DI DALAM transaction untuk cegah race (dua pembayaran bersamaan)
      const hutang = await tx.hutang.findUnique({
        where: { id: params.id },
      });

      if (!hutang) {
        throw new Error('HUTANG_TIDAK_DITEMUKAN');
      }

      if (hutang.status === 'LUNAS') {
        throw new Error('SUDAH_LUNAS');
      }

      const sisaBaru = Number(hutang.sisa) - Number(jumlah);

      if (sisaBaru < 0) {
        throw new Error(`OVERPAYMENT:${Number(hutang.sisa)}`);
      }

      // Create payment record (userId dari session)
      const pembayaran = await tx.hutangPembayaran.create({
        data: {
          hutangId: params.id,
          jumlah: Number(jumlah),
          metode: metode || 'TUNAI',
          catatan: catatan || null,
          userId: sessionUser.id,
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

      // Pembayaran tunai dicatat sebagai kas masuk (aturan bisnis DEB-002)
      if ((metode || 'TUNAI') === 'TUNAI' && sessionUser.cabangId) {
        const kas = await tx.kas.findUnique({
          where: { cabangId: sessionUser.cabangId },
        });

        if (kas) {
          const saldoSebelum = Number(kas.saldo);
          const saldoSesudah = saldoSebelum + Number(jumlah);

          await tx.kas.update({
            where: { cabangId: sessionUser.cabangId },
            data: { saldo: saldoSesudah },
          });

          await tx.kasMutasi.create({
            data: {
              cabangId: sessionUser.cabangId,
              jenis: 'MASUK',
              kategori: 'PEMBAYARAN_HUTANG',
              nominal: Number(jumlah),
              saldoSebelum,
              saldoSesudah,
              keterangan: `Pembayaran hutang ${updatedHutang.pelanggan?.nama || ''}`.trim(),
              referensiTipe: 'HUTANG',
              referensiId: hutang.id,
              userId: sessionUser.id,
            },
          });
        }
      }

      return { pembayaran, hutang: updatedHutang };
    });

    await logActivity({
      userId: authResult.user.id,
      aksi: 'DEBT_PAY',
      tabel: 'hutang',
      recordId: params.id,
      dataBaru: { hutangId: params.id, jumlah, metode },
      request,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: result.hutang.status === 'LUNAS' ? 'Hutang telah lunas!' : 'Pembayaran berhasil dicatat',
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'HUTANG_TIDAK_DITEMUKAN') {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Data hutang tidak ditemukan' },
        };
        return NextResponse.json(response, { status: 404 });
      }
      if (error.message === 'SUDAH_LUNAS') {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'ALREADY_PAID', message: 'Hutang sudah lunas' },
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (error.message.startsWith('OVERPAYMENT:')) {
        const sisa = error.message.split(':')[1];
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'OVERPAYMENT',
            message: `Pembayaran melebihi sisa hutang (Rp ${Number(sisa).toLocaleString('id-ID')})`,
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

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

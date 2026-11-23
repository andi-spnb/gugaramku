import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';
import { logActivity } from '@/lib/audit-log';
import { parseBody } from '@/lib/validation/parse';
import { debtPaySchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// POST /api/debts/[id]/pay - Pay debt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const sessionUser = authResult.user;

  try {
    const body = await request.json();
    const parsed = parseBody(debtPaySchema, body);
    if (!parsed.ok) return parsed.response;

    const { jumlah, metode, catatan } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // Baca hutang DI DALAM transaction untuk cegah race (dua pembayaran bersamaan)
      const hutang = await tx.hutang.findUnique({
        where: { id: id },
        include: { transaksi: { select: { cabangId: true } } },
      });

      if (!hutang) {
        throw new Error('HUTANG_TIDAK_DITEMUKAN');
      }

      // Cegah bayar hutang milik cabang lain (juga user tanpa cabang)
      if (
        !sessionUser.cabangId ||
        hutang.transaksi.cabangId !== sessionUser.cabangId
      ) {
        throw new Error('FORBIDDEN');
      }

      if (hutang.status === 'LUNAS') {
        throw new Error('SUDAH_LUNAS');
      }

      // Update ATOMIK: hanya kurangi sisa bila sisa >= jumlah.
      // Dua pembayaran bersamaan: yang kedua gagal di where-clause, bukan overpayment.
      const updated = await tx.hutang.updateMany({
        where: { id: id, sisa: { gte: jumlah } },
        data: { sisa: { decrement: jumlah } },
      });

      if (updated.count === 0) {
        throw new Error(`OVERPAYMENT:${Number(hutang.sisa)}`);
      }

      // Baca ulang sisa terbaru di dalam transaksi yang sama
      const current = await tx.hutang.findUnique({
        where: { id: id },
        select: { sisa: true },
      });
      const sisaBaru = Number(current?.sisa ?? 0);

      // Create payment record (userId dari session)
      const pembayaran = await tx.hutangPembayaran.create({
        data: {
          hutangId: id,
          jumlah: Number(jumlah),
          metode: metode || 'TUNAI',
          catatan: catatan || null,
          userId: sessionUser.id,
        },
      });

      // Update status berdasarkan sisa terbaru
      const updatedHutang = await tx.hutang.update({
        where: { id: id },
        data: {
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
          // Increment atomik: dua pembayaran bersamaan tidak saling menimpa saldo
          const updatedKas = await tx.kas.update({
            where: { cabangId: sessionUser.cabangId },
            data: { saldo: { increment: Number(jumlah) } },
          });
          const saldoSesudah = Number(updatedKas.saldo);
          const saldoSebelum = saldoSesudah - Number(jumlah);

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
      recordId: id,
      dataBaru: { hutangId: id, jumlah, metode },
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
      if (error.message === 'FORBIDDEN') {
        const response: ApiResponse<null> = {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Hutang ini bukan milik cabang Anda.' },
        };
        return NextResponse.json(response, { status: 403 });
      }
      if (error.message === 'SUDAH_LUNAS') {        const response: ApiResponse<null> = {
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

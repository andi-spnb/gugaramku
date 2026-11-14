import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { logActivity } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// POST /api/kas/in - Record cash in
export async function POST(request: NextRequest) {
    const authResult = await requireAuth(['OWNER', 'ADMIN_CABANG']);
    if (!authResult.ok) return authResult.response;
    const user = authResult.user;

    if (!user.cabangId) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cabang tidak ditemukan pada user',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
  try {
    const body = await request.json();

    const {
      kategori,
      nominal,
      keterangan,
      referensiTipe,
      referensiId,
    } = body;
    const cabangId = user.cabangId;
    const userId = user.id;

    // Validate required fields
    if (!kategori) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Kategori harus diisi',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!nominal || nominal <= 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Nominal harus lebih dari 0',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get or create kas for branch, then update saldo and create mutation
    // atomically (interactive transaction prevents race conditions)
    const [mutasi, updatedKas] = await prisma.$transaction(async (tx) => {
      let kas = await tx.kas.findUnique({
        where: { cabangId },
      });

      if (!kas) {
        kas = await tx.kas.create({
          data: {
            cabangId,
            saldo: 0,
          },
        });
      }

      const saldoSebelum = kas.saldo;
      const saldoSesudah = saldoSebelum + nominal;

      return [
        await tx.kasMutasi.create({
          data: {
            cabangId,
            jenis: 'MASUK',
            kategori,
            nominal,
            saldoSebelum,
            saldoSesudah,
            keterangan: keterangan || null,
            referensiTipe: referensiTipe || null,
            referensiId: referensiId || null,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        }),
        await tx.kas.update({
          where: { cabangId },
          data: { saldo: saldoSesudah },
        }),
      ];
    });

    await logActivity({
      userId: user.id,
      aksi: 'KAS_MASUK',
      tabel: 'kas',
      recordId: mutasi.id,
      dataBaru: { nominal, kategori, keterangan },
      request,
    });

    const responseData = {
      mutasi: {
        id: mutasi.id,
        cabangId: mutasi.cabangId,
        jenis: mutasi.jenis,
        kategori: mutasi.kategori,
        nominal: mutasi.nominal,
        saldoSebelum: mutasi.saldoSebelum,
        saldoSesudah: mutasi.saldoSesudah,
        keterangan: mutasi.keterangan,
        userId: mutasi.userId,
        namaUser: mutasi.user.nama,
        createdAt: mutasi.createdAt.toISOString(),
      },
      kas: updatedKas,
    };

    const response: ApiResponse<typeof responseData> = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating kas masuk:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menyimpan kas masuk',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

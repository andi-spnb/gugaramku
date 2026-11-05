import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/kas/in - Record cash in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      cabangId = 'demo-cabang-001',
      kategori,
      nominal,
      keterangan,
      userId = 'demo-user-001',
      referensiTipe,
      referensiId,
    } = body;

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

    // Get or create kas for branch
    let kas = await prisma.kas.findUnique({
      where: { cabangId },
    });

    if (!kas) {
      kas = await prisma.kas.create({
        data: {
          cabangId,
          saldo: 0,
        },
      });
    }

    const saldoSebelum = kas.saldo;
    const saldoSesudah = saldoSebelum + nominal;

    // Create mutation and update saldo in transaction
    const [mutasi, updatedKas] = await prisma.$transaction([
      prisma.kasMutasi.create({
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
      prisma.kas.update({
        where: { cabangId },
        data: { saldo: saldoSesudah },
      }),
    ]);

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

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// Helper to generate retur number
function generateReturNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  return `RTR${dateStr}${timeStr}`;
}

// GET /api/retur - Get retur list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get('cabangId') || 'demo-cabang-001';
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {
      cabangId,
    };

    if (search) {
      where.OR = [
        { nomor: { contains: search } },
        { transaksiAsal: { nomor: { contains: search } } },
      ];
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        (where.tanggal as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.tanggal as Record<string, unknown>).lte = end;
      }
    }

    // Get total count
    const total = await prisma.retur.count({ where });

    // Get retur list
    const returList = await prisma.retur.findMany({
      where,
      include: {
        transaksiAsal: {
          select: {
            id: true,
            nomor: true,
            tanggal: true,
            total: true,
            pelanggan: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nama: true,
          },
        },
        detail: {
          include: {
            detailTransaksi: {
              select: {
                namaBarang: true,
                satuan: true,
                hargaJual: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform data
    const data = returList.map((r) => ({
      id: r.id,
      nomor: r.nomor,
      tanggal: r.tanggal.toISOString(),
      transaksiAsal: {
        id: r.transaksiAsal.id,
        nomor: r.transaksiAsal.nomor,
        tanggal: r.transaksiAsal.tanggal.toISOString(),
        total: r.transaksiAsal.total,
        pelanggan: r.transaksiAsal.pelanggan?.nama || 'Umum',
      },
      totalRefund: r.totalRefund,
      metodeRefund: r.metodeRefund,
      alasan: r.alasan,
      catatan: r.catatan,
      user: r.user.nama,
      itemCount: r.detail.length,
      detail: r.detail.map((d) => ({
        id: d.id,
        namaBarang: d.detailTransaksi.namaBarang,
        satuan: d.detailTransaksi.satuan,
        jumlah: d.jumlah,
        nilaiRefund: d.nilaiRefund,
      })),
      createdAt: r.createdAt.toISOString(),
    }));

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching retur:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data retur',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/retur - Create new retur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      transaksiId,
      cabangId = 'demo-cabang-001',
      userId = 'demo-user-001',
      metodeRefund, // TUNAI, TUKAR_BARANG
      alasan, // RUSAK, SALAH, EXPIRED, LAINNYA
      catatan,
      items, // Array of { detailTransaksiId, jumlah }
    } = body;

    // Validate required fields
    if (!transaksiId) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Transaksi harus dipilih' },
      }, { status: 400 });
    }

    if (!metodeRefund) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Metode refund harus dipilih' },
      }, { status: 400 });
    }

    if (!alasan) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Alasan retur harus dipilih' },
      }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Pilih minimal 1 item untuk diretur' },
      }, { status: 400 });
    }

    // Get original transaction
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: transaksiId },
      include: {
        detailTransaksi: true,
      },
    });

    if (!transaksi) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' },
      }, { status: 404 });
    }

    if (transaksi.status !== 'SELESAI') {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Hanya transaksi SELESAI yang bisa diretur' },
      }, { status: 400 });
    }

    // Validate items and calculate total refund
    let totalRefund = 0;
    const returDetails: Array<{
      detailTransaksiId: string;
      jumlah: number;
      nilaiRefund: number;
      produkId: string | null;
      konversi: number;
    }> = [];

    for (const item of items) {
      const detail = transaksi.detailTransaksi.find((d) => d.id === item.detailTransaksiId);
      if (!detail) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Item tidak ditemukan dalam transaksi` },
        }, { status: 400 });
      }

      if (item.jumlah <= 0 || item.jumlah > detail.jumlah) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Jumlah retur tidak valid untuk ${detail.namaBarang}` },
        }, { status: 400 });
      }

      const nilaiRefund = (detail.hargaJual - detail.diskon) * item.jumlah;
      totalRefund += nilaiRefund;

      returDetails.push({
        detailTransaksiId: item.detailTransaksiId,
        jumlah: item.jumlah,
        nilaiRefund,
        produkId: detail.produkId,
        konversi: detail.konversi,
      });
    }

    // Create retur and update stock in transaction
    const retur = await prisma.$transaction(async (tx) => {
      // Create retur
      const newRetur = await tx.retur.create({
        data: {
          nomor: generateReturNumber(),
          transaksiAsalId: transaksiId,
          cabangId,
          userId,
          tanggal: new Date(),
          totalRefund,
          metodeRefund,
          alasan,
          catatan: catatan || null,
          detail: {
            create: returDetails.map((d) => ({
              detailTransaksiId: d.detailTransaksiId,
              jumlah: d.jumlah,
              nilaiRefund: d.nilaiRefund,
            })),
          },
        },
        include: {
          detail: {
            include: {
              detailTransaksi: true,
            },
          },
          transaksiAsal: {
            select: {
              nomor: true,
              pelanggan: {
                select: { nama: true },
              },
            },
          },
          user: {
            select: { nama: true },
          },
        },
      });

      // Update stock (add back) for each returned item
      for (const item of returDetails) {
        if (item.produkId) {
          const qtyInBaseUnit = item.jumlah * item.konversi;

          // Get or create stock
          const existingStock = await tx.stok.findUnique({
            where: {
              produkId_cabangId: {
                produkId: item.produkId,
                cabangId,
              },
            },
          });

          const currentQty = existingStock?.jumlah || 0;
          const newQty = currentQty + qtyInBaseUnit;

          // Upsert stock
          await tx.stok.upsert({
            where: {
              produkId_cabangId: {
                produkId: item.produkId,
                cabangId,
              },
            },
            update: { jumlah: newQty },
            create: {
              produkId: item.produkId,
              cabangId,
              jumlah: newQty,
              stokMinimum: 0,
            },
          });

          // Create stock mutation
          await tx.stokMutasi.create({
            data: {
              produkId: item.produkId,
              cabangId,
              jumlah: qtyInBaseUnit,
              jumlahSebelum: currentQty,
              jumlahSesudah: newQty,
              tipe: 'RETUR',
              referensiTipe: 'RETUR',
              referensiId: newRetur.id,
              keterangan: `Retur dari transaksi ${transaksi.nomor}`,
              userId,
            },
          });
        }
      }

      // If refund is TUNAI, create kas keluar
      if (metodeRefund === 'TUNAI' && totalRefund > 0) {
        // Get current kas
        let kas = await tx.kas.findUnique({
          where: { cabangId },
        });

        if (!kas) {
          kas = await tx.kas.create({
            data: { cabangId, saldo: 0 },
          });
        }

        const saldoSebelum = kas.saldo;
        const saldoSesudah = saldoSebelum - totalRefund;

        // Create kas mutation
        await tx.kasMutasi.create({
          data: {
            cabangId,
            jenis: 'KELUAR',
            kategori: 'RETUR',
            nominal: totalRefund,
            saldoSebelum,
            saldoSesudah,
            keterangan: `Refund retur ${newRetur.nomor}`,
            referensiTipe: 'RETUR',
            referensiId: newRetur.id,
            userId,
          },
        });

        // Update kas balance
        await tx.kas.update({
          where: { cabangId },
          data: { saldo: saldoSesudah },
        });
      }

      return newRetur;
    });

    const responseData = {
      id: retur.id,
      nomor: retur.nomor,
      tanggal: retur.tanggal.toISOString(),
      transaksiAsal: {
        nomor: retur.transaksiAsal.nomor,
        pelanggan: retur.transaksiAsal.pelanggan?.nama || 'Umum',
      },
      totalRefund: retur.totalRefund,
      metodeRefund: retur.metodeRefund,
      alasan: retur.alasan,
      catatan: retur.catatan,
      user: retur.user.nama,
      detail: retur.detail.map((d) => ({
        namaBarang: d.detailTransaksi.namaBarang,
        jumlah: d.jumlah,
        nilaiRefund: d.nilaiRefund,
      })),
    };

    const response: ApiResponse<typeof responseData> = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating retur:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menyimpan retur',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

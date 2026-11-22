import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/api-auth';
import type { ApiResponse } from '@/types';
import { logActivity } from '@/lib/audit-log';
import { parseBody } from '@/lib/validation/parse';
import { createReturSchema } from '@/lib/validation/schemas';

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
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const cabangId = authResult.user.cabangId;
    if (!cabangId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cabang user tidak ditemukan' },
      };
      return NextResponse.json(response, { status: 400 });
    }

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
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();

    const cabangId = authResult.user.cabangId;
    const userId = authResult.user.id;

    if (!cabangId) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cabang user tidak ditemukan' },
      }, { status: 400 });
    }

    const parsed = parseBody(createReturSchema, body);
    if (!parsed.ok) return parsed.response;

    const {
      transaksiId,
      metodeRefund, // TUNAI, TUKAR_BARANG
      alasan, // RUSAK, SALAH, EXPIRED, LAINNYA
      catatan,
      items, // Array of { detailTransaksiId, jumlah }
    } = parsed.data;

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

    // Transaksi asal harus milik cabang user (cegah retur lintas cabang)
    if (transaksi.cabangId !== cabangId) {
      return NextResponse.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Transaksi bukan milik cabang Anda' },
      }, { status: 403 });
    }

    // Ambil total retur yang sudah pernah dilakukan per detail transaksi
    const existingReturDetails = await prisma.returDetail.findMany({
      where: { detailTransaksiId: { in: items.map((i: { detailTransaksiId: string }) => i.detailTransaksiId) } },
    });
    const returSebelumnya = new Map<string, number>();
    for (const rd of existingReturDetails) {
      returSebelumnya.set(
        rd.detailTransaksiId,
        (returSebelumnya.get(rd.detailTransaksiId) || 0) + Number(rd.jumlah)
      );
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

      if (item.jumlah <= 0 || item.jumlah > Number(detail.jumlah)) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Jumlah retur tidak valid untuk ${detail.namaBarang}` },
        }, { status: 400 });
      }

      // Cek retur kumulatif: total retur sebelumnya + retur ini tidak boleh melebihi jumlah beli
      const sudahDiretur = returSebelumnya.get(item.detailTransaksiId) || 0;
      if (sudahDiretur + item.jumlah > Number(detail.jumlah)) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Total retur untuk ${detail.namaBarang} melebihi jumlah beli (sudah diretur: ${sudahDiretur})`,
          },
        }, { status: 400 });
      }

      // Refund proporsional terhadap subtotal item (bukan harga satuan dikurangi diskon)
      const nilaiRefund = (item.jumlah / Number(detail.jumlah)) * Number(detail.subtotal);
      totalRefund += nilaiRefund;

      returDetails.push({
        detailTransaksiId: item.detailTransaksiId,
        jumlah: item.jumlah,
        nilaiRefund,
        produkId: detail.produkId,
        konversi: Number(detail.konversi),
      });
    }

    // Create retur and update stock in transaction
    let hutangKredit = 0;
    const retur = await prisma.$transaction(async (tx) => {
      // Re-check retur kumulatif DI DALAM transaction (cegah race double refund:
      // dua request retur bersamaan untuk item yang sama)
      const existingDetails = await tx.returDetail.findMany({
        where: { detailTransaksiId: { in: items.map((i: { detailTransaksiId: string }) => i.detailTransaksiId) } },
      });
      const sudahMap = new Map<string, number>();
      for (const rd of existingDetails) {
        sudahMap.set(rd.detailTransaksiId, (sudahMap.get(rd.detailTransaksiId) || 0) + Number(rd.jumlah));
      }
      for (const d of returDetails) {
        const sudah = sudahMap.get(d.detailTransaksiId) || 0;
        const detail = transaksi.detailTransaksi.find((x) => x.id === d.detailTransaksiId);
        if (detail && sudah + d.jumlah > Number(detail.jumlah)) {
          throw new Error(`RETUR_LEBIH:${detail.namaBarang}:${sudah}`);
        }
      }

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

          const currentQty = Number(existingStock?.jumlah || 0);
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

      // Retur atas transaksi HUTANG: refund dikreditkan ke sisa hutang dulu
      // (barang kembali -> hutang berkurang). Kas keluar hanya untuk
      // kelebihan refund di atas sisa hutang, bukan jumlah penuh.
      let refundKas = totalRefund;
      if (transaksi.metodeBayar === 'HUTANG') {
        const hutang = await tx.hutang.findFirst({
          where: { transaksiId: transaksiId, status: 'BELUM_LUNAS' },
        });
        if (hutang) {
          const kredit = Math.min(totalRefund, Number(hutang.sisa));
          const sisaBaru = Number(hutang.sisa) - kredit;
          await tx.hutang.update({
            where: { id: hutang.id },
            data: {
              sisa: sisaBaru,
              status: sisaBaru === 0 ? 'LUNAS' : 'BELUM_LUNAS',
            },
          });
          refundKas = totalRefund - kredit;
          hutangKredit = kredit;
        }
      }

      // Jika ada sisa refund tunai, create kas keluar
      if (metodeRefund === 'TUNAI' && refundKas > 0) {
        // Get current kas
        let kas = await tx.kas.findUnique({
          where: { cabangId },
        });

        if (!kas) {
          kas = await tx.kas.create({
            data: { cabangId, saldo: 0 },
          });
        }

        const saldoSebelum = Number(kas.saldo);
        const saldoSesudah = saldoSebelum - refundKas;

        // Tolak refund tunai yang membuat saldo kas negatif
        if (saldoSesudah < 0) {
          throw new Error(`SALDO_KURANG:${saldoSebelum}`);
        }

        // Create kas mutation
        await tx.kasMutasi.create({
          data: {
            cabangId,
            jenis: 'KELUAR',
            kategori: 'RETUR',
            nominal: refundKas,
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

    await logActivity({
      userId: authResult.user.id,
      aksi: 'RETUR_CREATE',
      tabel: 'retur',
      recordId: retur.id,
      dataBaru: { transaksiId, metodeRefund, alasan, totalRefund },
      request,
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
      hutangKredit,
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
    if (error instanceof Error) {
      if (error.message.startsWith('RETUR_LEBIH:')) {
        const [, namaBarang, sudah] = error.message.split(':');
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Total retur untuk ${namaBarang} melebihi jumlah beli (sudah diretur: ${sudah})`,
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (error.message.startsWith('SALDO_KURANG:')) {
        const saldo = error.message.split(':')[1];
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Saldo kas tidak cukup untuk refund tunai (saldo saat ini: Rp ${Number(saldo).toLocaleString('id-ID')})`,
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

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

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse, TransaksiWithDetails } from '@/types';
import { MetodeBayar, StatusTransaksi, StatusSync, Role, KategoriPelanggan } from '@/types';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

// Request body type for creating transaction
interface CreateTransactionBody {
  cabangId: string;
  kasirId: string;
  pelangganId?: string | null;
  tingkatHarga: number;
  metodeBayar: MetodeBayar;
  jumlahBayar: number;
  catatan?: string | null;
  diskonTotal: number;
  items: Array<{
    produkId?: string | null;
    produkSatuanId?: string | null;
    namaBarang: string;
    barcode?: string | null;
    jumlah: number;
    satuan: string;
    konversi: number;
    hargaModal: number;
    hargaJual: number;
    diskon: number;
    isQuickSale: boolean;
  }>;
}

// Generate transaction number: TRX-YYYYMMDD-XXXX
async function generateTransactionNumber(cabangId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get count of transactions today for this branch
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  const count = await prisma.transaksi.count({
    where: {
      cabangId,
      tanggal: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `TRX-${dateStr}-${sequence}`;
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const body: CreateTransactionBody = await request.json();

    // Validate required fields
    if (!body.cabangId || !body.kasirId || !body.items?.length) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data transaksi tidak lengkap',
          details: [
            ...(!body.cabangId ? [{ field: 'cabangId', message: 'Cabang harus dipilih' }] : []),
            ...(!body.kasirId ? [{ field: 'kasirId', message: 'Kasir harus dipilih' }] : []),
            ...(!body.items?.length ? [{ field: 'items', message: 'Minimal 1 item diperlukan' }] : []),
          ],
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    const detailItems = body.items.map((item) => {
      const itemSubtotal = item.jumlah * item.hargaJual - item.diskon;
      const laba = (item.hargaJual - item.hargaModal) * item.jumlah - item.diskon;
      subtotal += itemSubtotal;

      return {
        produkId: item.produkId || null,
        produkSatuanId: item.produkSatuanId || null,
        namaBarang: item.namaBarang,
        barcode: item.barcode || null,
        jumlah: item.jumlah,
        satuan: item.satuan,
        konversi: item.konversi,
        hargaModal: item.hargaModal,
        hargaJual: item.hargaJual,
        tingkatHarga: body.tingkatHarga,
        diskon: item.diskon,
        subtotal: itemSubtotal,
        laba: laba,
        isQuickSale: item.isQuickSale,
      };
    });

    const total = subtotal - body.diskonTotal;
    const kembalian = body.metodeBayar === 'TUNAI' 
      ? Math.max(0, body.jumlahBayar - total) 
      : 0;

    // Generate transaction number
    const nomor = await generateTransactionNumber(body.cabangId);

    // Create transaction with details in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main transaction
      const transaksi = await tx.transaksi.create({
        data: {
          nomor,
          cabangId: body.cabangId,
          kasirId: body.kasirId,
          pelangganId: body.pelangganId || null,
          tanggal: new Date(),
          tingkatHarga: body.tingkatHarga,
          subtotal,
          diskon: body.diskonTotal,
          total,
          metodeBayar: body.metodeBayar,
          jumlahBayar: body.jumlahBayar,
          kembalian,
          catatan: body.catatan || null,
          status: 'SELESAI' as StatusTransaksi,
          statusSync: 'SYNCED',
          detailTransaksi: {
            create: detailItems,
          },
        },
        include: {
          cabang: true,
          kasir: {
            select: {
              id: true,
              nama: true,
              email: true,
              role: true,
              cabangId: true,
              isActive: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          pelanggan: true,
          detailTransaksi: true,
        },
      });

      // Reduce stock for non-quick-sale items
      for (const item of body.items) {
        if (!item.isQuickSale && item.produkId) {
          // Calculate quantity in base unit
          const qtyInBaseUnit = item.jumlah * item.konversi;

          // Update stock
          await tx.stok.updateMany({
            where: {
              produkId: item.produkId,
              cabangId: body.cabangId,
            },
            data: {
              jumlah: {
                decrement: qtyInBaseUnit,
              },
            },
          });

          // Create stock mutation record
          const currentStock = await tx.stok.findFirst({
            where: {
              produkId: item.produkId,
              cabangId: body.cabangId,
            },
          });

          if (currentStock) {
            await tx.stokMutasi.create({
              data: {
                produkId: item.produkId,
                cabangId: body.cabangId,
                jumlah: -qtyInBaseUnit,
                jumlahSebelum: Number(currentStock.jumlah) + qtyInBaseUnit,
                jumlahSesudah: Number(currentStock.jumlah),
                tipe: 'KELUAR',
                referensiTipe: 'TRANSAKSI',
                referensiId: transaksi.id,
                keterangan: `Penjualan ${nomor}`,
                userId: body.kasirId,
              },
            });
          }
        }
      }

      // Update cash if payment is cash
      if (body.metodeBayar === 'TUNAI') {
        const kas = await tx.kas.findUnique({
          where: { cabangId: body.cabangId },
        });

        if (kas) {
          const newSaldo = Number(kas.saldo) + total;
          
          await tx.kas.update({
            where: { cabangId: body.cabangId },
            data: { saldo: newSaldo },
          });

          await tx.kasMutasi.create({
            data: {
              cabangId: body.cabangId,
              jenis: 'MASUK',
              kategori: 'PENJUALAN',
              nominal: total,
              saldoSebelum: Number(kas.saldo),
              saldoSesudah: newSaldo,
              keterangan: `Penjualan ${nomor}`,
              referensiTipe: 'TRANSAKSI',
              referensiId: transaksi.id,
              userId: body.kasirId,
            },
          });
        }
      }

      // Handle debt if payment method is HUTANG
      if (body.metodeBayar === 'HUTANG' && body.pelangganId) {
        await tx.hutang.create({
          data: {
            transaksiId: transaksi.id,
            pelangganId: body.pelangganId,
            jumlah: total,
            sisa: total,
            status: 'BELUM_LUNAS',
          },
        });
      }

      return transaksi;
    });

    // Transform response
    const transformedResult: TransaksiWithDetails = {
      id: result.id,
      nomor: result.nomor,
      cabangId: result.cabangId,
      kasirId: result.kasirId,
      pelangganId: result.pelangganId,
      tanggal: result.tanggal,
      tingkatHarga: result.tingkatHarga,
      subtotal: Number(result.subtotal),
      diskon: Number(result.diskon),
      total: Number(result.total),
      metodeBayar: result.metodeBayar as MetodeBayar,
      jumlahBayar: Number(result.jumlahBayar),
      kembalian: Number(result.kembalian),
      catatan: result.catatan,
      status: result.status as StatusTransaksi,
      statusSync: result.statusSync as StatusSync,
      deviceId: result.deviceId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      cabang: result.cabang ? {
        id: result.cabang.id,
        kode: result.cabang.kode,
        nama: result.cabang.nama,
        alamat: result.cabang.alamat,
        telepon: result.cabang.telepon,
        isActive: result.cabang.isActive,
        createdAt: result.cabang.createdAt,
        updatedAt: result.cabang.updatedAt,
      } : undefined,
      kasir: {
        id: result.kasir.id,
        nama: result.kasir.nama,
        email: result.kasir.email,
        role: result.kasir.role as Role,
        cabangId: result.kasir.cabangId,
        isActive: result.kasir.isActive,
        lastLogin: result.kasir.lastLogin,
        createdAt: result.kasir.createdAt,
        updatedAt: result.kasir.updatedAt,
      },
      pelanggan: result.pelanggan ? {
        id: result.pelanggan.id,
        nama: result.pelanggan.nama,
        telepon: result.pelanggan.telepon,
        alamat: result.pelanggan.alamat,
        kategori: result.pelanggan.kategori as KategoriPelanggan,
        maxHutang: Number(result.pelanggan.maxHutang),
        totalBelanja: Number(result.pelanggan.totalBelanja),
        catatan: result.pelanggan.catatan,
        isActive: result.pelanggan.isActive,
        createdAt: result.pelanggan.createdAt,
        updatedAt: result.pelanggan.updatedAt,
      } : null,
      detailTransaksi: result.detailTransaksi.map((d) => ({
        id: d.id,
        transaksiId: d.transaksiId,
        produkId: d.produkId,
        produkSatuanId: d.produkSatuanId,
        namaBarang: d.namaBarang,
        barcode: d.barcode,
        jumlah: Number(d.jumlah),
        satuan: d.satuan,
        konversi: Number(d.konversi),
        hargaModal: Number(d.hargaModal),
        hargaJual: Number(d.hargaJual),
        tingkatHarga: d.tingkatHarga,
        diskon: Number(d.diskon),
        subtotal: Number(d.subtotal),
        laba: Number(d.laba),
        isQuickSale: d.isQuickSale,
        createdAt: d.createdAt,
      })),
    };

    const response: ApiResponse<TransaksiWithDetails> = {
      success: true,
      data: transformedResult,
      message: 'Transaksi berhasil disimpan',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menyimpan transaksi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/transactions - List transactions (for history)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const cabangId = searchParams.get('cabangId');
    const kasirId = searchParams.get('kasirId');
    const tanggalMulai = searchParams.get('tanggalMulai');
    const tanggalAkhir = searchParams.get('tanggalAkhir');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: Record<string, unknown> = {};

    if (cabangId) where.cabangId = cabangId;
    if (kasirId) where.kasirId = kasirId;
    if (status) where.status = status;

    if (tanggalMulai || tanggalAkhir) {
      where.tanggal = {};
      if (tanggalMulai) {
        (where.tanggal as Record<string, unknown>).gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        (where.tanggal as Record<string, unknown>).lte = new Date(tanggalAkhir);
      }
    }

    const total = await prisma.transaksi.count({ where });

    const transactions = await prisma.transaksi.findMany({
      where,
      include: {
        cabang: true,
        kasir: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            cabangId: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pelanggan: true,
        detailTransaksi: true,
      },
      orderBy: { tanggal: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const response: ApiResponse<typeof transactions> = {
      success: true,
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data transaksi',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

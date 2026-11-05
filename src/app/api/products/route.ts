import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse, ProdukWithDetails, PaginationMeta } from '@/types';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.nama || !body.satuanDasar || !body.satuan?.length) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data produk tidak lengkap',
          details: [
            ...(!body.nama ? [{ field: 'nama', message: 'Nama produk harus diisi' }] : []),
            ...(!body.satuanDasar ? [{ field: 'satuanDasar', message: 'Satuan dasar harus diisi' }] : []),
            ...(!body.satuan?.length ? [{ field: 'satuan', message: 'Minimal 1 satuan diperlukan' }] : []),
          ],
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check barcode uniqueness
    if (body.barcode) {
      const barcodeExists = await prisma.produk.findUnique({
        where: { barcode: body.barcode },
      });
      
      if (barcodeExists) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'DUPLICATE_BARCODE',
            message: 'Barcode sudah digunakan',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Create product with satuan in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create product
      const produk = await tx.produk.create({
        data: {
          barcode: body.barcode || null,
          nama: body.nama,
          kategoriId: body.kategoriId || null,
          hargaModal: body.hargaModal || 0,
          satuanDasar: body.satuanDasar,
          gambar: body.gambar || null,
          isActive: true,
        },
      });

      // Create satuan
      for (let i = 0; i < body.satuan.length; i++) {
        const s = body.satuan[i];
        await tx.produkSatuan.create({
          data: {
            produkId: produk.id,
            namaSatuan: s.namaSatuan,
            konversi: s.konversi,
            harga1: s.harga1,
            harga2: s.harga2,
            harga3: s.harga3,
            harga4: s.harga4,
            isDefault: s.isDefault || false,
            urutan: i + 1,
          },
        });
      }

      // Create initial stock if cabangId provided
      if (body.cabangId) {
        await tx.stok.create({
          data: {
            produkId: produk.id,
            cabangId: body.cabangId,
            jumlah: body.stokAwal || 0,
            stokMinimum: body.stokMinimum || 0,
          },
        });
      }

      return tx.produk.findUnique({
        where: { id: produk.id },
        include: {
          kategori: true,
          produkSatuan: { orderBy: { urutan: 'asc' } },
          stok: true,
        },
      });
    });

    if (!result) {
      throw new Error('Failed to create product');
    }

    const transformedProduct: ProdukWithDetails = {
      id: result.id,
      barcode: result.barcode,
      nama: result.nama,
      kategoriId: result.kategoriId,
      kategori: result.kategori ? {
        id: result.kategori.id,
        nama: result.kategori.nama,
        deskripsi: result.kategori.deskripsi,
        urutan: result.kategori.urutan,
        isActive: result.kategori.isActive,
        createdAt: result.kategori.createdAt,
        updatedAt: result.kategori.updatedAt,
      } : null,
      hargaModal: Number(result.hargaModal),
      satuanDasar: result.satuanDasar,
      gambar: result.gambar,
      isActive: result.isActive,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      produkSatuan: result.produkSatuan.map((s) => ({
        id: s.id,
        produkId: s.produkId,
        namaSatuan: s.namaSatuan,
        konversi: Number(s.konversi),
        harga1: Number(s.harga1),
        harga2: Number(s.harga2),
        harga3: Number(s.harga3),
        harga4: Number(s.harga4),
        isDefault: s.isDefault,
        urutan: s.urutan,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      stok: result.stok.map((st) => ({
        id: st.id,
        produkId: st.produkId,
        cabangId: st.cabangId,
        jumlah: Number(st.jumlah),
        stokMinimum: Number(st.stokMinimum),
        updatedAt: st.updatedAt,
      })),
    };

    const response: ApiResponse<ProdukWithDetails> = {
      success: true,
      data: transformedProduct,
      message: 'Produk berhasil ditambahkan',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menambahkan produk',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/products - Search and list products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const search = searchParams.get('search') || '';
    const kategoriId = searchParams.get('kategoriId');
    const barcode = searchParams.get('barcode');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const isActive = searchParams.get('isActive') !== 'false'; // Default true
    
    // Build where clause
    const where: Record<string, unknown> = {
      isActive,
    };

    // Search by name or barcode
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exact barcode match (for scanner)
    if (barcode) {
      where.barcode = barcode;
    }

    // Filter by category
    if (kategoriId) {
      where.kategoriId = kategoriId;
    }

    // Count total
    const total = await prisma.produk.count({ where });

    // Fetch products with relations
    const products = await prisma.produk.findMany({
      where,
      include: {
        kategori: true,
        produkSatuan: {
          orderBy: { urutan: 'asc' },
        },
        stok: true,
      },
      orderBy: { nama: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to match frontend types
    const transformedProducts: ProdukWithDetails[] = products.map((p) => ({
      id: p.id,
      barcode: p.barcode,
      nama: p.nama,
      kategoriId: p.kategoriId,
      kategori: p.kategori ? {
        id: p.kategori.id,
        nama: p.kategori.nama,
        deskripsi: p.kategori.deskripsi,
        urutan: p.kategori.urutan,
        isActive: p.kategori.isActive,
        createdAt: p.kategori.createdAt,
        updatedAt: p.kategori.updatedAt,
      } : null,
      hargaModal: Number(p.hargaModal),
      satuanDasar: p.satuanDasar,
      gambar: p.gambar,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      produkSatuan: p.produkSatuan.map((s) => ({
        id: s.id,
        produkId: s.produkId,
        namaSatuan: s.namaSatuan,
        konversi: Number(s.konversi),
        harga1: Number(s.harga1),
        harga2: Number(s.harga2),
        harga3: Number(s.harga3),
        harga4: Number(s.harga4),
        isDefault: s.isDefault,
        urutan: s.urutan,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      stok: p.stok.map((st) => ({
        id: st.id,
        produkId: st.produkId,
        cabangId: st.cabangId,
        jumlah: Number(st.jumlah),
        stokMinimum: Number(st.stokMinimum),
        updatedAt: st.updatedAt,
      })),
    }));

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    const response: ApiResponse<ProdukWithDetails[]> = {
      success: true,
      data: transformedProducts,
      meta,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data produk',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

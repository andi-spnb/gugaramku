import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse, ProdukWithDetails } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.produk.findUnique({
      where: { id: params.id },
      include: {
        kategori: true,
        produkSatuan: {
          orderBy: { urutan: 'asc' },
        },
        stok: true,
      },
    });

    if (!product) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Produk tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const transformedProduct: ProdukWithDetails = {
      id: product.id,
      barcode: product.barcode,
      nama: product.nama,
      kategoriId: product.kategoriId,
      kategori: product.kategori ? {
        id: product.kategori.id,
        nama: product.kategori.nama,
        deskripsi: product.kategori.deskripsi,
        urutan: product.kategori.urutan,
        isActive: product.kategori.isActive,
        createdAt: product.kategori.createdAt,
        updatedAt: product.kategori.updatedAt,
      } : null,
      hargaModal: Number(product.hargaModal),
      satuanDasar: product.satuanDasar,
      gambar: product.gambar,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      produkSatuan: product.produkSatuan.map((s) => ({
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
      stok: product.stok.map((st) => ({
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    
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

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.nama || !body.satuanDasar || !body.satuan?.length) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data produk tidak lengkap',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if product exists
    const existing = await prisma.produk.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Produk tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check barcode uniqueness
    if (body.barcode && body.barcode !== existing.barcode) {
      const barcodeExists = await prisma.produk.findFirst({
        where: { 
          barcode: body.barcode,
          id: { not: params.id },
        },
      });
      
      if (barcodeExists) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'DUPLICATE_BARCODE',
            message: 'Barcode sudah digunakan produk lain',
          },
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Update product with satuan in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const produk = await tx.produk.update({
        where: { id: params.id },
        data: {
          barcode: body.barcode || null,
          nama: body.nama,
          kategoriId: body.kategoriId || null,
          hargaModal: body.hargaModal || 0,
          satuanDasar: body.satuanDasar,
          gambar: body.gambar || null,
          isActive: body.isActive ?? true,
        },
      });

      // Delete existing satuan
      await tx.produkSatuan.deleteMany({
        where: { produkId: params.id },
      });

      // Create new satuan
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
      throw new Error('Failed to update product');
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
      message: 'Produk berhasil diperbarui',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal memperbarui produk',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product exists
    const existing = await prisma.produk.findUnique({
      where: { id: params.id },
      include: {
        detailTransaksi: { take: 1 },
      },
    });

    if (!existing) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Produk tidak ditemukan',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if product has transactions
    if (existing.detailTransaksi.length > 0) {
      // Soft delete - just mark as inactive
      await prisma.produk.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      const response: ApiResponse<null> = {
        success: true,
        message: 'Produk dinonaktifkan (memiliki riwayat transaksi)',
      };
      return NextResponse.json(response);
    }

    // Hard delete - remove product and related data
    await prisma.$transaction(async (tx) => {
      await tx.stokMutasi.deleteMany({ where: { produkId: params.id } });
      await tx.stok.deleteMany({ where: { produkId: params.id } });
      await tx.produkSatuan.deleteMany({ where: { produkId: params.id } });
      await tx.produk.delete({ where: { id: params.id } });
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Produk berhasil dihapus',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting product:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menghapus produk',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

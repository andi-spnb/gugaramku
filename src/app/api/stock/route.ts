import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET /api/stock - Get stock list with product info
export async function GET(request: NextRequest) {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const kategoriId = searchParams.get('kategoriId');
    // cabangId dari session (cegah IDOR lintas cabang)
    const cabangId = authResult.user.cabangId;
    if (!cabangId) {
      const response: ApiResponse<null> = {
        success: false,
        error: { code: 'NO_CABANG', message: 'Akun Anda tidak terhubung ke cabang mana pun.' },
      };
      return NextResponse.json(response, { status: 400 });
    }
    const status = searchParams.get('status'); // 'low', 'empty', 'normal'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build product where clause
    const productWhere: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      productWhere.OR = [
        { nama: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (kategoriId) {
      productWhere.kategoriId = kategoriId;
    }

    // Get products with stock
    const products = await prisma.produk.findMany({
      where: productWhere,
      include: {
        kategori: true,
        stok: {
          where: { cabangId },
        },
        produkSatuan: {
          where: { isDefault: true },
          take: 1,
        },
      },
      orderBy: { nama: 'asc' },
    });

    // Transform and filter by status
    let stockList = products.map((p) => {
      const stok = p.stok[0];
      const jumlah = Number(stok?.jumlah || 0);
      const stokMinimum = Number(stok?.stokMinimum || 0);
      
      let stockStatus: 'normal' | 'low' | 'empty' = 'normal';
      if (jumlah <= 0) {
        stockStatus = 'empty';
      } else if (jumlah <= stokMinimum) {
        stockStatus = 'low';
      }

      return {
        id: stok?.id || null,
        produkId: p.id,
        cabangId,
        barcode: p.barcode,
        namaProduk: p.nama,
        kategori: p.kategori?.nama || null,
        satuanDasar: p.satuanDasar,
        jumlah,
        stokMinimum,
        status: stockStatus,
        updatedAt: stok?.updatedAt || null,
      };
    });

    // Filter by status if specified
    if (status) {
      stockList = stockList.filter((s) => s.status === status);
    }

    // Pagination
    const total = stockList.length;
    const paginatedList = stockList.slice((page - 1) * limit, page * limit);

    const response: ApiResponse<typeof paginatedList> = {
      success: true,
      data: paginatedList,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stock:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil data stok',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

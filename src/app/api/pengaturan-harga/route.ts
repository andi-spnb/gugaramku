import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

interface PriceLevelData {
  tingkat: number;
  nama: string;
  warna: string;
  deskripsi: string | null;
}

// GET /api/pengaturan-harga - Get price level configuration (nama & warna)
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const levels = await prisma.pengaturanHarga.findMany({
      orderBy: { tingkat: 'asc' },
    });

    const data: PriceLevelData[] = levels.map((l) => ({
      tingkat: l.tingkat,
      nama: l.nama,
      warna: l.warna,
      deskripsi: l.deskripsi,
    }));

    const response: ApiResponse<PriceLevelData[]> = { success: true, data };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching price levels:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Gagal mengambil pengaturan harga' },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

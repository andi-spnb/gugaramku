import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// GET /api/settings - Get store settings
export async function GET() {
  try {
    // Get or create default settings
    let settings = await prisma.pengaturanToko.findFirst();

    if (!settings) {
      settings = await prisma.pengaturanToko.create({
        data: {
          namaToko: 'GuGaramKu',
          alamat: '',
          telepon: '',
          email: '',
          logo: null,
          footerStruk: 'Terima kasih telah berbelanja',
          printerSize: '58mm',
          autoLogoutMenit: 30,
          qrisImage: null,
          rekeningBank: '[]',
        },
      });
    }

    // Parse rekening bank from JSON
    let rekeningBank = [];
    try {
      rekeningBank = JSON.parse(settings.rekeningBank || '[]');
    } catch {
      rekeningBank = [];
    }

    const data = {
      id: settings.id,
      namaToko: settings.namaToko,
      alamat: settings.alamat,
      telepon: settings.telepon,
      email: settings.email,
      logo: settings.logo,
      footerStruk: settings.footerStruk,
      printerSize: settings.printerSize,
      autoLogoutMenit: settings.autoLogoutMenit,
      qrisImage: settings.qrisImage,
      rekeningBank,
      updatedAt: settings.updatedAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mengambil pengaturan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/settings - Update store settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      namaToko,
      alamat,
      telepon,
      email,
      logo,
      footerStruk,
      printerSize,
      autoLogoutMenit,
      qrisImage,
      rekeningBank,
    } = body;

    // Validate required fields
    if (!namaToko || namaToko.trim() === '') {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Nama toko harus diisi' },
      }, { status: 400 });
    }

    // Get existing settings or create new
    let settings = await prisma.pengaturanToko.findFirst();

    const updateData: Record<string, unknown> = {};

    if (namaToko !== undefined) updateData.namaToko = namaToko;
    if (alamat !== undefined) updateData.alamat = alamat || '';
    if (telepon !== undefined) updateData.telepon = telepon || '';
    if (email !== undefined) updateData.email = email || '';
    if (logo !== undefined) updateData.logo = logo || null;
    if (footerStruk !== undefined) updateData.footerStruk = footerStruk || '';
    if (printerSize !== undefined) updateData.printerSize = printerSize;
    if (autoLogoutMenit !== undefined) updateData.autoLogoutMenit = autoLogoutMenit;
    if (qrisImage !== undefined) updateData.qrisImage = qrisImage || null;
    if (rekeningBank !== undefined) {
      updateData.rekeningBank = JSON.stringify(rekeningBank);
    }

    if (settings) {
      settings = await prisma.pengaturanToko.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.pengaturanToko.create({
        data: {
          namaToko: namaToko || 'GuGaramKu',
          alamat: alamat || '',
          telepon: telepon || '',
          email: email || '',
          logo: logo || null,
          footerStruk: footerStruk || 'Terima kasih telah berbelanja',
          printerSize: printerSize || '58mm',
          autoLogoutMenit: autoLogoutMenit || 30,
          qrisImage: qrisImage || null,
          rekeningBank: JSON.stringify(rekeningBank || []),
        },
      });
    }

    // Parse rekening bank for response
    let parsedRekeningBank = [];
    try {
      parsedRekeningBank = JSON.parse(settings.rekeningBank || '[]');
    } catch {
      parsedRekeningBank = [];
    }

    const data = {
      id: settings.id,
      namaToko: settings.namaToko,
      alamat: settings.alamat,
      telepon: settings.telepon,
      email: settings.email,
      logo: settings.logo,
      footerStruk: settings.footerStruk,
      printerSize: settings.printerSize,
      autoLogoutMenit: settings.autoLogoutMenit,
      qrisImage: settings.qrisImage,
      rekeningBank: parsedRekeningBank,
      updatedAt: settings.updatedAt.toISOString(),
    };

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating settings:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal menyimpan pengaturan',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

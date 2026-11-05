import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { newPassword } = body;

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password minimal 6 karakter' },
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Karyawan tidak ditemukan' },
      }, { status: 404 });
    }

    // Update password (in production, should be hashed)
    await prisma.user.update({
      where: { id: params.id },
      data: { password: newPassword }, // TODO: Hash password in production
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Password berhasil direset' },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error resetting password:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Gagal mereset password',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

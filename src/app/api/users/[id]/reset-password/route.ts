import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { logActivity } from '@/lib/audit-log';
import { parseBody } from '@/lib/validation/parse';
import { resetPasswordSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
    const authResult = await requireAuth(['OWNER']);
    if (!authResult.ok) return authResult.response;
  try {
    const body = await request.json();

    const parsed = parseBody(resetPasswordSchema, body);
    if (!parsed.ok) return parsed.response;

    const { newPassword: password } = parsed.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Karyawan tidak ditemukan' },
      }, { status: 404 });
    }

    // Hash password baru sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { id: id },
      data: { password: hashedPassword },
    });

    await logActivity({
      userId: authResult.user.id,
      aksi: 'PASSWORD_RESET',
      tabel: 'user',
      recordId: id,
      dataBaru: { userId: id },
      request,
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

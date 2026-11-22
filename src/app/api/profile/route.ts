import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';
import { requireAuth } from '@/lib/api-auth';
import { logActivity } from '@/lib/audit-log';
import { parseBody } from '@/lib/validation/parse';
import { updateProfileSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

const userSelect = {
  id: true,
  nama: true,
  email: true,
  role: true,
  lastLogin: true,
  createdAt: true,
  cabang: { select: { id: true, kode: true, nama: true } },
} as const;

function fail(code: string, message: string, status: number) {
  const response: ApiResponse<null> = { success: false, error: { code, message } };
  return NextResponse.json(response, { status });
}

// GET /api/profile - Profil user yang sedang login
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const user = await prisma.user.findUnique({
    where: { id: authResult.user.id },
    select: userSelect,
  });

  if (!user) return fail('NOT_FOUND', 'Pengguna tidak ditemukan', 404);

  const response: ApiResponse<typeof user> = { success: true, data: user };
  return NextResponse.json(response);
}

// PUT /api/profile - Ubah nama, email, password, dan PIN sendiri
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const parsed = parseBody(updateProfileSchema, await request.json());
    if (!parsed.ok) return parsed.response;

    const { nama, email, currentPassword, newPassword, pin } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { id: authResult.user.id } });
    if (!existing) return fail('NOT_FOUND', 'Pengguna tidak ditemukan', 404);
    if (!existing.isActive) return fail('FORBIDDEN', 'Akun tidak aktif. Hubungi administrator.', 403);

    if (!currentPassword || !(await bcrypt.compare(currentPassword, existing.password))) {
      return fail('INVALID_PASSWORD', 'Password saat ini salah', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailOwner = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (emailOwner && emailOwner.id !== existing.id) {
      return fail('DUPLICATE_ERROR', 'Email sudah digunakan', 409);
    }

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        nama: nama.trim(),
        email: normalizedEmail,
        ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
        ...(pin !== undefined ? { pin: pin ? await bcrypt.hash(pin, 10) : null } : {}),
      },
      select: userSelect,
    });

    await logActivity({
      userId: existing.id,
      aksi: 'USER_UPDATE',
      tabel: 'user',
      recordId: existing.id,
      dataBaru: { nama: user.nama, email: user.email },
      request,
    });

    const response: ApiResponse<typeof user> = { success: true, data: user };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating profile:', error);
    return fail('INTERNAL_ERROR', 'Gagal menyimpan profil', 500);
  }
}

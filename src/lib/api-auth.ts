import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

export interface AuthUser {
  id: string;
  role: string;
  cabangId: string | null;
}

type RequireAuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

function unauthorized(): RequireAuthResult {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Tidak terautentikasi. Silakan login terlebih dahulu.',
    },
  };
  return { ok: false, response: NextResponse.json(response, { status: 401 }) };
}

function forbidden(): RequireAuthResult {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Akses ditolak untuk role Anda.',
    },
  };
  return { ok: false, response: NextResponse.json(response, { status: 403 }) };
}

function accountInactive(): RequireAuthResult {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'ACCOUNT_INACTIVE',
      message: 'Akun tidak aktif. Hubungi administrator.',
    },
  };
  return { ok: false, response: NextResponse.json(response, { status: 403 }) };
}

/**
 * Wajibkan session login (dan opsional role tertentu) di route handler.
 * Selalu membaca ulang role/isActive/cabangId dari DB: token JWT tidak
 * direfresh real-time, jadi user yang dinonaktifkan atau diganti role-nya
 * langsung kehilangan akses tanpa menunggu session berakhir.
 * Contoh:
 *   const authResult = await requireAuth();
 *   if (!authResult.ok) return authResult.response;
 *   const user = authResult.user;
 */
export async function requireAuth(roles?: string[]): Promise<RequireAuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true, cabangId: true },
  });

  if (!dbUser) {
    return unauthorized();
  }

  if (!dbUser.isActive) {
    return accountInactive();
  }

  const user: AuthUser = {
    id: session.user.id,
    role: dbUser.role,
    cabangId: dbUser.cabangId,
  };

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return forbidden();
  }

  return { ok: true, user };
}

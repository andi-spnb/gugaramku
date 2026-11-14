import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
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

/**
 * Wajibkan session login (dan opsional role tertentu) di route handler.
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

  const user: AuthUser = {
    id: session.user.id,
    role: session.user.role,
    cabangId: session.user.cabangId ?? null,
  };

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return forbidden();
  }

  return { ok: true, user };
}

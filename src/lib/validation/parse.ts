import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';
import type { ApiResponse } from '@/types';

/**
 * Parse & validasi body request dengan schema Zod.
 * Mengembalikan hasil validasi atau response 400 siap pakai.
 *
 * Contoh:
 *   const parsed = parseBody(createUserSchema, body);
 *   if (!parsed.ok) return parsed.response;
 *   // parsed.data: sudah tervalidasi & bertipe
 */
export function parseBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.issues[0]?.message || 'Data tidak valid',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
    return { ok: false, response: NextResponse.json(response, { status: 400 }) };
  }
  return { ok: true, data: result.data };
}

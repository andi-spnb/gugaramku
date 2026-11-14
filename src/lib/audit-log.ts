import type { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';

export type AuditAksi =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_GAGAL'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'PASSWORD_RESET'
  | 'BRANCH_CREATE'
  | 'BRANCH_UPDATE'
  | 'BRANCH_DELETE'
  | 'STOCK_ADJUSTMENT'
  | 'KAS_MASUK'
  | 'KAS_KELUAR'
  | 'DEBT_PAY'
  | 'RETUR_CREATE'
  | 'SETTINGS_UPDATE'
  | 'TRANSAKSI_CREATE'
  | 'TRANSAKSI_HOLD'
  | 'HOLD_DELETE';

interface LogActivityParams {
  userId: string;
  aksi: AuditAksi;
  tabel: string;
  recordId?: string | null;
  dataLama?: unknown;
  dataBaru?: unknown;
  request?: NextRequest;
}

/**
 * Catat aktivitas ke tabel LogAktivitas (audit trail).
 * Fire-and-forget: kegagalan logging tidak boleh menggagalkan request utama.
 */
export async function logActivity({
  userId,
  aksi,
  tabel,
  recordId,
  dataLama,
  dataBaru,
  request,
}: LogActivityParams): Promise<void> {
  try {
    const userAgent = request?.headers.get('user-agent') || null;
    // Ambil IP dari header proxy umum (best-effort di belakang reverse proxy)
    const forwardedFor = request?.headers.get('x-forwarded-for');
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() ||
      request?.headers.get('x-real-ip') ||
      null;

    await prisma.logAktivitas.create({
      data: {
        userId,
        aksi,
        tabel,
        recordId: recordId || null,
        dataLama:
          dataLama === undefined ? null : JSON.stringify(dataLama, replacerSafe),
        dataBaru:
          dataBaru === undefined ? null : JSON.stringify(dataBaru, replacerSafe),
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit log tidak boleh menggagalkan operasi utama
    console.error('Gagal mencatat log aktivitas:', error);
  }
}

/** Hapus field sensitif sebelum menyimpan snapshot data */
function replacerSafe(_key: string, value: unknown) {
  if (typeof value === 'string' && value.length > 500) {
    return value.slice(0, 500);
  }
  return value;
}

import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

/**
 * Jalankan $transaction dengan retry untuk error P2002 (unique constraint).
 *
 * Dipakai oleh generator nomor transaksi/HOLD yang read-then-write: dua kasir
 * yang submit bersamaan bisa menghasilkan nomor yang sama — yang kalah menerima
 * P2002 dan seluruh transaksinya di-rollback. Retry mengambil nomor terbaru dan
 * mengulang dari awal (cek idempotency clientRef & stok ikut diulang, aman).
 */
export async function withTransactionRetry<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(fn);
    } catch (error) {
      const isP2002 =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (isP2002 && attempt < maxAttempts) continue;
      throw error;
    }
  }
}

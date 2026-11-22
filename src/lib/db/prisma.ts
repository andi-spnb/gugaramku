import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Field uang & qty memakai Decimal di DB (tepat secara desimal, tidak seperti
 * Float). Tanpa patch ini, decimal.js menserialisasi Decimal sebagai STRING
 * di response JSON dan mengubah kontrak API. Kita konversi ke number agar
 * frontend tetap menerima angka seperti sebelumnya.
 *
 * Aman dari kehilangan presisi: Decimal(14,2) maks ~9,99 x 10^12, jauh di
 * bawah 2^53 (batas aman number JS).
 */
const decimalProto = Prisma.Decimal.prototype as unknown as {
  toJSON: (this: Prisma.Decimal) => number;
};
decimalProto.toJSON = function (this: Prisma.Decimal) {
  return Number(this);
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

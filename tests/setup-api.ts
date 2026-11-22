import { execSync } from 'child_process';

/**
 * Setup khusus test integrasi API.
 * Dipakai via `setupFiles` di vitest.config.ts — berjalan SEBELUM modul test
 * di-import, sehingga PrismaClient (yang membaca DATABASE_URL saat instansiasi)
 * terhubung ke DB test, bukan dev.db.
 */
process.env.DATABASE_URL = 'file:./test-api.db';

// Pastikan schema sudah ter-push ke DB test (idempotent).
execSync('npx prisma db push --skip-generate', {
  cwd: process.cwd(),
  stdio: 'ignore',
  env: { ...process.env, DATABASE_URL: 'file:./test-api.db' },
});

import { execSync } from 'child_process';
import { resolveTestUrl } from './test-db-url';

/**
 * Global setup vitest: dijalankan SEKALI per test run (sebelum worker spawn),
 * bukan per file — menghindari race beberapa `prisma db push` bersamaan.
 */
export default function globalSetup() {
  const testUrl = resolveTestUrl();

  // Pastikan schema DB test sinkron dengan schema.prisma (idempotent).
  // db push otomatis membuat database bila belum ada.
  execSync('npx prisma db push --skip-generate', {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}

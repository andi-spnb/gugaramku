import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * URL database test diturunkan dari DATABASE_URL di .env dengan mengganti
 * nama database menjadi `<nama>_test`. Kredensial tidak di-hardcode di repo.
 * PostgreSQL harus berjalan (lihat DEPLOY.md).
 */
export function resolveTestUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('_test')) {
    return process.env.DATABASE_URL;
  }

  const envPath = resolve(process.cwd(), '.env');
  let baseUrl: string;
  try {
    const env = readFileSync(envPath, 'utf-8');
    const match = env.match(/^DATABASE_URL="?([^"\r\n]+)"?/m);
    if (!match) throw new Error('tidak ditemukan');
    baseUrl = match[1];
  } catch {
    throw new Error(
      'DATABASE_URL tidak ditemukan di .env — test integrasi butuh PostgreSQL (lihat DEPLOY.md)'
    );
  }

  // postgresql://user:pass@host:port/dbname?schema=public → dbname_test
  return baseUrl.replace(
    /\/([^/]+?)(\?.*)?$/,
    (_m, db: string, q?: string) => `/${db.endsWith('_test') ? db : db + '_test'}${q ?? ''}`
  );
}

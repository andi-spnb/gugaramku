import { resolveTestUrl } from './test-db-url';

/**
 * Setup per test file: arahkan PrismaClient ke DB test SEBELUM modul test
 * di-import. Schema sudah dipush oleh tests/global-setup.ts.
 */
process.env.DATABASE_URL = resolveTestUrl();

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup-api.ts'],
    // Semua file test API memakai satu DB test yang sama (pembersihan di
    // beforeEach) — file harus jalan berurutan agar tidak saling hapus data.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

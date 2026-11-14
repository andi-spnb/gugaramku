import { describe, it, expect } from 'vitest';
import {
  formatRupiah,
  parseRupiah,
  formatTanggal,
  capitalize,
  truncate,
  isEmpty,
  safeJsonParse,
  getInitials,
  formatNumber,
  calculatePercentage,
  formatPercentage,
} from '@/lib/utils';

describe('formatRupiah', () => {
  it('memformat angka bulat', () => {
    expect(formatRupiah(15000)).toBe('Rp 15.000');
  });

  it('memformat tanpa simbol', () => {
    expect(formatRupiah(15000, { showSymbol: false })).toBe('15.000');
  });

  it('menampilkan desimal bila diminta', () => {
    expect(formatRupiah(15000.5, { showDecimal: true })).toBe('Rp 15.000,50');
  });

  it('null/undefined menghasilkan Rp 0', () => {
    expect(formatRupiah(null)).toBe('Rp 0');
    expect(formatRupiah(undefined)).toBe('Rp 0');
  });

  it('string non-numerik menghasilkan Rp 0', () => {
    expect(formatRupiah('abc')).toBe('Rp 0');
  });

  it('menerima string numerik', () => {
    expect(formatRupiah('15000')).toBe('Rp 15.000');
  });
});

describe('parseRupiah', () => {
  it('parse "Rp 15.000"', () => {
    expect(parseRupiah('Rp 15.000')).toBe(15000);
  });

  it('parse string kosong menghasilkan 0', () => {
    expect(parseRupiah('')).toBe(0);
  });

  it('parse teks tidak valid menghasilkan 0', () => {
    expect(parseRupiah('abc')).toBe(0);
  });
});

describe('formatTanggal', () => {
  it('memformat tanggal Indonesia', () => {
    const hasil = formatTanggal('2026-01-15T00:00:00.000Z');
    expect(hasil).toBeTruthy();
    expect(typeof hasil).toBe('string');
  });
});

describe('capitalize', () => {
  it('kapitalisasi huruf pertama', () => {
    expect(capitalize('garam')).toBe('Garam');
  });

  it('string kosong tetap kosong', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('truncate', () => {
  it('memotong string panjang', () => {
    expect(truncate('garam beryodium', 6)).toBe('garam ...');
  });

  it('string pendek tidak dipotong', () => {
    expect(truncate('garam', 10)).toBe('garam');
  });
});

describe('isEmpty', () => {
  it('deteksi kosong', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('nilai terisi tidak kosong', () => {
    expect(isEmpty('a')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });
});

describe('safeJsonParse', () => {
  it('parse JSON valid', () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}', { a: 0 })).toEqual({ a: 1 });
  });

  it('JSON tidak valid menghasilkan fallback', () => {
    expect(safeJsonParse('bukan json', { a: 0 })).toEqual({ a: 0 });
  });
});

describe('getInitials', () => {
  it('inisial nama dua kata', () => {
    expect(getInitials('Budi Santoso')).toBe('BS');
  });

  it('nama satu kata', () => {
    expect(getInitials('Budi')).toBe('BU');
  });
});

describe('formatNumber', () => {
  it('memformat angka dengan pemisah ribuan', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('null menghasilkan 0', () => {
    expect(formatNumber(null)).toBe('0');
  });
});

describe('calculatePercentage', () => {
  it('hitung persentase', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
  });

  it('total 0 menghasilkan 0', () => {
    expect(calculatePercentage(25, 0)).toBe(0);
  });
});

describe('formatPercentage', () => {
  it('memformat persentase (default 1 desimal, titik desimal)', () => {
    expect(formatPercentage(25.555)).toBe('25.6%');
  });

  it('custom desimal', () => {
    expect(formatPercentage(25.555, 2)).toBe('25.55%');
  });
});

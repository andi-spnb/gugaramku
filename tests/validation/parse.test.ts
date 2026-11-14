import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseBody } from '@/lib/validation/parse';

const schema = z.object({
  nama: z.string().min(1, 'Nama harus diisi'),
  umur: z.number().positive('Harus lebih dari 0'),
});

describe('parseBody', () => {
  it('mengembalikan ok=true dan data untuk input valid', () => {
    const result = parseBody(schema, { nama: 'Budi', umur: 25 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ nama: 'Budi', umur: 25 });
    }
  });

  it('mengembalikan ok=false dengan response 400 untuk input tidak valid', async () => {
    const result = parseBody(schema, { nama: '', umur: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(json.error.details)).toBe(true);
      expect(json.error.details.length).toBeGreaterThan(0);
    }
  });

  it('menyertakan field path pada detail error', async () => {
    const result = parseBody(schema, { umur: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const json = await result.response.json();
      const fields = json.error.details.map((d: { field: string }) => d.field);
      expect(fields).toContain('nama');
      expect(fields).toContain('umur');
    }
  });

  it('menangani input non-object (null)', () => {
    const result = parseBody(schema, null);
    expect(result.ok).toBe(false);
  });

  it('menangani input berupa array', () => {
    const result = parseBody(schema, [1, 2, 3]);
    expect(result.ok).toBe(false);
  });
});

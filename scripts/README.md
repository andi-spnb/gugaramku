# E2E & Lockout Test GuGaramKu

Test suite regresi manual via HTTP (PowerShell, tanpa dependensi tambahan).

## Persiapan

```powershell
npm run dev          # terminal 1
npx prisma db seed   # pastikan data demo ada
```

## Menjalankan

```powershell
powershell -ExecutionPolicy Bypass -File scripts\e2e-test.ps1
powershell -ExecutionPolicy Bypass -File scripts\lockout-test.ps1
```

## Yang diuji (e2e-test.ps1)

| Test | Skenario | Hasil diharapkan |
| --- | --- | --- |
| T4 | Transaksi qty melebihi stok | 400 STOCK_INSUFFICIENT |
| T5 | TUNAI bayar kurang dari total | 400 VALIDATION_ERROR |
| T6 | HUTANG tanpa pelanggan | 400 VALIDATION_ERROR |
| T7 | Client mengirim harga Rp 1 | Server pakai harga DB |
| T8 | Stok berkurang sesuai qty | stok -1 |
| T9/T10 | Retur lalu retur ulang item sama | Retur ke-2 ditolak |
| T11 | HUTANG + bayar hutang TUNAI | Saldo kas bertambah |
| T12 | Bayar hutang melebihi sisa | 400 OVERPAYMENT |
| T13 | Hold transaksi + hapus hold | Sukses |
| T14 | 5x login gagal lalu login benar | Lockout 15 menit |

## Catatan penting

- Test T14 (rate limit) **mengunci email demo selama 15 menit**. Restart dev server
  untuk reset lockout sebelum test manual lain.
- Di dev mode, T14 bisa false-fail jika Next.js cold-compile route di tengah script
  (module state reset). Jalankan ulang sekali lagi (server sudah warm) atau verifikasi
  lewat `scripts\lockout-test.ps1` yang self-contained.
- `kasirId`/`cabangId` tidak dikirim dari client: server selalu memakai session.

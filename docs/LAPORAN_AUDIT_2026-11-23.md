# 🚨 LAPORAN AUDIT PRA-GO-LIVE — GuGaramKu

> Tanggal audit: 23 November 2026
> Metode: review kode penuh (security, logika bisnis API, kesiapan deploy) + build test + dependency audit + pemeriksaan git history.
> Setiap temuan diverifikasi langsung ke source code dengan bukti `file:line`. Tidak ada asumsi.

## VERDICT

**BELUM SIAP di publikasikan ke owner.** Ada 7 temuan KRITIS yang wajib diperbaiki sebelum go-live. Semuanya menyentuh angka uang atau memblokir deploy.

| Status | Jumlah |
|---|---|
| 🔴 KRITIS (blokir go-live) | 7 |
| 🟠 TINGGI (perbaiki sebelum/bersamaan go-live) | 11 |
| 🟡 SEDANG | 13 |
| 🟢 RENDAH | 10+ |

## STATUS PERBAIKAN (diperbarui 23 November 2026)

| Temuan | Status | Verifikasi |
|---|---|---|
| K1 laba multi-satuan | ✅ fix | test integrasi: laba jual 1 Dos = Rp15.000 |
| K2 quick sale anti-fraud | ✅ fix | test: quick sale dgn produk terdaftar ditolak 400, stok utuh |
| K3 idempotency offline | ✅ fix | test: payload sama 2x = 1 transaksi, stok terpotong sekali |
| K4 PostgreSQL + migrations | ✅ fix | provider postgresql, baseline `20261122232505_init`, migrate dev+deploy siap |
| K5 guard seed + create-owner | ✅ fix | NODE_ENV=production → seed exit 1; `npm run create-owner` password acak |
| K6 kas read-write race | ✅ fix | test: 3 penjualan bersamaan → saldo Rp10.500 & rantai mutasi konsisten |
| K7 Next.js advisory | ✅ fix | next 14.2.35 → 16.4.6, `npm audit` 0 vulnerabilities; remotePatterns wildcard dihapus |
| T1 QRIS/TRANSFER lunas | ✅ fix | test: QRIS Rp0 ditolak |
| T2 retur hutang | ✅ fix | test: refund dikredit ke hutang, kas utuh |
| T3 race overpayment | ✅ fix | test: 2 bayar bersamaan → 1 sukses 1 ditolak |
| T4 guard cabang null | ✅ fix | test: user tanpa cabang / cabang lain ditolak 403 (pay hutang & hapus HOLD) |
| T5 race stock adjustment | ✅ fix | test: adjustment + penjualan bersamaan → stok 104 (tidak saling menimpa); opname pakai optimistic lock |
| T7 race nomor transaksi | ✅ fix | test: 3 transaksi bersamaan → nomor unik semua tanpa 500 (retry P2002) |
| T9–T11 | ⬜ belum | batch 4 |
| T8 Float → Decimal | ✅ fix | uang Decimal(14,2), qty Decimal(14,3); 29 titik aritmetika dibenahi; JSON tetap number |

---

## 🔴 KRITIS — wajib diperbaiki sebelum go-live

### K1. Laporan laba SALAH untuk penjualan multi-satuan
- **Lokasi**: `src/app/api/transactions/route.ts:149`
- **Bukti**: `laba: (hargaJual - hargaModal) * item.jumlah - item.diskon` — `hargaModal` diambil per satuan dasar (baris 128: `satuan.produk.hargaModal`), `konversi` tersedia (baris 129) tapi tidak dipakai di rumus laba.
- **Dampak**: jual 1 Dos Indomie (isi 40 bks, modal Rp3.000/bks, jual Rp135.000/Dos) tercatat laba Rp132.000, padahal laba benar Rp15.000. Semua laporan laba dan dashboard menggelembung. Ini POS: angka laba adalah angka yang dilihat owner tiap hari.
- **Fix**: `laba: (hargaJual - hargaModal * konversi) * item.jumlah - item.diskon`. Pola sama di quick sale (baris 114) dan `transactions/hold/route.ts:56`.

### K2. `isQuickSale` dipercaya dari client — barang terdaftar bisa "dijual" tanpa potong stok
- **Lokasi**: `src/app/api/transactions/route.ts:90-119` dan `:202`
- **Bukti**: `if (item.isQuickSale)` langsung dipercaya tanpa cek produk benar-benar tidak terdaftar; harga boleh 0 (`hargaJual < 0` yang ditolak, baris 94); potongan stok diskip: `if (item.isQuickSale || !item.produkId) continue;` (baris 202).
- **Dampak**: siapa pun dengan session kasir bisa mengirim item produk asli dengan `isQuickSale: true, hargaJual: 0` → transaksi selesai Rp0, stok tidak berkurang, barang keluar tanpa jejak. Celah fraud langsung.
- **Fix**: server tolak `isQuickSale: true` yang masih membawa `produkId`/`produkSatuanId` valid (cek ke DB), dan harga quick sale wajib > 0.

### K3. Retry offline tanpa idempotency: transaksi ganda & stok terpotong dua kali
- **Lokasi**: `src/app/(dashboard)/kasir/kasir-page.tsx:622-637`, `src/lib/offline/queue.ts:12-20`
- **Bukti**: `catch (error)` meng-enqueue SEMUA error, lalu retry mengirim payload sama. Tidak ada `clientRef`/idempotency key, POST /api/transactions tidak mengecek duplikat.
- **Dampak**: (a) request sukses di server tapi responsnya timeout → masuk antrean → dikirim ulang → 2 transaksi, stok terpotong 2x; (b) error bisnis 400 (stok kurang, limit hutang) ikut masuk antrean dan "sukses" saat retry, padahal kasir sudah diasuh gagal.
- **Fix**: tambahkan `clientRef` (UUID) + unique constraint di Transaksi + cek di dalam `$transaction`; error 4xx tidak di-enqueue (hanya network error/5xx).

### K4. Prisma masih `provider = "sqlite"` dan TIDAK ADA folder migrations
- **Lokasi**: `prisma/schema.prisma:9`, folder `prisma/` hanya berisi `dev.db`, `schema.prisma`, `seed.ts`
- **Bukti**: `provider = "sqlite"`; `.env:3` memakai `DATABASE_URL=file:./dev.db`; `git ls-files prisma` tidak memuat migrations. `.gitignore:50` bahkan meng-ignore migration lock.
- **Dampak**: di VPS dengan PostgreSQL, semua query gagal. `npm run build && npm start` di VPS baru = aplikasi hidup dengan 0 tabel, semua API 500 saat runtime (build tidak butuh DB, jadi kegagalan baru terlihat setelah go-live).
- **Fix**: ganti `provider = "postgresql"`, buat baseline migrasi (`prisma migrate dev --name init`), commit folder `migrations/`, dan tambahkan `prisma migrate deploy` ke pipeline start.

### K5. Seed membuat/mereSET akun Owner dengan password publik
- **Lokasi**: `prisma/seed.ts:10-15`, `:36`, `:53`, `:70`, `:400-409`
- **Bukti**: `bcrypt.hash('owner123', 10)` dst. dengan PIN `1111/2222/1234`, dan upsert memakai `update: { password, pin }` — setiap kali `prisma db seed` dijalankan, password akun existing di-RESET ke nilai demo.
- **Dampak**: siapa pun yang tahu pola ini (passwordnya tercetak di console dan ter-commit di GitHub) login sebagai OWNER: full akses lintas cabang, reset password semua staf.
- **Fix**: jangan jalankan seed di production; tambahkan guard `NODE_ENV=production` di `seed.ts`; buat akun owner pertama lewat script one-off dengan password acak.

### K6. Saldo kas di-update read-then-write, bukan atomik — saldo bisa diam-diam salah
- **Lokasi**: `src/app/api/transactions/route.ts:311-321`; pola sama di `debts/[id]/pay/route.ts:84-95`, `kas/in/route.ts:47-92`, `kas/out/route.ts:47-97`
- **Bukti**: `const newSaldo = Number(kas.saldo) + total; await tx.kas.update({ data: { saldo: newSaldo } })`
- **Dampak**: dua penjualan tunai bersamaan membaca saldo yang sama, satu tulisan tertimpa → saldo kas dan `saldoSesudah` mutasi tidak konsisten. Selisih kas muncul tanpa jejak.
- **Fix**: pakai `tx.kas.update({ data: { saldo: { increment: total } } })`, lalu baca ulang saldo untuk `saldoSebelum/saldoSesudah`.

### K7. Next.js 14.2.35 terkena 20+ advisory (3 critical) tanpa patch di jalur 14.x
- **Lokasi**: `package.json:51` (`next: 14.2.35`)
- **Bukti**: `npm audit`: `next <=16.3.0-preview.10` vulnerable — termasuk DoS via Image Optimizer (GHSA-9g9p-9gw9-jx7f), request smuggling via rewrites (GHSA-ggv3-7p47-pfv8), cache poisoning RSC, SSRF via WebSocket upgrade, XSS. Total repo: **17 vulnerabilities (3 critical, 9 high, 5 moderate)**.
- **Dampak**: aplikasi POS yang di-expose ke internet memakai server dengan advisory critical yang belum dipatch.
- **Fix**: upgrade Next.js ke jalur yang sudah patch (16.3.1+, artinya major upgrade: React 19, next-auth beta perlu dicek), atau minimal `images.remotePatterns` wildcard `**.gugaramku.com` di `next.config.js:8-13` dihapus dulu (mengurangi permukaan DoS Image Optimizer). Jalankan `npm audit` lagi setelah upgrade.

---

## 🟠 TINGGI

| # | Temuan | Lokasi | Dampak singkat |
|---|---|---|---|
| T1 | QRIS/TRANSFER boleh dibayar Rp0, transaksi tetap SELESAI | `transactions/route.ts:169-173` | Hanya TUNAI yang dicek `jumlahBayar < total`; barang ratusan ribu tercatat lunas Rp0 |
| T2 | Retur transaksi HUTANG tidak menyentuh tabel Hutang | `retur/route.ts` (0 referensi hutang di seluruh file) | Barang kembali + kas keluar, hutang tetap tertagih penuh → rugi ganda |
| T3 | Race pembayaran hutang: overpayment lolos | `debts/[id]/pay/route.ts:29-54` | Dua bayar bersamaan sama-sama baca `sisa` lama → terbayar 2x |
| T4 | Bypass cek cabang saat `cabangId` user null | `debts/[id]/pay/route.ts:39-44`, `transactions/hold/[id]/route.ts:48` | User tanpa cabang bisa bayar hutang / hapus HOLD cabang mana pun. Fix: `if (!user.cabangId \|\| ...) throw` |
| T5 | Race stock adjustment read-modify-write | `stock/adjustment/route.ts:40-82` | Adjustment bersamaan penjualan → nilai adjustment menimpa hasil decrement penjualan |
| T6 | Laporan memuat semua baris tanpa batas | `reports/sales/route.ts:54-79`, `reports/top-products/route.ts:55-74`, `stock/route.ts:47-97` | Di 100k transaksi: response ratusan MB, OOM/timeout. Agregasi harus pindah ke SQL `groupBy` |
| T7 | Nomor transaksi read-then-write | `transactions/route.ts:233-239`, `hold/route.ts:77-84` | Dua kasir bersamaan → satu kena P2002 → HTTP 500 |
| T8 | Semua field uang & stok bertipe Float | `prisma/schema.prisma` (89, 137, 207-212, 309, 346-350, dll) | `double precision` di PostgreSQL: kembalian/saldo bisa `34999.999999996`. Uang wajib `Decimal(14,2)` atau Int rupiah |
| T9 | Rate limit login in-memory, rencana deploy PM2 cluster 2 instance | `src/lib/auth.ts:11-17` | Tiap worker punya Map sendiri (efektif 10 percobaan), restart menghapus lockout. Pindah ke Redis/tabel DB |
| T10 | Tidak ada mekanisme backup sama sekali | `scripts/` hanya berisi test E2E PowerShell | Kegagalan disk = hilang seluruh riwayat penjualan. Wajib `pg_dump` cron + uji restore |
| T11 | Socket.io tidak diimplementasi (hanya `socket.io-client` di package.json) | `package.json:57`; grep `socket` di `src/` = 0 hasil | Fitur realtime sync antar device yang dijanjikan arsitektur tidak ada; `NEXT_PUBLIC_SOCKET_URL` variabel mati |

## 🟡 SEDANG (ringkas)

| # | Temuan | Lokasi |
|---|---|---|
| S1 | PUT produk partial update merusak data: `barcode: barcode \|\| null` menghapus barcode, delete-recreate `produkSatuan` memutus FK historis, `satuan!.length` → 500 bila tidak dikirim | `products/[id]/route.ts:160-196` |
| S2 | Zod dilewati: `body.satuan` dibaca mentah, bukan `parsed.data.satuan` | `products/route.ts:75`, `products/[id]/route.ts:182` |
| S3 | Penjualan tunai tidak tercatat ke kas bila row Kas cabang belum ada (tidak ada upsert) | `transactions/route.ts:310-338` |
| S4 | Stok awal produk tidak dicatat di StokMutasi (audit trail stok bolong) | `products/route.ts:92-101` |
| S5 | "Proteksi rugi" hanya `window.confirm` di client; server tidak menolak harga di bawah modal; quick sale menerima `hargaModal` dari client | `product-form-dialog.tsx:274-284`, `schemas.ts:151-161` |
| S6 | Shift kasir: model `Shift` ada di schema, tidak ada satu pun route API — fitur belum diimplementasi (dead schema) | `prisma/schema.prisma:342-365`, `kasir-page.tsx:725` |
| S7 | `/forgot-password` di publicRoutes tapi halamannya tidak ada (404 publik); SMTP tidak diimplementasi (5 variabel env mati) | `middleware.ts:5`, `.env.example:36-40` |
| S8 | 6 variabel `.env.example` tidak pernah dipakai kode (`NEXT_PUBLIC_APP_NAME`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `NEXT_PUBLIC_SOCKET_URL`, `SMTP_*`) | `.env.example` |
| S9 | OWNER bisa reset password/ubah PIN user lain tanpa masukkan password sendiri (session dicuri = takeover semua akun) | `users/[id]/route.ts:79-140`, `reset-password/route.ts:17-46` |
| S10 | Field `gambar`, `qrisImage`, `referensiTipe/Id` dibaca dari body mentah di luar Zod tanpa cek URL/panjang, dirender sebagai `<img src>` | `products/[id]/route.ts:119-120`, `kas/in/route.ts:38-41`, `schemas.ts:298,307` |
| S11 | Qty retur wajib bulat padahal qty transaksi boleh pecahan (jual 0,5 kg tak bisa diretur 0,5 kg) | `schemas.ts:213-216` vs `:232` |
| S12 | `next.config.js` tanpa `output: 'standalone'`, tanpa HSTS/CSP | `next.config.js:2-59` |
| S13 | 57 pemanggilan `console.*` tanpa logger terstruktur; P2002 & malformed JSON mengembalikan 500 generik | seluruh `src/` |

## 🟢 RENDAH (ringkas)

`limit` GET tidak di-cap di 8 endpoint (`?limit=1000000` memuat semua); timing side-channel enumerasi email di login (`auth.ts:96-100`); IP audit log dari header `XFF` yang bisa dipalsukan (`audit-log.ts:51-55`); kasir bisa hapus HOLD kasir lain (`hold/[id]/route.ts:14-62`); kasir bisa lihat `hargaModal` & filter transaksi kasir lain; hard delete produk menghapus riwayat mutasi (`products/[id]/route.ts:321-326`); HOLD tanpa pagination/expire; `DEMO_CABANG_ID` masih dikirim dari form produk (`product-form-dialog.tsx:28`); audit log fire-and-forget; kembalian dihitung client, bisa beda dengan server (`kasir-page.tsx:612`).

---

## ✅ Yang sudah aman (terverifikasi)

- **Tidak ada SQL injection**: 0 penggunaan `$queryRaw`/`$executeRaw` di seluruh `src/`.
- **IDOR**: 26 route handler dicek satu per satu — semua memanggil `requireAuth` dan mengecek `cabangId` dari session (kecuali bypass T4). `requireAuth` membaca ulang role/`isActive` dari DB setiap request, tidak percaya JWT.
- **`.env` tidak pernah masuk git history** (dicek `git log --all -- .env` = kosong); `prisma/dev.db` juga tidak ter-track. Tidak ada secret di `src/`.
- **Build sehat**: `next build` sukses (18 halaman), `tsc --noEmit` sukses, ESLint 0 warning, 76 unit test pass.
- **Potongan stok penjualan sudah atomik** (`updateMany` + `jumlah: { gte }`, `transactions/route.ts:204-213`) — bagian ini benar.

## ⚠️ Realitas test coverage

76 unit test yang pass **hanya** menguji format rupiah/tanggal dan schema Zod. **Nol test** untuk: POST transaksi (potong stok, nomor, kas, hutang), retur, pembayaran hutang, kas, adjustment, laporan, auth. Script `test:e2e` (Playwright) ada di package.json tapi **tidak ada `playwright.config.*` maupun folder e2e**. Klaim "E2E regresi" di commit lama merujuk ke script PowerShell manual (`scripts/e2e-test.ps1`), bukan suite otomatis.

## 📋 Urutan perbaikan yang disarankan

1. ~~**K1, K2, K3, T1, T2, T3**~~ — ✅ SELESAI (batch 1): +15 test integrasi (91 total pass).
2. ~~**K4 + T8 + K5**~~ — ✅ SELESAI (batch 2): PostgreSQL + baseline migrasi `20261122232505_init`, Decimal(14,2)/Decimal(14,3), guard seed, `npm run create-owner`. Test integrasi kini jalan di PostgreSQL.
3. ~~**K6, T4, T5, T7**~~ — ✅ SELESAI (batch 3): kas & adjustment pakai `increment/decrement` atomik, opname pakai optimistic lock, nomor transaksi retry P2002, guard `cabangId` null. +11 test integrasi (102 total pass).
4. ~~**K7**~~ — ✅ SELESAI (batch 4): Next.js 14.2.35 → 16.4.6 (React 19, params async di 18 handler, `middleware` → `proxy`, ESLint 9 flat config), zod 3 → 4.6.7, vitest 2 → 5.1.1, hapus wildcard `images.remotePatterns`. `npm audit`: 17 (3 critical) → **0**.
5. **T6, S1, S2, S13** — performa laporan & kebersihan API.
6. **T9, T10** — Redis rate limit + backup cron (bisa jadi bagian setup VPS).
7. Sisanya (SEDANG/RENDAH) setelah go-live stabil.

---

*Laporan ini dibuat otomatis dari audit manual seluruh route handler, schema, konfigurasi, dan dependensi. Bukti berupa kutipan kode langsung; tidak ada temuan yang berdasarkan asumsi.*

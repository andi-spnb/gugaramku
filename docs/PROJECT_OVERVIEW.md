# 📋 PROJECT OVERVIEW — GUGARAMKU

## Informasi Proyek

| Item | Detail |
|------|--------|
| **Nama Aplikasi** | GuGaramKu |
| **Versi Dokumen** | 1.0 |
| **Tanggal Dibuat** | 02 November 2026 |
| **Jenis Aplikasi** | POS & Inventory Management SaaS |
| **Target Pengguna** | Toko Retail/Grosir |

---

## 1. Deskripsi Singkat

GuGaramKu adalah aplikasi Point of Sale (POS) dan Manajemen Inventory profesional yang dirancang untuk bisnis retail dan grosir. Aplikasi ini mendukung:

- Transaksi penjualan cepat dengan barcode scanner
- Sistem 4 tingkatan harga yang dipilih manual oleh kasir
- Multi-satuan per produk dengan konversi otomatis
- Mode offline dengan sinkronisasi otomatis
- Laporan laba komprehensif
- Operasional multi-cabang

---

## 2. Visi Produk

Menjadi solusi POS yang **mudah digunakan**, **andal**, dan **profesional** untuk pemilik toko campuran/kelontong di Indonesia, dengan fokus pada:

1. **Kecepatan** — Transaksi kasir maksimal 3 klik
2. **Akurasi** — Perhitungan stok dan laba yang presisi
3. **Fleksibilitas** — 4 tingkatan harga dan multi-satuan
4. **Keandalan** — Tetap berjalan meski offline
5. **Keamanan** — Proteksi rugi dan kontrol akses berbasis peran

---

## 3. Komponen Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLOUD SERVER (VPS)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐│
│  │  PostgreSQL  │  │   Next.js    │  │   Socket.io Server         ││
│  │   Database   │  │   API Server │  │   (Real-time Sync)         ││
│  └──────────────┘  └──────────────┘  └────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                │
                     Internet   │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   WEBSITE     │       │  APP OWNER    │       │ APP KARYAWAN  │
│  (Komputer)   │       │  (Android)    │       │  (Android)    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ IndexedDB     │       │ SQLite Local  │       │ SQLite Local  │
│ (Offline)     │       │ (Offline)     │       │ (Offline)     │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ FULL ACCESS   │       │ FULL ACCESS   │       │ LIMITED       │
│ (by role)     │       │ (Owner)       │       │ (Kasir)       │
└───────────────┘       └───────────────┘       └───────────────┘
```

---

## 4. Technology Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Runtime** | Node.js | 20 LTS |
| **Framework** | Next.js (App Router) | 14.x |
| **Bahasa** | TypeScript | 5.x |
| **Database** | PostgreSQL | 16.x |
| **ORM** | Prisma | 5.x |
| **UI Framework** | Tailwind CSS | 3.x |
| **UI Components** | shadcn/ui | latest |
| **State Management** | Zustand | 4.x |
| **Data Fetching** | TanStack Query | 5.x |
| **Offline Storage** | Dexie.js (IndexedDB) | 4.x |
| **Authentication** | NextAuth.js | 5.x |
| **Real-time** | Socket.io | 4.x |
| **Validation** | Zod | 3.x |
| **Forms** | React Hook Form | 7.x |
| **Charts** | Recharts | 2.x |
| **Printing** | escpos / thermal-printer | latest |
| **Mobile** | React Native (Expo) | 50.x |

---

## 5. Deployment Environment

| Komponen | Spesifikasi |
|----------|-------------|
| **Hosting** | Self-hosted VPS |
| **OS** | Ubuntu 22.04 LTS |
| **CPU** | Minimum 2 vCPU |
| **RAM** | Minimum 2 GB |
| **Storage** | Minimum 40 GB SSD |
| **Domain** | Custom domain dengan SSL |
| **Backup** | Daily automated backup |

---

## 6. Fase Pengembangan

### Fase 1 — MVP (Target: 4-6 minggu)
- [x] Arsitektur & Dokumentasi
- [ ] Setup project & database
- [ ] Autentikasi (Email/PIN)
- [ ] Manajemen Produk + Barcode
- [ ] Sistem 4 Tingkat Harga (Manual)
- [ ] Sistem Multi-Satuan
- [ ] Kasir/POS dengan pilih tingkatan harga
- [ ] Proteksi Rugi
- [ ] Pembayaran Tunai
- [ ] Cetak Struk Thermal
- [ ] Manajemen Stok Dasar
- [ ] Website Komputer

### Fase 2 — Mobile & Offline (Target: 3-4 minggu)
- [ ] App Android Owner
- [ ] App Android Karyawan
- [ ] Offline Mode
- [ ] Sinkronisasi Data
- [ ] Notifikasi Push
- [ ] Pembayaran QRIS & Transfer

### Fase 3 — Laporan (Target: 2-3 minggu)
- [ ] Dashboard Owner
- [ ] Laporan Laba
- [ ] Laporan Penjualan
- [ ] Produk Terlaris
- [ ] Export PDF/Excel
- [ ] Alert Stok

### Fase 4 — Fitur Lanjutan (Target: 3-4 minggu)
- [ ] Manajemen Pelanggan
- [ ] Sistem Hutang/Piutang
- [ ] Retur Barang
- [ ] Diskon & Promo
- [ ] Kas Masuk/Keluar
- [ ] Shift Kasir
- [ ] Log Aktivitas

### Fase 5 — Multi-Cabang (Future)
- [ ] Tambah Cabang
- [ ] Role Admin Cabang
- [ ] Laporan Multi-Cabang
- [ ] Transfer Stok Antar Cabang

---

## 7. Tim & Tanggung Jawab

| Peran | Tanggung Jawab |
|-------|----------------|
| **Software Architect** | Desain sistem, database, API |
| **Frontend Engineer** | UI/UX implementation, responsive design |
| **Backend Engineer** | API, business logic, database |
| **QA Engineer** | Testing, quality assurance |
| **DevOps** | Deployment, monitoring, backup |

---

## 8. Dokumen Terkait

| Dokumen | Deskripsi |
|---------|-----------|
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Daftar kebutuhan lengkap |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Arsitektur sistem detail |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Desain database & ERD |
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | Aturan bisnis aplikasi |
| [USER_ROLES_AND_PERMISSIONS.md](./USER_ROLES_AND_PERMISSIONS.md) | Peran & hak akses |
| [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md) | Panduan desain UI/UX |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | Spesifikasi API |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | Roadmap pengembangan |
| [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) | Strategi pengujian |

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

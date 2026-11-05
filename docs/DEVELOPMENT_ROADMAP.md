# 🗓️ DEVELOPMENT ROADMAP — GUGARAMKU

## Roadmap Pengembangan

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |
| **Total Estimasi** | 16-20 minggu |

---

## 1. Timeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT TIMELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Nov 2026          Des 2026          Jan 2027          Feb 2027             │
│  │                 │                 │                 │                    │
│  ▼                 ▼                 ▼                 ▼                    │
│  ┌─────────────────┬─────────────────┬─────────────────┬──────────────────┐ │
│  │     FASE 1      │     FASE 2      │     FASE 3      │     FASE 4       │ │
│  │      MVP        │ Mobile+Offline  │    Laporan      │ Fitur Lanjutan   │ │
│  │   (4-6 minggu)  │  (3-4 minggu)   │  (2-3 minggu)   │  (3-4 minggu)    │ │
│  └─────────────────┴─────────────────┴─────────────────┴──────────────────┘ │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  Mar 2027+                                                                   │
│  │                                                                           │
│  ▼                                                                           │
│  ┌──────────────────┐                                                        │
│  │     FASE 5       │                                                        │
│  │   Multi-Cabang   │                                                        │
│  │   (3-4 minggu)   │                                                        │
│  └──────────────────┘                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fase 1 — MVP (Minimum Viable Product)

### Durasi: 4-6 minggu
### Target: Aplikasi dasar yang dapat digunakan untuk operasional 1 cabang

### 2.1 Sprint 1: Setup & Infrastruktur (Minggu 1)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Project Setup | Inisialisasi Next.js, TypeScript, Tailwind, shadcn/ui | 1 hari |
| Database Setup | Setup PostgreSQL, Prisma schema, migrations | 1 hari |
| Auth Setup | NextAuth.js configuration, JWT | 1 hari |
| Layout Components | Sidebar, header, navigation | 2 hari |
| Design System | Tokens, typography, base components | 1 hari |

**Deliverables:**
- [ ] Project repository dengan struktur folder
- [ ] Database schema terdeploy
- [ ] Auth flow (login/logout) berfungsi
- [ ] Layout dasar dengan sidebar

### 2.2 Sprint 2: Produk & Kategori (Minggu 2)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Category CRUD | API + UI untuk kategori | 1 hari |
| Product List | Tabel produk dengan pagination, search | 2 hari |
| Product Form | Form tambah/edit produk step-by-step | 2 hari |
| Multi-Unit System | Input multiple satuan per produk | 1 hari |
| 4-Level Pricing | Input 4 harga per satuan | 1 hari |

**Deliverables:**
- [ ] CRUD Kategori
- [ ] CRUD Produk dengan multi-satuan
- [ ] Input 4 tingkat harga per satuan
- [ ] Barcode input (manual + scanner)

### 2.3 Sprint 3: POS/Kasir - Part 1 (Minggu 3)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| POS Layout | Layout halaman kasir | 1 hari |
| Price Level Selector | Komponen pilih H1-H4 | 0.5 hari |
| Product Search | Pencarian produk di kasir | 1 hari |
| Barcode Scanner | Integrasi kamera untuk scan | 1 hari |
| Cart Management | Keranjang belanja dengan state | 2 hari |
| Unit Selector | Dropdown pilih satuan di keranjang | 0.5 hari |

**Deliverables:**
- [ ] Halaman kasir dengan layout lengkap
- [ ] Pilih tingkat harga (H1-H4)
- [ ] Pencarian dan scan barcode
- [ ] Keranjang dengan pilih satuan

### 2.4 Sprint 4: POS/Kasir - Part 2 + Pembayaran (Minggu 4)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Cart Calculations | Perhitungan subtotal, diskon, total | 1 hari |
| Stock Validation | Validasi stok saat tambah ke keranjang | 0.5 hari |
| Loss Prevention | Validasi harga vs modal | 0.5 hari |
| Payment Dialog | Dialog pembayaran tunai | 1 hari |
| Transaction Save | Simpan transaksi + kurangi stok | 1 hari |
| Quick Sale | Fitur jual tanpa barcode | 0.5 hari |
| Hold Transaction | Simpan transaksi sementara | 0.5 hari |

**Deliverables:**
- [ ] Perhitungan transaksi lengkap
- [ ] Proteksi rugi
- [ ] Pembayaran tunai dengan kembalian
- [ ] Quick Sale
- [ ] Hold/Resume transaksi

### 2.5 Sprint 5: Struk & Stok (Minggu 5)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Receipt Template | Template struk 58mm dan 80mm | 1 hari |
| Receipt Preview | Preview sebelum cetak | 0.5 hari |
| Thermal Printing | Integrasi printer thermal | 1.5 hari |
| Stock List | Halaman daftar stok | 1 hari |
| Stock Adjustment | Form tambah/kurang stok | 1 hari |
| Stock History | Riwayat mutasi stok | 1 hari |

**Deliverables:**
- [ ] Cetak struk thermal (58mm/80mm)
- [ ] Preview struk
- [ ] Manajemen stok dasar
- [ ] Riwayat mutasi stok

### 2.6 Sprint 6: User Management & Polish (Minggu 6)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| User List | Daftar karyawan | 0.5 hari |
| User CRUD | Tambah/edit/nonaktifkan user | 1 hari |
| Role Assignment | Assign role Owner/Admin/Kasir | 0.5 hari |
| PIN Login | Login dengan PIN | 0.5 hari |
| Permission Checks | Validasi permission di semua endpoint | 1 hari |
| Bug Fixes | Perbaikan bug dan polish | 1.5 hari |
| Testing | End-to-end testing | 1 hari |

**Deliverables:**
- [ ] Manajemen user (CRUD)
- [ ] Login PIN
- [ ] Permission berfungsi di semua fitur
- [ ] MVP siap digunakan

---

## 3. Fase 2 — Mobile & Offline

### Durasi: 3-4 minggu
### Target: Aplikasi mobile dan kemampuan offline

### 3.1 Sprint 7: React Native Setup (Minggu 7)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Expo Setup | Setup project React Native Expo | 1 hari |
| Shared Code | Setup monorepo/shared types | 0.5 hari |
| Mobile Auth | Login screen mobile | 1 hari |
| Mobile Navigation | Bottom tab + stack navigation | 1 hari |
| Mobile POS Layout | Layout kasir untuk mobile | 1.5 hari |

**Deliverables:**
- [ ] Project React Native Expo
- [ ] Login mobile
- [ ] Navigasi dasar

### 3.2 Sprint 8: Mobile POS (Minggu 8)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Mobile Price Selector | Komponen pilih harga mobile | 0.5 hari |
| Mobile Camera Scanner | Scan barcode dengan kamera | 1 hari |
| Mobile Cart | Keranjang mobile dengan gestures | 1.5 hari |
| Mobile Payment | Dialog pembayaran mobile | 1 hari |
| Mobile Receipt | Tampilkan/share struk digital | 1 hari |

**Deliverables:**
- [ ] POS lengkap di mobile
- [ ] Scan barcode dengan kamera
- [ ] Share struk via WhatsApp

### 3.3 Sprint 9: Offline Mode - Part 1 (Minggu 9)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| IndexedDB Setup | Dexie.js untuk web | 1 hari |
| SQLite Setup | SQLite untuk mobile | 1 hari |
| Data Caching | Cache produk, stok, pelanggan | 1.5 hari |
| Offline Detection | Deteksi status online/offline | 0.5 hari |
| Offline Indicator | UI indikator offline | 0.5 hari |
| Pending Queue | Queue untuk transaksi offline | 1 hari |

**Deliverables:**
- [ ] Local database (web + mobile)
- [ ] Data ter-cache lokal
- [ ] Indikator online/offline

### 3.4 Sprint 10: Offline Mode - Part 2 + Sync (Minggu 10)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Offline Transaction | Simpan transaksi offline | 1 hari |
| Sync Push | Kirim pending transactions ke server | 1 hari |
| Sync Pull | Tarik update dari server | 1 hari |
| Conflict Detection | Deteksi dan handle conflict | 1 hari |
| Manual Sync | Tombol sync manual | 0.5 hari |
| Sync Status | Pending counter, last sync time | 0.5 hari |

**Deliverables:**
- [ ] Transaksi offline berfungsi
- [ ] Auto sync saat online
- [ ] Manual sync
- [ ] Conflict resolution dasar

---

## 4. Fase 3 — Laporan & Analytics

### Durasi: 2-3 minggu
### Target: Dashboard dan laporan komprehensif

### 4.1 Sprint 11: Dashboard (Minggu 11)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Dashboard Layout | Layout dashboard owner | 1 hari |
| Summary Cards | Card penjualan, laba, transaksi | 1 hari |
| Dashboard API | Endpoint agregasi data | 1 hari |
| Alerts Section | Stok menipis, hutang jatuh tempo | 1 hari |
| Quick Stats | Statistik cepat | 1 hari |

**Deliverables:**
- [ ] Dashboard dengan ringkasan bisnis
- [ ] Alert stok dan hutang
- [ ] Statistik hari ini/minggu/bulan

### 4.2 Sprint 12: Laporan Detail (Minggu 12)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Sales Report | Laporan penjualan dengan filter | 1.5 hari |
| Profit Report | Laporan laba dengan grafik | 1.5 hari |
| Top Products | Produk terlaris | 1 hari |
| Charts | Grafik tren dengan Recharts | 1 hari |

**Deliverables:**
- [ ] Laporan penjualan
- [ ] Laporan laba
- [ ] Grafik tren
- [ ] Produk terlaris

### 4.3 Sprint 13: Export & Notifikasi (Minggu 13)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Export PDF | Export laporan ke PDF | 1 hari |
| Export Excel | Export data ke Excel | 1 hari |
| Push Notifications | Setup push notification | 1 hari |
| Stock Alerts | Notifikasi stok menipis/habis | 1 hari |
| Email Reports | Kirim laporan via email | 1 hari |

**Deliverables:**
- [ ] Export PDF dan Excel
- [ ] Push notification (mobile)
- [ ] Alert stok otomatis

---

## 5. Fase 4 — Fitur Lanjutan

### Durasi: 3-4 minggu
### Target: Fitur bisnis lengkap

### 5.1 Sprint 14: Pelanggan & Hutang (Minggu 14)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Customer List | Daftar pelanggan | 1 hari |
| Customer CRUD | Tambah/edit pelanggan | 1 hari |
| Debt Creation | Catat transaksi sebagai hutang | 1 hari |
| Debt List | Daftar hutang dengan filter | 1 hari |
| Debt Payment | Terima pembayaran hutang | 1 hari |

**Deliverables:**
- [ ] Manajemen pelanggan
- [ ] Sistem hutang/piutang
- [ ] Pembayaran hutang parsial/lunas

### 5.2 Sprint 15: Retur & Kas (Minggu 15)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Return Form | Form proses retur | 1.5 hari |
| Return List | Daftar retur | 0.5 hari |
| Cash Register | Saldo kas per cabang | 0.5 hari |
| Cash In/Out | Catat kas masuk/keluar | 1 hari |
| Cash Report | Laporan mutasi kas | 1 hari |
| Payment QRIS | Integrasi pembayaran QRIS | 1 hari |

**Deliverables:**
- [ ] Proses retur barang
- [ ] Manajemen kas
- [ ] Pembayaran QRIS

### 5.3 Sprint 16: Shift & Diskon (Minggu 16)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Open Shift | Buka shift dengan modal | 1 hari |
| Close Shift | Tutup shift dengan serah terima | 1 hari |
| Shift Report | Laporan per shift | 1 hari |
| Item Discount | Diskon per item | 0.5 hari |
| Total Discount | Diskon total transaksi | 0.5 hari |
| Activity Log | Log aktivitas user | 1 hari |

**Deliverables:**
- [ ] Sistem shift kasir
- [ ] Laporan shift
- [ ] Diskon item dan total
- [ ] Log aktivitas

### 5.4 Sprint 17: Polish & Testing (Minggu 17)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Bug Fixes | Perbaikan bug | 2 hari |
| Performance | Optimasi performa | 1 hari |
| UX Polish | Perbaikan UX | 1 hari |
| Testing | Testing menyeluruh | 1 hari |

**Deliverables:**
- [ ] Aplikasi stabil
- [ ] Performa optimal
- [ ] Semua fitur Fase 4 berfungsi

---

## 6. Fase 5 — Multi-Cabang (Future)

### Durasi: 3-4 minggu
### Target: Dukungan multi-cabang

### 6.1 Sprint 18: Branch Management (Minggu 18)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Branch CRUD | Tambah/edit cabang | 1 hari |
| Branch Switcher | Switch antar cabang | 1 hari |
| Branch Data Isolation | Isolasi data per cabang | 2 hari |
| Admin Cabang Role | Role admin cabang | 1 hari |

### 6.2 Sprint 19: Multi-Branch Features (Minggu 19)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Combined Reports | Laporan gabungan semua cabang | 2 hari |
| Per-Branch Reports | Laporan per cabang | 1 hari |
| Stock Transfer | Transfer stok antar cabang | 2 hari |

### 6.3 Sprint 20: Multi-Branch Polish (Minggu 20)

| Task | Deskripsi | Estimasi |
|------|-----------|----------|
| Per-Branch Pricing | Harga berbeda per cabang (opsional) | 1.5 hari |
| Testing | Testing multi-cabang | 1.5 hari |
| Bug Fixes | Perbaikan | 2 hari |

---

## 7. Progress Tracking

### 7.1 Checklist Fase 1 - MVP

- [ ] **Sprint 1: Setup**
  - [ ] Project initialization
  - [ ] Database setup
  - [ ] Auth setup
  - [ ] Layout components
  
- [ ] **Sprint 2: Produk**
  - [ ] Category CRUD
  - [ ] Product CRUD
  - [ ] Multi-unit system
  - [ ] 4-level pricing
  
- [ ] **Sprint 3: POS Part 1**
  - [ ] POS layout
  - [ ] Price level selector
  - [ ] Product search
  - [ ] Barcode scanner
  - [ ] Cart management
  
- [ ] **Sprint 4: POS Part 2**
  - [ ] Cart calculations
  - [ ] Stock validation
  - [ ] Loss prevention
  - [ ] Payment processing
  - [ ] Quick sale
  
- [ ] **Sprint 5: Struk & Stok**
  - [ ] Receipt templates
  - [ ] Thermal printing
  - [ ] Stock management
  - [ ] Stock history
  
- [ ] **Sprint 6: Users & Polish**
  - [ ] User management
  - [ ] PIN login
  - [ ] Permission checks
  - [ ] Bug fixes

### 7.2 Definition of Done

Sebuah fitur dianggap selesai jika:

1. ✅ Kode di-commit dan di-review
2. ✅ Unit tests lulus
3. ✅ Integration tests lulus
4. ✅ UI sesuai design guidelines
5. ✅ Responsive (desktop + mobile)
6. ✅ Accessibility checked
7. ✅ Permission checks berfungsi
8. ✅ Error handling proper
9. ✅ Loading states ada
10. ✅ Dokumentasi API diupdate

---

## 8. Risk Management

### 8.1 Potential Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Offline sync conflicts | High | Medium | Desain conflict resolution yang solid |
| Thermal printer compatibility | Medium | Medium | Test dengan berbagai merk printer |
| Performance dengan banyak produk | Medium | Low | Pagination, indexing, lazy loading |
| Mobile camera barcode accuracy | Medium | Medium | Gunakan library yang reliable (vision-camera) |

### 8.2 Dependencies

| Dependency | Risk | Alternative |
|------------|------|-------------|
| PostgreSQL | Low | SQLite (untuk MVP) |
| Expo | Low | React Native CLI |
| Thermal printer library | Medium | Multiple library options |
| Barcode scanner library | Low | Multiple library options |

---

## 9. Release Schedule

| Version | Phase | Target Date | Key Features |
|---------|-------|-------------|--------------|
| 0.1.0 | MVP Alpha | Week 3 | Basic POS (tanpa print) |
| 0.5.0 | MVP Beta | Week 6 | Full MVP |
| 1.0.0 | Release | Week 10 | MVP + Mobile + Offline |
| 1.5.0 | Update | Week 13 | + Laporan |
| 2.0.0 | Major | Week 17 | + Fitur Lanjutan |
| 3.0.0 | Future | Week 20+ | + Multi-Cabang |

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

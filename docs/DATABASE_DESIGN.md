# 🗄️ DATABASE DESIGN — GUGARAMKU

## Desain Database

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |
| **DBMS** | PostgreSQL 16 |
| **ORM** | Prisma 5.x |

---

## 1. Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    ERD GUGARAMKU                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   CABANG     │       │    USER      │       │   KATEGORI   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ cabang_id(FK)│       │ id (PK)      │
│ kode         │       │ id (PK)      │       │ nama         │
│ nama         │       │ nama         │       │ deskripsi    │
│ alamat       │       │ email        │       │ urutan       │
│ telepon      │       │ password     │       │ is_active    │
│ is_active    │       │ pin          │       └──────┬───────┘
└──────┬───────┘       │ role         │              │
       │               │ is_active    │              │
       │               └──────────────┘              │
       │                                             │
       │       ┌─────────────────────────────────────┘
       │       │
       │       ▼
       │  ┌──────────────┐         ┌──────────────────┐
       │  │   PRODUK     │         │  PRODUK_SATUAN   │
       │  ├──────────────┤         ├──────────────────┤
       │  │ id (PK)      │◄────────│ produk_id (FK)   │
       │  │ barcode      │         │ id (PK)          │
       │  │ nama         │         │ nama_satuan      │
       │  │ kategori_id  │────────►│ konversi         │
       │  │ harga_modal  │         │ harga_1          │
       │  │ satuan_dasar │         │ harga_2          │
       │  │ gambar       │         │ harga_3          │
       │  │ is_active    │         │ harga_4          │
       │  └──────┬───────┘         │ is_default       │
       │         │                 └──────────────────┘
       │         │
       ▼         ▼
┌──────────────┐    ┌──────────────┐
│    STOK      │    │ STOK_MUTASI  │
├──────────────┤    ├──────────────┤
│ id (PK)      │    │ id (PK)      │
│ produk_id(FK)│    │ produk_id(FK)│
│ cabang_id(FK)│    │ cabang_id(FK)│
│ jumlah       │    │ jumlah       │
│ stok_minimum │    │ tipe         │
│ updated_at   │    │ referensi_id │
└──────────────┘    │ keterangan   │
                    │ user_id (FK) │
                    │ created_at   │
                    └──────────────┘

┌──────────────┐       ┌────────────────────┐       ┌──────────────┐
│  PELANGGAN   │       │     TRANSAKSI      │       │    HUTANG    │
├──────────────┤       ├────────────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ pelanggan_id (FK)  │       │ id (PK)      │
│ nama         │       │ id (PK)            │◄──────│ transaksi_id │
│ telepon      │       │ nomor              │       │ pelanggan_id │
│ alamat       │       │ cabang_id (FK)     │       │ jumlah       │
│ kategori     │       │ kasir_id (FK)      │       │ sisa         │
│ max_hutang   │       │ tanggal            │       │ jatuh_tempo  │
│ total_belanja│       │ tingkat_harga      │       │ status       │
└──────────────┘       │ subtotal           │       └──────────────┘
                       │ diskon             │
                       │ total              │              ┌──────────────┐
                       │ metode_bayar       │              │HUTANG_BAYAR  │
                       │ jumlah_bayar       │              ├──────────────┤
                       │ kembalian          │              │ id (PK)      │
                       │ status_sync        │              │ hutang_id(FK)│
                       │ device_id          │              │ jumlah       │
                       └─────────┬──────────┘              │ metode       │
                                 │                         │ tanggal      │
                                 ▼                         └──────────────┘
                       ┌────────────────────┐
                       │  DETAIL_TRANSAKSI  │
                       ├────────────────────┤
                       │ id (PK)            │
                       │ transaksi_id (FK)  │
                       │ produk_id (FK)     │
                       │ produk_satuan_id   │
                       │ nama_barang        │
                       │ barcode            │
                       │ jumlah             │
                       │ satuan             │
                       │ konversi           │
                       │ harga_modal        │
                       │ harga_jual         │
                       │ tingkat_harga      │
                       │ diskon             │
                       │ subtotal           │
                       │ laba               │
                       │ is_quick_sale      │
                       └────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│     KAS      │       │  KAS_MUTASI  │       │ PENGATURAN_HARGA │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)          │
│ cabang_id(FK)│       │ cabang_id(FK)│       │ tingkat          │
│ saldo        │       │ jenis        │       │ nama             │
│ updated_at   │       │ kategori     │       │ warna            │
└──────────────┘       │ nominal      │       │ deskripsi        │
                       │ keterangan   │       └──────────────────┘
                       │ referensi_id │
                       │ user_id (FK) │       ┌──────────────────┐
                       │ created_at   │       │ PENGATURAN_TOKO  │
                       └──────────────┘       ├──────────────────┤
                                              │ id (PK)          │
┌──────────────┐       ┌──────────────┐       │ nama_toko        │
│    SHIFT     │       │  LOG_AKTIV   │       │ alamat           │
├──────────────┤       ├──────────────┤       │ telepon          │
│ id (PK)      │       │ id (PK)      │       │ logo             │
│ cabang_id(FK)│       │ user_id (FK) │       │ footer_struk     │
│ kasir_id (FK)│       │ aksi         │       │ printer_size     │
│ modal_awal   │       │ tabel        │       │ auto_logout_min  │
│ kas_akhir    │       │ record_id    │       └──────────────────┘
│ selisih      │       │ data_lama    │
│ catatan      │       │ data_baru    │       ┌──────────────────┐
│ waktu_buka   │       │ ip_address   │       │   RETUR          │
│ waktu_tutup  │       │ created_at   │       ├──────────────────┤
│ status       │       └──────────────┘       │ id (PK)          │
└──────────────┘                              │ transaksi_asal_id│
                                              │ cabang_id (FK)   │
                                              │ user_id (FK)     │
                                              │ tanggal          │
                                              │ total_refund     │
                                              │ metode_refund    │
                                              │ alasan           │
                                              │ catatan          │
                                              └──────────────────┘
```

---

## 2. Detail Tabel

### 2.1 Tabel: `cabang` (Branch)

Menyimpan data cabang/lokasi toko.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik cabang |
| `kode` | VARCHAR(10) | UNIQUE, NOT NULL | Kode singkat (SJI, MKS) |
| `nama` | VARCHAR(100) | NOT NULL | Nama cabang |
| `alamat` | TEXT | | Alamat lengkap |
| `telepon` | VARCHAR(20) | | Nomor telepon |
| `is_active` | BOOLEAN | DEFAULT true | Status aktif |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_cabang_kode` ON `kode`
- `idx_cabang_active` ON `is_active`

---

### 2.2 Tabel: `user` (Pengguna)

Menyimpan data pengguna sistem (owner, admin, kasir).

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik user |
| `cabang_id` | UUID | FK → cabang(id), NULL untuk owner | Cabang penugasan |
| `nama` | VARCHAR(100) | NOT NULL | Nama lengkap |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Email untuk login |
| `password` | VARCHAR(255) | NOT NULL | Password hash (bcrypt) |
| `pin` | VARCHAR(255) | | PIN hash untuk quick login |
| `role` | ENUM | NOT NULL | 'OWNER', 'ADMIN_CABANG', 'KASIR' |
| `is_active` | BOOLEAN | DEFAULT true | Status aktif |
| `last_login` | TIMESTAMPTZ | | Waktu login terakhir |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_user_email` ON `email`
- `idx_user_cabang` ON `cabang_id`
- `idx_user_role` ON `role`

**Constraint:**
- Owner tidak boleh memiliki `cabang_id` (NULL)
- Admin/Kasir wajib memiliki `cabang_id`

---

### 2.3 Tabel: `kategori` (Category)

Menyimpan kategori produk.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik kategori |
| `nama` | VARCHAR(100) | UNIQUE, NOT NULL | Nama kategori |
| `deskripsi` | TEXT | | Deskripsi kategori |
| `urutan` | INTEGER | DEFAULT 0 | Urutan tampilan |
| `is_active` | BOOLEAN | DEFAULT true | Status aktif |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_kategori_nama` ON `nama`
- `idx_kategori_urutan` ON `urutan`

---

### 2.4 Tabel: `produk` (Product)

Menyimpan data master produk.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik produk |
| `barcode` | VARCHAR(50) | UNIQUE | Kode barcode |
| `nama` | VARCHAR(200) | NOT NULL | Nama produk |
| `kategori_id` | UUID | FK → kategori(id) | Kategori produk |
| `harga_modal` | DECIMAL(15,2) | NOT NULL, >= 0 | Harga beli/modal per satuan dasar |
| `satuan_dasar` | VARCHAR(20) | NOT NULL | Satuan terkecil (bks, pcs, sct) |
| `gambar` | VARCHAR(255) | | Path file gambar |
| `is_active` | BOOLEAN | DEFAULT true | Status aktif |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_produk_barcode` ON `barcode`
- `idx_produk_nama` ON `nama` (GIN untuk full-text search)
- `idx_produk_kategori` ON `kategori_id`
- `idx_produk_active` ON `is_active`

---

### 2.5 Tabel: `produk_satuan` (Product Unit)

Menyimpan satuan dan harga per satuan untuk setiap produk.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `produk_id` | UUID | FK → produk(id), NOT NULL | Referensi produk |
| `nama_satuan` | VARCHAR(20) | NOT NULL | Nama satuan (bks, pak, dos, bal) |
| `konversi` | DECIMAL(10,4) | NOT NULL, > 0 | Jumlah satuan dasar (1 dos = 40 bks) |
| `harga_1` | DECIMAL(15,2) | NOT NULL, >= 0 | Harga tingkat 1 (Eceran) |
| `harga_2` | DECIMAL(15,2) | NOT NULL, >= 0 | Harga tingkat 2 (Grosir) |
| `harga_3` | DECIMAL(15,2) | NOT NULL, >= 0 | Harga tingkat 3 (Reseller) |
| `harga_4` | DECIMAL(15,2) | NOT NULL, >= 0 | Harga tingkat 4 (Distributor) |
| `is_default` | BOOLEAN | DEFAULT false | Satuan default saat scan |
| `urutan` | INTEGER | DEFAULT 0 | Urutan tampilan |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_produk_satuan_produk` ON `produk_id`
- `idx_produk_satuan_default` ON `produk_id, is_default`

**Constraint:**
- `UNIQUE(produk_id, nama_satuan)` — Satu produk tidak boleh punya satuan duplikat
- Hanya boleh ada 1 `is_default = true` per produk

---

### 2.6 Tabel: `stok` (Stock)

Menyimpan jumlah stok per produk per cabang.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `produk_id` | UUID | FK → produk(id), NOT NULL | Referensi produk |
| `cabang_id` | UUID | FK → cabang(id), NOT NULL | Referensi cabang |
| `jumlah` | DECIMAL(15,4) | NOT NULL, DEFAULT 0 | Jumlah stok (satuan dasar) |
| `stok_minimum` | DECIMAL(15,4) | DEFAULT 0 | Batas minimum untuk alert |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update terakhir |

**Index:**
- `idx_stok_produk_cabang` ON `produk_id, cabang_id` (UNIQUE)
- `idx_stok_minimum` ON `cabang_id` WHERE `jumlah <= stok_minimum`

---

### 2.7 Tabel: `stok_mutasi` (Stock Movement)

Mencatat semua pergerakan stok untuk audit trail.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `produk_id` | UUID | FK → produk(id), NOT NULL | Referensi produk |
| `cabang_id` | UUID | FK → cabang(id), NOT NULL | Referensi cabang |
| `jumlah` | DECIMAL(15,4) | NOT NULL | Jumlah perubahan (+/-) |
| `jumlah_sebelum` | DECIMAL(15,4) | NOT NULL | Stok sebelum perubahan |
| `jumlah_sesudah` | DECIMAL(15,4) | NOT NULL | Stok sesudah perubahan |
| `tipe` | ENUM | NOT NULL | Tipe mutasi (lihat enum) |
| `referensi_tipe` | VARCHAR(50) | | Tipe referensi (TRANSAKSI, RETUR, dll) |
| `referensi_id` | UUID | | ID referensi |
| `keterangan` | TEXT | | Catatan tambahan |
| `user_id` | UUID | FK → user(id), NOT NULL | User yang melakukan |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu mutasi |

**Enum `tipe`:**
- `MASUK` — Barang masuk (pembelian)
- `KELUAR` — Barang keluar (penjualan)
- `ADJUSTMENT_PLUS` — Penyesuaian tambah
- `ADJUSTMENT_MINUS` — Penyesuaian kurang
- `RETUR_MASUK` — Retur dari pembeli
- `RETUR_KELUAR` — Retur ke supplier
- `TRANSFER_MASUK` — Transfer dari cabang lain
- `TRANSFER_KELUAR` — Transfer ke cabang lain
- `OPNAME` — Hasil stok opname
- `RUSAK` — Barang rusak
- `EXPIRED` — Barang kadaluarsa

**Index:**
- `idx_stok_mutasi_produk` ON `produk_id`
- `idx_stok_mutasi_cabang` ON `cabang_id`
- `idx_stok_mutasi_tanggal` ON `created_at`
- `idx_stok_mutasi_referensi` ON `referensi_tipe, referensi_id`

---

### 2.8 Tabel: `pelanggan` (Customer)

Menyimpan data pelanggan.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `nama` | VARCHAR(100) | NOT NULL | Nama pelanggan |
| `telepon` | VARCHAR(20) | | Nomor telepon |
| `alamat` | TEXT | | Alamat |
| `kategori` | ENUM | DEFAULT 'RETAIL' | RETAIL, RESELLER, DISTRIBUTOR |
| `max_hutang` | DECIMAL(15,2) | DEFAULT 0 | Batas maksimal hutang |
| `total_belanja` | DECIMAL(15,2) | DEFAULT 0 | Akumulasi total belanja |
| `catatan` | TEXT | | Catatan tambahan |
| `is_active` | BOOLEAN | DEFAULT true | Status aktif |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_pelanggan_nama` ON `nama`
- `idx_pelanggan_telepon` ON `telepon`
- `idx_pelanggan_kategori` ON `kategori`

---

### 2.9 Tabel: `transaksi` (Transaction)

Menyimpan header transaksi penjualan.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK | ID unik (generated client-side untuk offline) |
| `nomor` | VARCHAR(30) | UNIQUE, NOT NULL | Nomor transaksi (GGK-SJI-20261102-0001) |
| `cabang_id` | UUID | FK → cabang(id), NOT NULL | Cabang transaksi |
| `kasir_id` | UUID | FK → user(id), NOT NULL | Kasir yang melayani |
| `pelanggan_id` | UUID | FK → pelanggan(id) | Pelanggan (null jika umum) |
| `tanggal` | TIMESTAMPTZ | NOT NULL | Waktu transaksi |
| `tingkat_harga` | INTEGER | NOT NULL, 1-4 | Tingkat harga yang digunakan |
| `subtotal` | DECIMAL(15,2) | NOT NULL | Total sebelum diskon |
| `diskon` | DECIMAL(15,2) | DEFAULT 0 | Nilai diskon |
| `total` | DECIMAL(15,2) | NOT NULL | Total akhir |
| `metode_bayar` | ENUM | NOT NULL | TUNAI, QRIS, TRANSFER, HUTANG, SPLIT |
| `jumlah_bayar` | DECIMAL(15,2) | NOT NULL | Jumlah dibayar |
| `kembalian` | DECIMAL(15,2) | DEFAULT 0 | Kembalian |
| `catatan` | TEXT | | Catatan transaksi |
| `status` | ENUM | DEFAULT 'SELESAI' | SELESAI, BATAL, HOLD |
| `status_sync` | ENUM | DEFAULT 'SYNCED' | PENDING, SYNCED, CONFLICT |
| `device_id` | VARCHAR(100) | | ID device asal (untuk offline) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu record dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_transaksi_nomor` ON `nomor`
- `idx_transaksi_cabang` ON `cabang_id`
- `idx_transaksi_kasir` ON `kasir_id`
- `idx_transaksi_pelanggan` ON `pelanggan_id`
- `idx_transaksi_tanggal` ON `tanggal`
- `idx_transaksi_sync` ON `status_sync` WHERE `status_sync = 'PENDING'`

---

### 2.10 Tabel: `detail_transaksi` (Transaction Detail)

Menyimpan detail item dalam transaksi.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `transaksi_id` | UUID | FK → transaksi(id), NOT NULL | Referensi transaksi |
| `produk_id` | UUID | FK → produk(id) | Referensi produk (null jika quick sale) |
| `produk_satuan_id` | UUID | FK → produk_satuan(id) | Satuan yang dipilih |
| `nama_barang` | VARCHAR(200) | NOT NULL | Nama barang (snapshot) |
| `barcode` | VARCHAR(50) | | Barcode (snapshot) |
| `jumlah` | DECIMAL(15,4) | NOT NULL | Jumlah yang dibeli |
| `satuan` | VARCHAR(20) | NOT NULL | Satuan yang digunakan |
| `konversi` | DECIMAL(10,4) | NOT NULL | Konversi ke satuan dasar |
| `harga_modal` | DECIMAL(15,2) | NOT NULL | Harga modal saat transaksi |
| `harga_jual` | DECIMAL(15,2) | NOT NULL | Harga jual per satuan |
| `tingkat_harga` | INTEGER | NOT NULL | Tingkat harga (1-4) |
| `diskon` | DECIMAL(15,2) | DEFAULT 0 | Diskon per item |
| `subtotal` | DECIMAL(15,2) | NOT NULL | (jumlah × harga_jual) - diskon |
| `laba` | DECIMAL(15,2) | NOT NULL | Laba item ini |
| `is_quick_sale` | BOOLEAN | DEFAULT false | Tandai jika quick sale |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |

**Index:**
- `idx_detail_transaksi_transaksi` ON `transaksi_id`
- `idx_detail_transaksi_produk` ON `produk_id`

**Perhitungan:**
```
subtotal = (jumlah × harga_jual) - diskon
laba = subtotal - (jumlah × konversi × harga_modal)
```

---

### 2.11 Tabel: `hutang` (Debt/Receivable)

Menyimpan data hutang pelanggan.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `transaksi_id` | UUID | FK → transaksi(id), NOT NULL | Transaksi asal |
| `pelanggan_id` | UUID | FK → pelanggan(id), NOT NULL | Pelanggan |
| `jumlah` | DECIMAL(15,2) | NOT NULL | Jumlah hutang awal |
| `sisa` | DECIMAL(15,2) | NOT NULL | Sisa hutang |
| `jatuh_tempo` | DATE | | Tanggal jatuh tempo |
| `status` | ENUM | DEFAULT 'BELUM_LUNAS' | BELUM_LUNAS, LUNAS |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Index:**
- `idx_hutang_pelanggan` ON `pelanggan_id`
- `idx_hutang_status` ON `status` WHERE `status = 'BELUM_LUNAS'`
- `idx_hutang_jatuh_tempo` ON `jatuh_tempo`

---

### 2.12 Tabel: `hutang_pembayaran` (Debt Payment)

Menyimpan riwayat pembayaran hutang.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `hutang_id` | UUID | FK → hutang(id), NOT NULL | Referensi hutang |
| `jumlah` | DECIMAL(15,2) | NOT NULL | Jumlah dibayar |
| `metode` | ENUM | NOT NULL | TUNAI, TRANSFER, QRIS |
| `catatan` | TEXT | | Catatan |
| `user_id` | UUID | FK → user(id), NOT NULL | User yang menerima |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembayaran |

**Index:**
- `idx_hutang_pembayaran_hutang` ON `hutang_id`

---

### 2.13 Tabel: `kas` (Cash Register)

Menyimpan saldo kas per cabang.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `cabang_id` | UUID | FK → cabang(id), UNIQUE, NOT NULL | Cabang |
| `saldo` | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Saldo kas saat ini |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

---

### 2.14 Tabel: `kas_mutasi` (Cash Movement)

Menyimpan mutasi kas masuk/keluar.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `cabang_id` | UUID | FK → cabang(id), NOT NULL | Cabang |
| `jenis` | ENUM | NOT NULL | MASUK, KELUAR |
| `kategori` | VARCHAR(50) | NOT NULL | Kategori (Penjualan, Gaji, Listrik, dll) |
| `nominal` | DECIMAL(15,2) | NOT NULL | Nominal |
| `saldo_sebelum` | DECIMAL(15,2) | NOT NULL | Saldo sebelum |
| `saldo_sesudah` | DECIMAL(15,2) | NOT NULL | Saldo sesudah |
| `keterangan` | TEXT | | Keterangan |
| `referensi_tipe` | VARCHAR(50) | | Tipe referensi |
| `referensi_id` | UUID | | ID referensi |
| `user_id` | UUID | FK → user(id), NOT NULL | User yang mencatat |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu mutasi |

**Index:**
- `idx_kas_mutasi_cabang` ON `cabang_id`
- `idx_kas_mutasi_tanggal` ON `created_at`
- `idx_kas_mutasi_kategori` ON `kategori`

---

### 2.15 Tabel: `shift` (Cashier Shift)

Menyimpan data shift kasir.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `cabang_id` | UUID | FK → cabang(id), NOT NULL | Cabang |
| `kasir_id` | UUID | FK → user(id), NOT NULL | Kasir |
| `modal_awal` | DECIMAL(15,2) | NOT NULL | Modal kas awal |
| `total_penjualan` | DECIMAL(15,2) | DEFAULT 0 | Total penjualan tunai |
| `total_transaksi` | INTEGER | DEFAULT 0 | Jumlah transaksi |
| `kas_akhir_sistem` | DECIMAL(15,2) | | Kas akhir menurut sistem |
| `kas_akhir_aktual` | DECIMAL(15,2) | | Kas akhir aktual (input kasir) |
| `selisih` | DECIMAL(15,2) | | Selisih kas |
| `catatan` | TEXT | | Catatan serah terima |
| `waktu_buka` | TIMESTAMPTZ | NOT NULL | Waktu buka shift |
| `waktu_tutup` | TIMESTAMPTZ | | Waktu tutup shift |
| `status` | ENUM | DEFAULT 'BUKA' | BUKA, TUTUP |

**Index:**
- `idx_shift_cabang` ON `cabang_id`
- `idx_shift_kasir` ON `kasir_id`
- `idx_shift_status` ON `status` WHERE `status = 'BUKA'`

---

### 2.16 Tabel: `retur` (Return)

Menyimpan data retur barang.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `nomor` | VARCHAR(30) | UNIQUE, NOT NULL | Nomor retur |
| `transaksi_asal_id` | UUID | FK → transaksi(id), NOT NULL | Transaksi asal |
| `cabang_id` | UUID | FK → cabang(id), NOT NULL | Cabang |
| `user_id` | UUID | FK → user(id), NOT NULL | User yang memproses |
| `tanggal` | TIMESTAMPTZ | NOT NULL | Waktu retur |
| `total_refund` | DECIMAL(15,2) | NOT NULL | Total nilai refund |
| `metode_refund` | ENUM | NOT NULL | TUNAI, TUKAR_BARANG |
| `alasan` | ENUM | NOT NULL | RUSAK, SALAH, EXPIRED, LAINNYA |
| `catatan` | TEXT | | Catatan tambahan |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |

**Index:**
- `idx_retur_transaksi` ON `transaksi_asal_id`
- `idx_retur_cabang` ON `cabang_id`

---

### 2.17 Tabel: `retur_detail` (Return Detail)

Menyimpan detail item yang diretur.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `retur_id` | UUID | FK → retur(id), NOT NULL | Referensi retur |
| `detail_transaksi_id` | UUID | FK → detail_transaksi(id), NOT NULL | Item transaksi asal |
| `jumlah` | DECIMAL(15,4) | NOT NULL | Jumlah diretur |
| `nilai_refund` | DECIMAL(15,2) | NOT NULL | Nilai refund item |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu dibuat |

---

### 2.18 Tabel: `pengaturan_harga` (Price Level Settings)

Menyimpan konfigurasi nama tingkatan harga.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `tingkat` | INTEGER | UNIQUE, NOT NULL, 1-4 | Nomor tingkat |
| `nama` | VARCHAR(50) | NOT NULL | Nama tingkatan |
| `warna` | VARCHAR(7) | NOT NULL | Kode warna hex |
| `deskripsi` | TEXT | | Deskripsi |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Default Data:**
```sql
INSERT INTO pengaturan_harga (tingkat, nama, warna, deskripsi) VALUES
(1, 'Eceran', '#3498db', 'Harga untuk pembeli umum/satuan'),
(2, 'Grosir', '#27ae60', 'Harga untuk pembeli banyak'),
(3, 'Reseller', '#f39c12', 'Harga untuk toko/penjual lain'),
(4, 'Distributor', '#9b59b6', 'Harga untuk agen besar');
```

---

### 2.19 Tabel: `pengaturan_toko` (Store Settings)

Menyimpan pengaturan toko.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `nama_toko` | VARCHAR(100) | NOT NULL | Nama toko |
| `alamat` | TEXT | | Alamat |
| `telepon` | VARCHAR(20) | | Telepon |
| `email` | VARCHAR(100) | | Email |
| `logo` | VARCHAR(255) | | Path logo |
| `footer_struk` | TEXT | | Pesan di footer struk |
| `printer_size` | ENUM | DEFAULT '58mm' | 58mm, 80mm |
| `auto_logout_menit` | INTEGER | DEFAULT 30 | Menit auto logout |
| `qris_image` | VARCHAR(255) | | Path gambar QRIS |
| `rekening_bank` | JSONB | | Data rekening bank |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

---

### 2.20 Tabel: `log_aktivitas` (Activity Log)

Menyimpan log aktivitas untuk audit trail.

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik |
| `user_id` | UUID | FK → user(id), NOT NULL | User yang melakukan |
| `aksi` | VARCHAR(50) | NOT NULL | Aksi (CREATE, UPDATE, DELETE, LOGIN, dll) |
| `tabel` | VARCHAR(50) | NOT NULL | Tabel yang diubah |
| `record_id` | UUID | | ID record yang diubah |
| `data_lama` | JSONB | | Data sebelum perubahan |
| `data_baru` | JSONB | | Data sesudah perubahan |
| `ip_address` | VARCHAR(45) | | IP address |
| `user_agent` | TEXT | | Browser/device info |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu aktivitas |

**Index:**
- `idx_log_user` ON `user_id`
- `idx_log_tabel` ON `tabel`
- `idx_log_tanggal` ON `created_at`
- `idx_log_aksi` ON `aksi`

---

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum Role {
  OWNER
  ADMIN_CABANG
  KASIR
}

enum KategoriPelanggan {
  RETAIL
  RESELLER
  DISTRIBUTOR
}

enum MetodeBayar {
  TUNAI
  QRIS
  TRANSFER
  HUTANG
  SPLIT
}

enum StatusTransaksi {
  SELESAI
  BATAL
  HOLD
}

enum StatusSync {
  PENDING
  SYNCED
  CONFLICT
}

enum TipeStokMutasi {
  MASUK
  KELUAR
  ADJUSTMENT_PLUS
  ADJUSTMENT_MINUS
  RETUR_MASUK
  RETUR_KELUAR
  TRANSFER_MASUK
  TRANSFER_KELUAR
  OPNAME
  RUSAK
  EXPIRED
}

enum JenisKas {
  MASUK
  KELUAR
}

enum StatusHutang {
  BELUM_LUNAS
  LUNAS
}

enum StatusShift {
  BUKA
  TUTUP
}

enum MetodeRefund {
  TUNAI
  TUKAR_BARANG
}

enum AlasanRetur {
  RUSAK
  SALAH
  EXPIRED
  LAINNYA
}

enum PrinterSize {
  SIZE_58MM @map("58mm")
  SIZE_80MM @map("80mm")
}

// Models
model Cabang {
  id        String   @id @default(uuid())
  kode      String   @unique @db.VarChar(10)
  nama      String   @db.VarChar(100)
  alamat    String?  @db.Text
  telepon   String?  @db.VarChar(20)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  users       User[]
  stok        Stok[]
  stokMutasi  StokMutasi[]
  transaksi   Transaksi[]
  kas         Kas?
  kasMutasi   KasMutasi[]
  shift       Shift[]
  retur       Retur[]

  @@map("cabang")
}

model User {
  id        String    @id @default(uuid())
  cabangId  String?   @map("cabang_id")
  nama      String    @db.VarChar(100)
  email     String    @unique @db.VarChar(100)
  password  String    @db.VarChar(255)
  pin       String?   @db.VarChar(255)
  role      Role
  isActive  Boolean   @default(true) @map("is_active")
  lastLogin DateTime? @map("last_login")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  cabang          Cabang?           @relation(fields: [cabangId], references: [id])
  transaksi       Transaksi[]
  stokMutasi      StokMutasi[]
  kasMutasi       KasMutasi[]
  shift           Shift[]
  retur           Retur[]
  hutangPembayaran HutangPembayaran[]
  logAktivitas    LogAktivitas[]

  @@map("user")
}

model Kategori {
  id        String   @id @default(uuid())
  nama      String   @unique @db.VarChar(100)
  deskripsi String?  @db.Text
  urutan    Int      @default(0)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  produk Produk[]

  @@map("kategori")
}

model Produk {
  id          String   @id @default(uuid())
  barcode     String?  @unique @db.VarChar(50)
  nama        String   @db.VarChar(200)
  kategoriId  String?  @map("kategori_id")
  hargaModal  Decimal  @map("harga_modal") @db.Decimal(15, 2)
  satuanDasar String   @map("satuan_dasar") @db.VarChar(20)
  gambar      String?  @db.VarChar(255)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  kategori        Kategori?         @relation(fields: [kategoriId], references: [id])
  produkSatuan    ProdukSatuan[]
  stok            Stok[]
  stokMutasi      StokMutasi[]
  detailTransaksi DetailTransaksi[]

  @@map("produk")
}

model ProdukSatuan {
  id         String   @id @default(uuid())
  produkId   String   @map("produk_id")
  namaSatuan String   @map("nama_satuan") @db.VarChar(20)
  konversi   Decimal  @db.Decimal(10, 4)
  harga1     Decimal  @map("harga_1") @db.Decimal(15, 2)
  harga2     Decimal  @map("harga_2") @db.Decimal(15, 2)
  harga3     Decimal  @map("harga_3") @db.Decimal(15, 2)
  harga4     Decimal  @map("harga_4") @db.Decimal(15, 2)
  isDefault  Boolean  @default(false) @map("is_default")
  urutan     Int      @default(0)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  produk          Produk            @relation(fields: [produkId], references: [id], onDelete: Cascade)
  detailTransaksi DetailTransaksi[]

  @@unique([produkId, namaSatuan])
  @@map("produk_satuan")
}

model Stok {
  id          String   @id @default(uuid())
  produkId    String   @map("produk_id")
  cabangId    String   @map("cabang_id")
  jumlah      Decimal  @default(0) @db.Decimal(15, 4)
  stokMinimum Decimal  @default(0) @map("stok_minimum") @db.Decimal(15, 4)
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  produk Produk @relation(fields: [produkId], references: [id], onDelete: Cascade)
  cabang Cabang @relation(fields: [cabangId], references: [id])

  @@unique([produkId, cabangId])
  @@map("stok")
}

model StokMutasi {
  id             String         @id @default(uuid())
  produkId       String         @map("produk_id")
  cabangId       String         @map("cabang_id")
  jumlah         Decimal        @db.Decimal(15, 4)
  jumlahSebelum  Decimal        @map("jumlah_sebelum") @db.Decimal(15, 4)
  jumlahSesudah  Decimal        @map("jumlah_sesudah") @db.Decimal(15, 4)
  tipe           TipeStokMutasi
  referensiTipe  String?        @map("referensi_tipe") @db.VarChar(50)
  referensiId    String?        @map("referensi_id")
  keterangan     String?        @db.Text
  userId         String         @map("user_id")
  createdAt      DateTime       @default(now()) @map("created_at")

  // Relations
  produk Produk @relation(fields: [produkId], references: [id])
  cabang Cabang @relation(fields: [cabangId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@map("stok_mutasi")
}

model Pelanggan {
  id           String             @id @default(uuid())
  nama         String             @db.VarChar(100)
  telepon      String?            @db.VarChar(20)
  alamat       String?            @db.Text
  kategori     KategoriPelanggan  @default(RETAIL)
  maxHutang    Decimal            @default(0) @map("max_hutang") @db.Decimal(15, 2)
  totalBelanja Decimal            @default(0) @map("total_belanja") @db.Decimal(15, 2)
  catatan      String?            @db.Text
  isActive     Boolean            @default(true) @map("is_active")
  createdAt    DateTime           @default(now()) @map("created_at")
  updatedAt    DateTime           @updatedAt @map("updated_at")

  // Relations
  transaksi Transaksi[]
  hutang    Hutang[]

  @@map("pelanggan")
}

model Transaksi {
  id           String          @id @default(uuid())
  nomor        String          @unique @db.VarChar(30)
  cabangId     String          @map("cabang_id")
  kasirId      String          @map("kasir_id")
  pelangganId  String?         @map("pelanggan_id")
  tanggal      DateTime
  tingkatHarga Int             @map("tingkat_harga")
  subtotal     Decimal         @db.Decimal(15, 2)
  diskon       Decimal         @default(0) @db.Decimal(15, 2)
  total        Decimal         @db.Decimal(15, 2)
  metodeBayar  MetodeBayar     @map("metode_bayar")
  jumlahBayar  Decimal         @map("jumlah_bayar") @db.Decimal(15, 2)
  kembalian    Decimal         @default(0) @db.Decimal(15, 2)
  catatan      String?         @db.Text
  status       StatusTransaksi @default(SELESAI)
  statusSync   StatusSync      @default(SYNCED) @map("status_sync")
  deviceId     String?         @map("device_id") @db.VarChar(100)
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")

  // Relations
  cabang          Cabang            @relation(fields: [cabangId], references: [id])
  kasir           User              @relation(fields: [kasirId], references: [id])
  pelanggan       Pelanggan?        @relation(fields: [pelangganId], references: [id])
  detailTransaksi DetailTransaksi[]
  hutang          Hutang[]
  retur           Retur[]

  @@map("transaksi")
}

model DetailTransaksi {
  id             String   @id @default(uuid())
  transaksiId    String   @map("transaksi_id")
  produkId       String?  @map("produk_id")
  produkSatuanId String?  @map("produk_satuan_id")
  namaBarang     String   @map("nama_barang") @db.VarChar(200)
  barcode        String?  @db.VarChar(50)
  jumlah         Decimal  @db.Decimal(15, 4)
  satuan         String   @db.VarChar(20)
  konversi       Decimal  @db.Decimal(10, 4)
  hargaModal     Decimal  @map("harga_modal") @db.Decimal(15, 2)
  hargaJual      Decimal  @map("harga_jual") @db.Decimal(15, 2)
  tingkatHarga   Int      @map("tingkat_harga")
  diskon         Decimal  @default(0) @db.Decimal(15, 2)
  subtotal       Decimal  @db.Decimal(15, 2)
  laba           Decimal  @db.Decimal(15, 2)
  isQuickSale    Boolean  @default(false) @map("is_quick_sale")
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  transaksi    Transaksi     @relation(fields: [transaksiId], references: [id], onDelete: Cascade)
  produk       Produk?       @relation(fields: [produkId], references: [id])
  produkSatuan ProdukSatuan? @relation(fields: [produkSatuanId], references: [id])
  returDetail  ReturDetail[]

  @@map("detail_transaksi")
}

model Hutang {
  id          String       @id @default(uuid())
  transaksiId String       @map("transaksi_id")
  pelangganId String       @map("pelanggan_id")
  jumlah      Decimal      @db.Decimal(15, 2)
  sisa        Decimal      @db.Decimal(15, 2)
  jatuhTempo  DateTime?    @map("jatuh_tempo") @db.Date
  status      StatusHutang @default(BELUM_LUNAS)
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  // Relations
  transaksi  Transaksi          @relation(fields: [transaksiId], references: [id])
  pelanggan  Pelanggan          @relation(fields: [pelangganId], references: [id])
  pembayaran HutangPembayaran[]

  @@map("hutang")
}

model HutangPembayaran {
  id        String     @id @default(uuid())
  hutangId  String     @map("hutang_id")
  jumlah    Decimal    @db.Decimal(15, 2)
  metode    MetodeBayar
  catatan   String?    @db.Text
  userId    String     @map("user_id")
  createdAt DateTime   @default(now()) @map("created_at")

  // Relations
  hutang Hutang @relation(fields: [hutangId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@map("hutang_pembayaran")
}

model Kas {
  id        String   @id @default(uuid())
  cabangId  String   @unique @map("cabang_id")
  saldo     Decimal  @default(0) @db.Decimal(15, 2)
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  cabang Cabang @relation(fields: [cabangId], references: [id])

  @@map("kas")
}

model KasMutasi {
  id            String   @id @default(uuid())
  cabangId      String   @map("cabang_id")
  jenis         JenisKas
  kategori      String   @db.VarChar(50)
  nominal       Decimal  @db.Decimal(15, 2)
  saldoSebelum  Decimal  @map("saldo_sebelum") @db.Decimal(15, 2)
  saldoSesudah  Decimal  @map("saldo_sesudah") @db.Decimal(15, 2)
  keterangan    String?  @db.Text
  referensiTipe String?  @map("referensi_tipe") @db.VarChar(50)
  referensiId   String?  @map("referensi_id")
  userId        String   @map("user_id")
  createdAt     DateTime @default(now()) @map("created_at")

  // Relations
  cabang Cabang @relation(fields: [cabangId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@map("kas_mutasi")
}

model Shift {
  id              String      @id @default(uuid())
  cabangId        String      @map("cabang_id")
  kasirId         String      @map("kasir_id")
  modalAwal       Decimal     @map("modal_awal") @db.Decimal(15, 2)
  totalPenjualan  Decimal     @default(0) @map("total_penjualan") @db.Decimal(15, 2)
  totalTransaksi  Int         @default(0) @map("total_transaksi")
  kasAkhirSistem  Decimal?    @map("kas_akhir_sistem") @db.Decimal(15, 2)
  kasAkhirAktual  Decimal?    @map("kas_akhir_aktual") @db.Decimal(15, 2)
  selisih         Decimal?    @db.Decimal(15, 2)
  catatan         String?     @db.Text
  waktuBuka       DateTime    @map("waktu_buka")
  waktuTutup      DateTime?   @map("waktu_tutup")
  status          StatusShift @default(BUKA)

  // Relations
  cabang Cabang @relation(fields: [cabangId], references: [id])
  kasir  User   @relation(fields: [kasirId], references: [id])

  @@map("shift")
}

model Retur {
  id              String       @id @default(uuid())
  nomor           String       @unique @db.VarChar(30)
  transaksiAsalId String       @map("transaksi_asal_id")
  cabangId        String       @map("cabang_id")
  userId          String       @map("user_id")
  tanggal         DateTime
  totalRefund     Decimal      @map("total_refund") @db.Decimal(15, 2)
  metodeRefund    MetodeRefund @map("metode_refund")
  alasan          AlasanRetur
  catatan         String?      @db.Text
  createdAt       DateTime     @default(now()) @map("created_at")

  // Relations
  transaksiAsal Transaksi     @relation(fields: [transaksiAsalId], references: [id])
  cabang        Cabang        @relation(fields: [cabangId], references: [id])
  user          User          @relation(fields: [userId], references: [id])
  detail        ReturDetail[]

  @@map("retur")
}

model ReturDetail {
  id                String   @id @default(uuid())
  returId           String   @map("retur_id")
  detailTransaksiId String   @map("detail_transaksi_id")
  jumlah            Decimal  @db.Decimal(15, 4)
  nilaiRefund       Decimal  @map("nilai_refund") @db.Decimal(15, 2)
  createdAt         DateTime @default(now()) @map("created_at")

  // Relations
  retur           Retur           @relation(fields: [returId], references: [id], onDelete: Cascade)
  detailTransaksi DetailTransaksi @relation(fields: [detailTransaksiId], references: [id])

  @@map("retur_detail")
}

model PengaturanHarga {
  id        String   @id @default(uuid())
  tingkat   Int      @unique
  nama      String   @db.VarChar(50)
  warna     String   @db.VarChar(7)
  deskripsi String?  @db.Text
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("pengaturan_harga")
}

model PengaturanToko {
  id              String      @id @default(uuid())
  namaToko        String      @map("nama_toko") @db.VarChar(100)
  alamat          String?     @db.Text
  telepon         String?     @db.VarChar(20)
  email           String?     @db.VarChar(100)
  logo            String?     @db.VarChar(255)
  footerStruk     String?     @map("footer_struk") @db.Text
  printerSize     PrinterSize @default(SIZE_58MM) @map("printer_size")
  autoLogoutMenit Int         @default(30) @map("auto_logout_menit")
  qrisImage       String?     @map("qris_image") @db.VarChar(255)
  rekeningBank    Json?       @map("rekening_bank")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@map("pengaturan_toko")
}

model LogAktivitas {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  aksi      String   @db.VarChar(50)
  tabel     String   @db.VarChar(50)
  recordId  String?  @map("record_id")
  dataLama  Json?    @map("data_lama")
  dataBaru  Json?    @map("data_baru")
  ipAddress String?  @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent") @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@map("log_aktivitas")
}
```

---

## 4. Migration Scripts

### 4.1 Initial Migration

```sql
-- 0001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN_CABANG', 'KASIR');
CREATE TYPE "KategoriPelanggan" AS ENUM ('RETAIL', 'RESELLER', 'DISTRIBUTOR');
CREATE TYPE "MetodeBayar" AS ENUM ('TUNAI', 'QRIS', 'TRANSFER', 'HUTANG', 'SPLIT');
CREATE TYPE "StatusTransaksi" AS ENUM ('SELESAI', 'BATAL', 'HOLD');
CREATE TYPE "StatusSync" AS ENUM ('PENDING', 'SYNCED', 'CONFLICT');
CREATE TYPE "TipeStokMutasi" AS ENUM ('MASUK', 'KELUAR', 'ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'RETUR_MASUK', 'RETUR_KELUAR', 'TRANSFER_MASUK', 'TRANSFER_KELUAR', 'OPNAME', 'RUSAK', 'EXPIRED');
CREATE TYPE "JenisKas" AS ENUM ('MASUK', 'KELUAR');
CREATE TYPE "StatusHutang" AS ENUM ('BELUM_LUNAS', 'LUNAS');
CREATE TYPE "StatusShift" AS ENUM ('BUKA', 'TUTUP');
CREATE TYPE "MetodeRefund" AS ENUM ('TUNAI', 'TUKAR_BARANG');
CREATE TYPE "AlasanRetur" AS ENUM ('RUSAK', 'SALAH', 'EXPIRED', 'LAINNYA');
CREATE TYPE "PrinterSize" AS ENUM ('58mm', '80mm');

-- Tables will be created by Prisma migrate
```

### 4.2 Seed Data

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed pengaturan harga
  await prisma.pengaturanHarga.createMany({
    data: [
      { tingkat: 1, nama: 'Eceran', warna: '#3498db', deskripsi: 'Harga untuk pembeli umum/satuan' },
      { tingkat: 2, nama: 'Grosir', warna: '#27ae60', deskripsi: 'Harga untuk pembeli banyak' },
      { tingkat: 3, nama: 'Reseller', warna: '#f39c12', deskripsi: 'Harga untuk toko/penjual lain' },
      { tingkat: 4, nama: 'Distributor', warna: '#9b59b6', deskripsi: 'Harga untuk agen besar' },
    ],
    skipDuplicates: true,
  });

  // Seed cabang pertama
  const cabang = await prisma.cabang.create({
    data: {
      kode: 'SJI',
      nama: 'Cabang Sinjai',
      alamat: 'Jl. Contoh No. 123, Sinjai',
      telepon: '0812-xxxx-xxxx',
    },
  });

  // Seed owner
  const hashedPassword = await bcrypt.hash('owner123', 10);
  const hashedPin = await bcrypt.hash('123456', 10);

  await prisma.user.create({
    data: {
      nama: 'Owner GuGaramKu',
      email: 'owner@gugaramku.com',
      password: hashedPassword,
      pin: hashedPin,
      role: 'OWNER',
    },
  });

  // Seed kasir
  const kasirPassword = await bcrypt.hash('kasir123', 10);
  const kasirPin = await bcrypt.hash('1234', 10);

  await prisma.user.create({
    data: {
      nama: 'Ahmad Kasir',
      email: 'ahmad@gugaramku.com',
      password: kasirPassword,
      pin: kasirPin,
      role: 'KASIR',
      cabangId: cabang.id,
    },
  });

  // Seed kategori
  const kategoris = await prisma.kategori.createMany({
    data: [
      { nama: 'Sembako', deskripsi: 'Beras, Gula, Minyak, Tepung, dll', urutan: 1 },
      { nama: 'Minuman', deskripsi: 'Air mineral, Kopi, Teh, Susu, dll', urutan: 2 },
      { nama: 'Makanan Ringan', deskripsi: 'Snack, Biskuit, Keripik, dll', urutan: 3 },
      { nama: 'Bumbu Dapur', deskripsi: 'Garam, Merica, Kecap, Saus, dll', urutan: 4 },
      { nama: 'Perawatan Tubuh', deskripsi: 'Sabun, Shampo, Pasta gigi, dll', urutan: 5 },
      { nama: 'Pembersih', deskripsi: 'Deterjen, Pewangi, Pel, dll', urutan: 6 },
      { nama: 'Rokok', deskripsi: 'Rokok dan produk tembakau', urutan: 7 },
      { nama: 'Lain-lain', deskripsi: 'Produk lainnya', urutan: 99 },
    ],
    skipDuplicates: true,
  });

  // Seed pengaturan toko
  await prisma.pengaturanToko.create({
    data: {
      namaToko: 'GuGaramKu',
      alamat: 'Jl. Contoh No. 123, Sinjai',
      telepon: '0812-xxxx-xxxx',
      footerStruk: 'Terima Kasih Atas Kunjungan Anda!',
      printerSize: 'SIZE_58MM',
    },
  });

  // Seed kas untuk cabang
  await prisma.kas.create({
    data: {
      cabangId: cabang.id,
      saldo: 0,
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 5. Query Examples

### 5.1 Ambil Produk dengan Satuan dan Harga

```typescript
const produkDenganSatuan = await prisma.produk.findUnique({
  where: { barcode: '8991234567890' },
  include: {
    kategori: true,
    produkSatuan: {
      orderBy: { urutan: 'asc' },
    },
    stok: {
      where: { cabangId: currentCabangId },
    },
  },
});
```

### 5.2 Simpan Transaksi dengan Detail

```typescript
const transaksi = await prisma.$transaction(async (tx) => {
  // Create transaksi
  const trx = await tx.transaksi.create({
    data: {
      id: uuid(), // Client-generated for offline
      nomor: generateNomorTransaksi(cabangId),
      cabangId,
      kasirId,
      tanggal: new Date(),
      tingkatHarga,
      subtotal,
      diskon,
      total,
      metodeBayar: 'TUNAI',
      jumlahBayar,
      kembalian,
      detailTransaksi: {
        create: items.map(item => ({
          produkId: item.produkId,
          produkSatuanId: item.satuanId,
          namaBarang: item.nama,
          barcode: item.barcode,
          jumlah: item.jumlah,
          satuan: item.satuan,
          konversi: item.konversi,
          hargaModal: item.hargaModal,
          hargaJual: item.hargaJual,
          tingkatHarga,
          subtotal: item.subtotal,
          laba: item.laba,
        })),
      },
    },
  });

  // Update stok
  for (const item of items) {
    const pengurangan = item.jumlah * item.konversi; // Konversi ke satuan dasar
    
    await tx.stok.update({
      where: {
        produkId_cabangId: {
          produkId: item.produkId,
          cabangId,
        },
      },
      data: {
        jumlah: { decrement: pengurangan },
      },
    });

    // Catat mutasi stok
    await tx.stokMutasi.create({
      data: {
        produkId: item.produkId,
        cabangId,
        jumlah: -pengurangan,
        jumlahSebelum: item.stokSebelum,
        jumlahSesudah: item.stokSebelum - pengurangan,
        tipe: 'KELUAR',
        referensiTipe: 'TRANSAKSI',
        referensiId: trx.id,
        userId: kasirId,
      },
    });
  }

  return trx;
});
```

### 5.3 Laporan Laba Harian

```typescript
const laporanLaba = await prisma.$queryRaw`
  SELECT 
    DATE(t.tanggal) as tanggal,
    COUNT(t.id) as jumlah_transaksi,
    SUM(t.total) as total_penjualan,
    SUM(dt.harga_modal * dt.jumlah * dt.konversi) as total_modal,
    SUM(dt.laba) as total_laba
  FROM transaksi t
  JOIN detail_transaksi dt ON dt.transaksi_id = t.id
  WHERE t.cabang_id = ${cabangId}
    AND t.tanggal >= ${startDate}
    AND t.tanggal <= ${endDate}
    AND t.status = 'SELESAI'
  GROUP BY DATE(t.tanggal)
  ORDER BY tanggal DESC
`;
```

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

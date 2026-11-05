# 🎨 UI/UX GUIDELINES — GUGARAMKU

## Panduan Desain Antarmuka

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |

---

## 1. Filosofi Desain

### 1.1 Prinsip Utama

GuGaramKu dirancang sebagai aplikasi POS **profesional** dengan standar kualitas setara software komersial. Bukan dashboard generik atau template AI.

| Prinsip | Implementasi |
|---------|--------------|
| **Simpel** | Tampilan bersih, tidak berantakan, fokus pada fungsi utama |
| **Cepat** | Maksimal 3 klik untuk tugas umum |
| **Intuitif** | Icon dan warna yang mudah dipahami |
| **Responsif** | Lancar di komputer, tablet, dan HP |
| **Toleran Error** | Konfirmasi sebelum hapus, feedback jelas |

### 1.2 Referensi Kualitas

Desain terinspirasi dari kualitas dan usability:
- **Linear** — Clean visual hierarchy, polished interactions
- **Stripe Dashboard** — Professional financial interfaces
- **Shopify POS** — Practical retail workflows
- **Square POS** — Transaction-focused usability

### 1.3 Anti-Pattern (HINDARI)

❌ **JANGAN** buat:
- Generic AI dashboard layouts
- Excessive gradient backgrounds
- Unnecessary glassmorphism
- Random decorative illustrations
- Excessive rounded cards
- Unnecessary icons di setiap label
- Oversized headings yang buang ruang
- Repetitive card grids di setiap halaman
- Inconsistent spacing dan typography
- Fake charts dan meaningless statistics
- Tombol yang terlihat berfungsi tapi tidak

---

## 2. Design Tokens

### 2.1 Color Palette

```css
/* Base Colors */
--background: 0 0% 100%;           /* White */
--foreground: 222.2 84% 4.9%;      /* Near black */

/* Card & Surfaces */
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;

/* Primary Brand */
--primary: 221.2 83.2% 53.3%;      /* Blue - #3B82F6 */
--primary-foreground: 210 40% 98%;

/* Secondary */
--secondary: 210 40% 96.1%;
--secondary-foreground: 222.2 47.4% 11.2%;

/* Muted */
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;

/* Accent */
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;

/* Destructive */
--destructive: 0 84.2% 60.2%;      /* Red */
--destructive-foreground: 210 40% 98%;

/* Border & Input */
--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 221.2 83.2% 53.3%;

/* Radius */
--radius: 0.5rem;
```

### 2.2 Warna Tingkatan Harga

```css
/* Price Level Colors */
--price-h1: #3498db;  /* Eceran - Blue */
--price-h2: #27ae60;  /* Grosir - Green */
--price-h3: #f39c12;  /* Reseller - Orange */
--price-h4: #9b59b6;  /* Distributor - Purple */
```

### 2.3 Warna Status

```css
/* Status Colors */
--status-success: #22c55e;    /* Green - Sukses, Online, Laba */
--status-warning: #f59e0b;    /* Amber - Warning, Menipis, Pending */
--status-error: #ef4444;      /* Red - Error, Habis, Rugi, Offline */
--status-info: #3b82f6;       /* Blue - Info, Link */
--status-muted: #6b7280;      /* Gray - Nonaktif, Secondary */
```

### 2.4 Typography

```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### 2.5 Spacing Scale

```css
/* Spacing (4px base) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 2.6 Shadows

```css
/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

### 2.7 Border Radius

```css
/* Border Radius */
--rounded-none: 0;
--rounded-sm: 0.125rem;   /* 2px */
--rounded: 0.25rem;       /* 4px */
--rounded-md: 0.375rem;   /* 6px */
--rounded-lg: 0.5rem;     /* 8px */
--rounded-xl: 0.75rem;    /* 12px */
--rounded-2xl: 1rem;      /* 16px */
--rounded-full: 9999px;
```

---

## 3. Typography System

### 3.1 Hierarchy

| Level | Element | Size | Weight | Use Case |
|-------|---------|------|--------|----------|
| H1 | Page Title | 30px | 700 | Judul halaman utama |
| H2 | Section Title | 24px | 600 | Judul section/card |
| H3 | Subsection | 20px | 600 | Sub-judul |
| H4 | Card Title | 18px | 600 | Judul card kecil |
| Body | Paragraph | 16px | 400 | Teks umum |
| Body Small | Secondary | 14px | 400 | Teks pendukung |
| Caption | Label | 12px | 500 | Label form, caption |
| **Price** | Currency | 16-24px | 600 | Harga (tabular nums) |

### 3.2 Tabular Numbers untuk Harga

```css
/* Gunakan tabular-nums untuk angka finansial */
.price, .currency, .quantity {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

---

## 4. Component Library

### 4.1 Buttons

```
┌─────────────────────────────────────────────────────────────────┐
│ BUTTON VARIANTS                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Primary:    [████ Simpan ████]     - Aksi utama                │
│              Blue background, white text                         │
│                                                                  │
│  Secondary:  [░░░░ Batal ░░░░]      - Aksi sekunder             │
│              Gray background, dark text                          │
│                                                                  │
│  Outline:    [──── Export ────]      - Aksi tersier             │
│              Border only, no fill                                │
│                                                                  │
│  Ghost:      [     Lihat     ]       - Aksi minimal             │
│              No border, text only                                │
│                                                                  │
│  Destructive:[████ Hapus ████]       - Aksi berbahaya           │
│              Red background                                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ BUTTON SIZES                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Small:   Height 32px, padding 12px, text 14px                  │
│  Default: Height 40px, padding 16px, text 14px                  │
│  Large:   Height 48px, padding 24px, text 16px                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Form Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT STATES                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Default:                                                        │
│  ┌─────────────────────────────────────────┐                    │
│  │ Placeholder text...                      │                    │
│  └─────────────────────────────────────────┘                    │
│  Border: gray-300                                                │
│                                                                  │
│  Focus:                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ User input...                           │                    │
│  └─────────────────────────────────────────┘                    │
│  Border: primary-500, Ring: primary-100                         │
│                                                                  │
│  Error:                                                          │
│  ┌─────────────────────────────────────────┐                    │
│  │ Invalid input                            │                    │
│  └─────────────────────────────────────────┘                    │
│  ⚠️ Pesan error yang jelas                                       │
│  Border: red-500                                                 │
│                                                                  │
│  Disabled:                                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ Disabled value                           │                    │
│  └─────────────────────────────────────────┘                    │
│  Background: gray-100, Text: gray-400                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Price Level Selector

```
┌─────────────────────────────────────────────────────────────────┐
│ PRICE LEVEL SELECTOR - Komponen khusus untuk pilih tingkat harga│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PILIH TINGKATAN HARGA:                                         │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │   💰 H1    │ │   💰 H2    │ │   💰 H3    │ │   💰 H4    │   │
│  │  ECERAN    │ │  GROSIR    │ │ RESELLER   │ │  DISTRI    │   │
│  │ ██████████ │ │            │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│    ▲ Aktif                                                      │
│    (background sesuai warna level)                              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ SPESIFIKASI:                                                     │
│ - Ukuran: 100px × 60px per tombol                               │
│ - Gap: 12px antar tombol                                        │
│ - Active: Background color sesuai level, teks putih            │
│ - Inactive: Background gray-100, border gray-200               │
│ - Hover: Slight shadow, border color sesuai level              │
│ - Shortcut: F1, F2, F3, F4 (di desktop)                        │
│ - Mobile: Responsive, bisa scroll horizontal jika perlu        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Cart Item

```
┌─────────────────────────────────────────────────────────────────┐
│ CART ITEM - Item di keranjang belanja                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ┌─────┐                                                    │  │
│  │ │ IMG │  Indomie Goreng                             🗑️    │  │
│  │ └─────┘  Barcode: 8991234567890                           │  │
│  │                                                            │  │
│  │  Satuan: ┌─────────────┐   Qty: ┌───┬─────┬───┐          │  │
│  │          │ Bks      ▼  │        │ - │  5  │ + │          │  │
│  │          └─────────────┘        └───┴─────┴───┘          │  │
│  │                                                            │  │
│  │  @Rp 3.500                              Subtotal: Rp17.500│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ INTERAKSI:                                                       │
│ - Klik dropdown satuan → Pilih satuan lain                      │
│ - Klik +/- → Ubah quantity                                      │
│ - Klik angka qty → Input manual                                 │
│ - Klik 🗑️ → Hapus dari keranjang (dengan konfirmasi)           │
│ - Swipe kiri (mobile) → Reveal delete button                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.5 Data Table

```
┌─────────────────────────────────────────────────────────────────┐
│ DATA TABLE - Untuk daftar produk, transaksi, dll               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Cari produk...              │ Filter ▼ │ + Tambah     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────┬──────────────┬───────────┬──────────┬─────────┬────┐  │
│  │ □   │ Nama Produk  │ Kategori  │ Stok     │ Harga   │ •••│  │
│  ├─────┼──────────────┼───────────┼──────────┼─────────┼────┤  │
│  │ □   │ Indomie      │ Makanan   │ 150 bks  │ Rp3.500 │ •••│  │
│  │ □   │ Gula 1kg     │ Sembako   │ ⚠️ 20 kg │ Rp15.000│ •••│  │
│  │ □   │ Minyak 2L    │ Sembako   │ 🔴 0 pcs │ Rp35.000│ •••│  │
│  └─────┴──────────────┴───────────┴──────────┴─────────┴────┘  │
│                                                                  │
│  Menampilkan 1-10 dari 156 produk    │◀ 1 2 3 ... 16 ▶│       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ FITUR:                                                           │
│ - Sortable columns (klik header)                                │
│ - Sticky header saat scroll                                     │
│ - Row hover highlight                                           │
│ - Checkbox untuk bulk action                                    │
│ - Indikator stok dengan warna                                   │
│ - Actions menu (•••) untuk edit/delete                          │
│ - Pagination atau infinite scroll                               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Dialog/Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ DIALOG - Untuk konfirmasi dan form                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                     ✕     │  │
│  │  ⚠️ Ganti Tingkatan Harga?                                │  │
│  │                                                            │  │
│  │  Anda akan mengubah tingkatan harga dari ECERAN ke        │  │
│  │  GROSIR. Harga semua item di keranjang akan berubah.      │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ Perubahan harga:                                    │  │  │
│  │  │ • Indomie: Rp 3.500 → Rp 3.300                     │  │  │
│  │  │ • Gula 1kg: Rp 15.000 → Rp 14.000                  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │                        ┌─────────┐ ┌─────────────────┐    │  │
│  │                        │  Batal  │ │ Ya, Ganti Harga │    │  │
│  │                        └─────────┘ └─────────────────┘    │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ATURAN:                                                          │
│ - Max width: 500px untuk dialog kecil, 800px untuk form        │
│ - Overlay: Semi-transparent black                               │
│ - Animation: Fade in + slide up                                 │
│ - Focus trap: Tab hanya dalam dialog                            │
│ - Close: Klik X, klik overlay, atau tekan Escape               │
│ - Primary action di kanan, secondary di kiri                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.7 Toast Notifications

```
┌─────────────────────────────────────────────────────────────────┐
│ TOAST - Notifikasi sementara                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Success:                                                        │
│  ┌───────────────────────────────────────────┐                  │
│  │ ✓  Transaksi berhasil disimpan            │ ✕                │
│  └───────────────────────────────────────────┘                  │
│  Background: green-50, Border: green-200, Icon: green-500       │
│                                                                  │
│  Error:                                                          │
│  ┌───────────────────────────────────────────┐                  │
│  │ ✕  Stok tidak mencukupi                   │ ✕                │
│  └───────────────────────────────────────────┘                  │
│  Background: red-50, Border: red-200, Icon: red-500             │
│                                                                  │
│  Warning:                                                        │
│  ┌───────────────────────────────────────────┐                  │
│  │ ⚠️  Harga di bawah modal!                  │ ✕                │
│  └───────────────────────────────────────────┘                  │
│  Background: amber-50, Border: amber-200, Icon: amber-500       │
│                                                                  │
│  Info:                                                           │
│  ┌───────────────────────────────────────────┐                  │
│  │ ℹ️  Harga telah diperbarui oleh Owner      │ ✕                │
│  └───────────────────────────────────────────┘                  │
│  Background: blue-50, Border: blue-200, Icon: blue-500          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ POSISI: Bottom-right corner                                      │
│ DURASI: 5 detik (auto dismiss), atau sampai diklik              │
│ STACK: Max 3 toast, yang baru push ke atas                      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.8 Loading States

```
┌─────────────────────────────────────────────────────────────────┐
│ LOADING STATES                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Button Loading:                                                 │
│  ┌─────────────────────────┐                                    │
│  │  ◌  Menyimpan...        │  (spinner + text)                  │
│  └─────────────────────────┘                                    │
│                                                                  │
│  Page Loading:                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │                         ◌                                  │  │
│  │                   Memuat data...                          │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Skeleton Loading (untuk list/table):                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ████████████████████          ██████████    ████████      │  │
│  │ ██████████████████████████    ████████████  ██████        │  │
│  │ ████████████████              ██████████    ████████████  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  (animated shimmer effect)                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.9 Empty States

```
┌─────────────────────────────────────────────────────────────────┐
│ EMPTY STATES                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Keranjang Kosong:                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │                        🛒                                  │  │
│  │                                                            │  │
│  │               Keranjang masih kosong                      │  │
│  │                                                            │  │
│  │      Scan barcode atau cari produk untuk memulai         │  │
│  │                                                            │  │
│  │               [ 📷 Scan Barcode ]                         │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Tidak Ada Hasil:                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │                        🔍                                  │  │
│  │                                                            │  │
│  │          Tidak ada produk yang cocok                      │  │
│  │                                                            │  │
│  │      Coba kata kunci lain atau tambah produk baru        │  │
│  │                                                            │  │
│  │                  [ + Tambah Produk ]                       │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Layout System

### 5.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD LAYOUT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────┬────────────────────────────────────────────────────┐  │
│  │      │  HEADER                                             │  │
│  │      │  ┌─────────────────────────────────────────────────┐│  │
│  │      │  │ ☰  GuGaramKu    🔍 Search    🔔  👤 Ahmad ▼   ││  │
│  │      │  └─────────────────────────────────────────────────┘│  │
│  │  S   ├────────────────────────────────────────────────────┤  │
│  │  I   │                                                     │  │
│  │  D   │  MAIN CONTENT                                       │  │
│  │  E   │                                                     │  │
│  │  B   │  ┌─────────────────────────────────────────────┐   │  │
│  │  A   │  │                                             │   │  │
│  │  R   │  │                                             │   │  │
│  │      │  │           Page Content Here                 │   │  │
│  │  🛒  │  │                                             │   │  │
│  │  📦  │  │                                             │   │  │
│  │  📊  │  │                                             │   │  │
│  │  ⚙️  │  │                                             │   │  │
│  │      │  └─────────────────────────────────────────────┘   │  │
│  │      │                                                     │  │
│  └──────┴────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ SPESIFIKASI:                                                     │
│ - Sidebar width: 240px (collapsed: 64px)                        │
│ - Header height: 64px                                           │
│ - Content padding: 24px                                         │
│ - Max content width: 1440px (centered)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 POS/Kasir Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                           POS LAYOUT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🛒 KASIR                      Cabang: Sinjai  👤 Ahmad   │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ [H1 Eceran] [H2 Grosir] [H3 Reseller] [H4 Distri] │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐   │  │
│  │  │ [📷 Scan]  [🔍 Cari Produk...              ]       │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────┬─────────────────────────┐   │  │
│  │  │                          │                         │   │  │
│  │  │      PRODUCT GRID        │     CART SUMMARY        │   │  │
│  │  │      (Quick Select)      │                         │   │  │
│  │  │                          │     Item 1              │   │  │
│  │  │   ┌────┐ ┌────┐ ┌────┐  │     Item 2              │   │  │
│  │  │   │    │ │    │ │    │  │     Item 3              │   │  │
│  │  │   └────┘ └────┘ └────┘  │     ───────────────     │   │  │
│  │  │   ┌────┐ ┌────┐ ┌────┐  │     Subtotal: Rp xxx    │   │  │
│  │  │   │    │ │    │ │    │  │     Diskon:   Rp xxx    │   │  │
│  │  │   └────┘ └────┘ └────┘  │     ───────────────     │   │  │
│  │  │                          │     TOTAL: Rp xxx       │   │  │
│  │  │                          │                         │   │  │
│  │  │                          │  [████ BAYAR ████]      │   │  │
│  │  └──────────────────────────┴─────────────────────────┘   │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ SPESIFIKASI:                                                     │
│ - Full width, no sidebar (fokus pada transaksi)                 │
│ - Product grid: 60% width                                       │
│ - Cart summary: 40% width                                       │
│ - Sticky cart summary saat scroll product grid                  │
│ - Mobile: Stack vertical (products, then cart)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Responsive Breakpoints

### 6.1 Breakpoint Values

```css
/* Tailwind default breakpoints */
--screen-sm: 640px;   /* Small phones landscape */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Small laptops */
--screen-xl: 1280px;  /* Desktops */
--screen-2xl: 1536px; /* Large desktops */
```

### 6.2 Layout Adaptations

| Breakpoint | Sidebar | Layout | Navigation |
|------------|---------|--------|------------|
| < 768px | Hidden | Single column | Bottom nav |
| 768px - 1024px | Collapsed (icons) | Adaptive | Side nav |
| > 1024px | Expanded (full) | Multi-column | Side nav |

### 6.3 Mobile Considerations

- Touch targets minimum 44×44px
- Bottom navigation untuk aksi utama
- Swipe gestures untuk actions
- Pull-to-refresh untuk update data
- Bottom sheet untuk forms/dialogs

---

## 7. Accessibility

### 7.1 Color Contrast

- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Visible focus states
- Don't rely on color alone for information

### 7.2 Keyboard Navigation

```
TAB       → Move to next interactive element
SHIFT+TAB → Move to previous element
ENTER     → Activate button/link
SPACE     → Toggle checkbox, activate button
ESC       → Close modal/dropdown
ARROW     → Navigate within components
```

### 7.3 Screen Reader Support

- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for images
- ARIA labels for icon-only buttons
- Live regions for dynamic content
- Skip links for main content

---

## 8. Animation Guidelines

### 8.1 Timing

```css
/* Animation durations */
--duration-fast: 150ms;     /* Hover states, toggles */
--duration-normal: 200ms;   /* Transitions, small movements */
--duration-slow: 300ms;     /* Page transitions, modals */

/* Easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### 8.2 Motion Principles

- Purposeful: Animation should have meaning
- Quick: Don't make users wait
- Natural: Follow physical principles
- Consistent: Same action = same animation

### 8.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Iconography

### 9.1 Icon Library

Gunakan **Lucide Icons** (atau similar) untuk konsistensi.

### 9.2 Icon Sizes

| Size | Pixels | Use Case |
|------|--------|----------|
| xs | 12px | Inline with small text |
| sm | 16px | Buttons, inputs |
| md | 20px | Default |
| lg | 24px | Navigation, cards |
| xl | 32px | Empty states |

### 9.3 Icon + Text Pairing

```
✓ BENAR:  [🔍] Cari     (icon di kiri)
✓ BENAR:  Simpan [💾]   (icon di kanan untuk action)
✗ SALAH:  [🔍] [📦] [💰] Cari Produk  (terlalu banyak icon)
```

---

## 10. Error Handling

### 10.1 Form Validation

```
┌─────────────────────────────────────────────────────────────────┐
│ VALIDATION MESSAGES                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Inline Error (dibawah field):                                  │
│  ┌─────────────────────────────────────────┐                    │
│  │                                          │                    │
│  └─────────────────────────────────────────┘                    │
│  ⚠️ Harga tidak boleh kosong                                     │
│                                                                  │
│  Format pesan error:                                             │
│  - Jelaskan APA yang salah                                      │
│  - Jelaskan BAGAIMANA memperbaiki                               │
│                                                                  │
│  Contoh BAIK:                                                    │
│  "Harga harus lebih besar dari harga modal (Rp 2.800)"          │
│                                                                  │
│  Contoh BURUK:                                                   │
│  "Invalid input"                                                 │
│  "Error"                                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Error Pages

```
┌─────────────────────────────────────────────────────────────────┐
│ 404 - Halaman Tidak Ditemukan                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          😕                                      │
│                                                                  │
│              Halaman tidak ditemukan                            │
│                                                                  │
│    Halaman yang Anda cari tidak ada atau telah dipindahkan     │
│                                                                  │
│              [ Kembali ke Dashboard ]                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

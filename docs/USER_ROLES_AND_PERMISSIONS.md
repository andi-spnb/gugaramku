# 👥 USER ROLES AND PERMISSIONS — GUGARAMKU

## Peran Pengguna & Hak Akses

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |

---

## 1. Definisi Peran

### 1.1 Owner (Pemilik)

| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Pemilik toko dengan akses penuh ke seluruh sistem |
| **Jumlah** | 1 per instalasi |
| **Cabang** | Akses ke SEMUA cabang |
| **Platform** | Website, App Owner |
| **Dibuat oleh** | Sistem (saat setup awal) |

**Karakteristik:**
- Tidak terikat pada cabang tertentu (`cabang_id = NULL`)
- Dapat melihat data semua cabang
- Satu-satunya yang bisa mengubah harga
- Dapat override proteksi rugi dengan PIN

### 1.2 Admin Cabang

| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Pengelola cabang tertentu |
| **Jumlah** | 1+ per cabang |
| **Cabang** | Akses ke cabang yang ditugaskan saja |
| **Platform** | Website |
| **Dibuat oleh** | Owner |

**Karakteristik:**
- Terikat pada satu cabang (`cabang_id` wajib diisi)
- Dapat melihat harga modal
- Dapat mengelola stok
- Dapat melihat laporan cabangnya
- TIDAK dapat mengubah harga jual

### 1.3 Kasir

| Aspek | Detail |
|-------|--------|
| **Deskripsi** | Karyawan yang memproses transaksi penjualan |
| **Jumlah** | 1+ per cabang |
| **Cabang** | Akses ke cabang yang ditugaskan saja |
| **Platform** | Website, App Karyawan |
| **Dibuat oleh** | Owner atau Admin Cabang |

**Karakteristik:**
- Terikat pada satu cabang (`cabang_id` wajib diisi)
- TIDAK dapat melihat harga modal
- TIDAK dapat mengubah harga atau stok
- Hanya fokus pada transaksi penjualan

---

## 2. Matriks Hak Akses

### 2.1 Modul Autentikasi

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Login email + password | ✅ | ✅ | ✅ |
| Login PIN | ✅ | ✅ | ✅ |
| Ubah password sendiri | ✅ | ✅ | ✅ |
| Ubah PIN sendiri | ✅ | ✅ | ✅ |
| Reset password user lain | ✅ | ✅* | ❌ |

*Admin hanya bisa reset password kasir di cabangnya

### 2.2 Modul Point of Sale

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Akses halaman kasir | ✅ | ✅ | ✅ |
| Pilih tingkat harga (H1-H4) | ✅ | ✅ | ✅ |
| Scan/cari produk | ✅ | ✅ | ✅ |
| Pilih satuan penjualan | ✅ | ✅ | ✅ |
| Tambah/ubah/hapus item keranjang | ✅ | ✅ | ✅ |
| Quick Sale | ✅ | ✅ | ✅ |
| Berikan diskon item | ✅ | ✅ | ❌ |
| Berikan diskon total | ✅ | ✅ | ❌ |
| Hold transaksi | ✅ | ✅ | ✅ |
| Batalkan transaksi | ✅ | ✅ | ✅ |
| Edit harga saat transaksi | ✅ | ❌ | ❌ |
| Override proteksi rugi | ✅ | ❌ | ❌ |

### 2.3 Modul Pembayaran

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Proses pembayaran tunai | ✅ | ✅ | ✅ |
| Proses pembayaran QRIS | ✅ | ✅ | ✅ |
| Proses pembayaran transfer | ✅ | ✅ | ✅ |
| Proses pembayaran hutang | ✅ | ✅ | ✅* |
| Split payment | ✅ | ✅ | ❌ |

*Kasir hanya bisa jika pelanggan sudah terdaftar

### 2.4 Modul Struk

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Cetak struk | ✅ | ✅ | ✅ |
| Preview struk | ✅ | ✅ | ✅ |
| Cetak ulang struk | ✅ | ✅ | ✅ |
| Kirim struk via WhatsApp | ✅ | ✅ | ✅ |
| Kustomisasi format struk | ✅ | ❌ | ❌ |

### 2.5 Modul Produk

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat daftar produk | ✅ | ✅ | ✅ |
| Lihat detail produk | ✅ | ✅ | ✅* |
| Lihat harga modal | ✅ | ✅ | ❌ |
| Tambah produk baru | ✅ | ✅ | ❌ |
| Edit produk | ✅ | ✅ | ❌ |
| Hapus/nonaktifkan produk | ✅ | ✅ | ❌ |
| Tambah satuan produk | ✅ | ✅ | ❌ |
| Import produk dari Excel | ✅ | ✅ | ❌ |
| Export produk ke Excel | ✅ | ✅ | ❌ |

*Kasir tidak melihat harga modal di detail produk

### 2.6 Modul Harga

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat semua harga (H1-H4) | ✅ | ✅ | ✅* |
| Ubah harga jual | ✅ | ❌ | ❌ |
| Ubah harga modal | ✅ | ❌ | ❌ |
| Ubah nama tingkatan harga | ✅ | ❌ | ❌ |

*Kasir melihat harga jual saja, tidak modal

### 2.7 Modul Stok

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat stok | ✅ | ✅ | ✅ |
| Tambah stok (barang masuk) | ✅ | ✅ | ❌ |
| Kurangi stok (rusak/expired) | ✅ | ✅ | ❌ |
| Stok opname | ✅ | ✅ | ❌ |
| Set stok minimum | ✅ | ✅ | ❌ |
| Lihat riwayat mutasi stok | ✅ | ✅ | ❌ |

### 2.8 Modul Pelanggan

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat daftar pelanggan | ✅ | ✅ | ✅ |
| Tambah pelanggan | ✅ | ✅ | ✅* |
| Edit pelanggan | ✅ | ✅ | ❌ |
| Hapus pelanggan | ✅ | ✅ | ❌ |
| Lihat riwayat belanja | ✅ | ✅ | ❌ |
| Set batas hutang | ✅ | ✅ | ❌ |

*Kasir bisa tambah pelanggan baru saat transaksi (data minimal)

### 2.9 Modul Hutang/Piutang

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat daftar hutang | ✅ | ✅ | ❌ |
| Terima pembayaran hutang | ✅ | ✅ | ❌ |
| Cetak tagihan | ✅ | ✅ | ❌ |
| Lihat hutang jatuh tempo | ✅ | ✅ | ❌ |

### 2.10 Modul Retur

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Proses retur | ✅ | ✅ | ❌ |
| Lihat daftar retur | ✅ | ✅ | ❌ |

### 2.11 Modul Kas

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat saldo kas | ✅ | ✅ | ❌ |
| Catat kas masuk | ✅ | ✅ | ❌ |
| Catat kas keluar | ✅ | ✅ | ❌ |
| Lihat mutasi kas | ✅ | ✅ | ❌ |

### 2.12 Modul Shift

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Buka shift | ✅ | ✅ | ✅ |
| Tutup shift | ✅ | ✅ | ✅ |
| Lihat laporan shift sendiri | ✅ | ✅ | ✅ |
| Lihat laporan shift semua kasir | ✅ | ✅ | ❌ |

### 2.13 Modul Laporan

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Dashboard ringkasan | ✅ | ✅* | ❌ |
| Laporan penjualan | ✅ | ✅* | ❌ |
| Laporan laba/rugi | ✅ | ✅* | ❌ |
| Produk terlaris | ✅ | ✅* | ❌ |
| Export PDF | ✅ | ✅* | ❌ |
| Export Excel | ✅ | ✅* | ❌ |
| Laporan semua cabang | ✅ | ❌ | ❌ |

*Admin hanya untuk cabangnya

### 2.14 Modul Pengaturan

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Profil toko | ✅ | ❌ | ❌ |
| Info rekening bank | ✅ | ❌ | ❌ |
| QRIS | ✅ | ❌ | ❌ |
| Pengaturan printer | ✅ | ✅ | ❌ |
| Tema aplikasi | ✅ | ✅ | ✅ |
| Backup data | ✅ | ❌ | ❌ |
| Restore data | ✅ | ❌ | ❌ |

### 2.15 Modul User Management

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat daftar user | ✅ | ✅* | ❌ |
| Tambah user | ✅ | ✅** | ❌ |
| Edit user | ✅ | ✅** | ❌ |
| Nonaktifkan user | ✅ | ✅** | ❌ |
| Lihat log aktivitas | ✅ | ✅* | ❌ |

*Admin hanya user di cabangnya
**Admin hanya bisa manage Kasir di cabangnya

### 2.16 Modul Multi-Cabang

| Fitur | Owner | Admin | Kasir |
|-------|:-----:|:-----:|:-----:|
| Lihat semua cabang | ✅ | ❌ | ❌ |
| Tambah cabang | ✅ | ❌ | ❌ |
| Edit cabang | ✅ | ❌ | ❌ |
| Switch cabang | ✅ | ❌ | ❌ |
| Transfer stok antar cabang | ✅ | ✅* | ❌ |

*Admin bisa request transfer dari/ke cabangnya

---

## 3. Pembatasan Data

### 3.1 Data yang Disembunyikan dari Kasir

API response untuk role Kasir TIDAK boleh mengandung:

```typescript
// Fields yang di-exclude untuk Kasir
const HIDDEN_FROM_KASIR = [
  'harga_modal',      // Harga modal produk
  'laba',             // Laba per item/transaksi
  'margin',           // Persentase margin
  'total_modal',      // Total modal dalam laporan
  'total_laba',       // Total laba dalam laporan
];
```

### 3.2 Pembatasan Cabang

```typescript
// Middleware untuk filter data by cabang
function filterByCabang(user: User, query: Query) {
  if (user.role === 'OWNER') {
    // Owner bisa akses semua cabang
    return query;
  }
  
  // Admin dan Kasir hanya cabang sendiri
  return query.where({ cabangId: user.cabangId });
}
```

---

## 4. Implementasi Authorization

### 4.1 Role Enum

```typescript
// types/auth.ts
export enum Role {
  OWNER = 'OWNER',
  ADMIN_CABANG = 'ADMIN_CABANG',
  KASIR = 'KASIR',
}
```

### 4.2 Permission Constants

```typescript
// lib/permissions.ts

export const PERMISSIONS = {
  // Produk
  PRODUCT_VIEW: 'product:view',
  PRODUCT_VIEW_MODAL: 'product:view_modal',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Harga
  PRICE_VIEW: 'price:view',
  PRICE_UPDATE: 'price:update',
  
  // Stok
  STOCK_VIEW: 'stock:view',
  STOCK_ADJUST: 'stock:adjust',
  
  // Transaksi
  TRANSACTION_CREATE: 'transaction:create',
  TRANSACTION_VOID: 'transaction:void',
  TRANSACTION_OVERRIDE_LOSS: 'transaction:override_loss',
  
  // Diskon
  DISCOUNT_ITEM: 'discount:item',
  DISCOUNT_TOTAL: 'discount:total',
  
  // Laporan
  REPORT_VIEW: 'report:view',
  REPORT_PROFIT: 'report:profit',
  REPORT_ALL_BRANCHES: 'report:all_branches',
  
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // Cabang
  BRANCH_VIEW_ALL: 'branch:view_all',
  BRANCH_MANAGE: 'branch:manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

### 4.3 Role-Permission Mapping

```typescript
// lib/role-permissions.ts

import { Role } from '@/types/auth';
import { PERMISSIONS, Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    // Owner punya SEMUA permission
    ...Object.values(PERMISSIONS),
  ],
  
  [Role.ADMIN_CABANG]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_VIEW_MODAL,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRICE_VIEW,
    // PERMISSIONS.PRICE_UPDATE, // Admin TIDAK bisa update harga
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.TRANSACTION_CREATE,
    PERMISSIONS.TRANSACTION_VOID,
    // PERMISSIONS.TRANSACTION_OVERRIDE_LOSS, // Admin TIDAK bisa override
    PERMISSIONS.DISCOUNT_ITEM,
    PERMISSIONS.DISCOUNT_TOTAL,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_PROFIT,
    // PERMISSIONS.REPORT_ALL_BRANCHES, // Admin TIDAK bisa lihat semua cabang
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE, // Hanya kasir di cabangnya
    PERMISSIONS.USER_UPDATE, // Hanya kasir di cabangnya
    PERMISSIONS.USER_DELETE, // Hanya kasir di cabangnya
    PERMISSIONS.SETTINGS_VIEW,
    // PERMISSIONS.SETTINGS_UPDATE, // Hanya printer setting
  ],
  
  [Role.KASIR]: [
    PERMISSIONS.PRODUCT_VIEW,
    // PERMISSIONS.PRODUCT_VIEW_MODAL, // Kasir TIDAK bisa lihat modal
    PERMISSIONS.PRICE_VIEW,
    PERMISSIONS.STOCK_VIEW, // View only
    PERMISSIONS.TRANSACTION_CREATE,
    // Kasir TIDAK punya permission diskon, laporan, user management, settings
  ],
};
```

### 4.4 Authorization Middleware

```typescript
// middleware/authorize.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ROLE_PERMISSIONS } from '@/lib/role-permissions';
import { Permission } from '@/lib/permissions';

export function withPermission(permission: Permission) {
  return async function middleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userRole = session.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole];
    
    if (!userPermissions.includes(permission)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return handler();
  };
}
```

### 4.5 Frontend Permission Check

```typescript
// hooks/use-permission.ts

import { useSession } from 'next-auth/react';
import { ROLE_PERMISSIONS } from '@/lib/role-permissions';
import { Permission } from '@/lib/permissions';

export function usePermission() {
  const { data: session } = useSession();
  
  const hasPermission = (permission: Permission): boolean => {
    if (!session?.user?.role) return false;
    
    const userPermissions = ROLE_PERMISSIONS[session.user.role];
    return userPermissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };
  
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role: session?.user?.role,
    isOwner: session?.user?.role === 'OWNER',
    isAdmin: session?.user?.role === 'ADMIN_CABANG',
    isKasir: session?.user?.role === 'KASIR',
  };
}
```

### 4.6 Usage Example

```tsx
// components/product-price-cell.tsx

import { usePermission } from '@/hooks/use-permission';
import { PERMISSIONS } from '@/lib/permissions';
import { formatRupiah } from '@/lib/utils/currency';

interface ProductPriceCellProps {
  hargaModal: number;
  hargaJual: number;
}

export function ProductPriceCell({ hargaModal, hargaJual }: ProductPriceCellProps) {
  const { hasPermission } = usePermission();
  const canViewModal = hasPermission(PERMISSIONS.PRODUCT_VIEW_MODAL);
  
  return (
    <div>
      <div className="font-medium">{formatRupiah(hargaJual)}</div>
      {canViewModal && (
        <div className="text-sm text-muted-foreground">
          Modal: {formatRupiah(hargaModal)}
        </div>
      )}
    </div>
  );
}
```

---

## 5. API Response Filtering

### 5.1 Product Response

```typescript
// lib/api/product-response.ts

import { Role } from '@/types/auth';
import { Produk, ProdukSatuan } from '@prisma/client';

interface ProductWithUnits extends Produk {
  produkSatuan: ProdukSatuan[];
}

export function filterProductResponse(
  product: ProductWithUnits,
  userRole: Role
): Partial<ProductWithUnits> {
  // Base response untuk semua role
  const baseResponse = {
    id: product.id,
    barcode: product.barcode,
    nama: product.nama,
    kategoriId: product.kategoriId,
    satuanDasar: product.satuanDasar,
    gambar: product.gambar,
    isActive: product.isActive,
    produkSatuan: product.produkSatuan.map(unit => ({
      id: unit.id,
      namaSatuan: unit.namaSatuan,
      konversi: unit.konversi,
      harga1: unit.harga1,
      harga2: unit.harga2,
      harga3: unit.harga3,
      harga4: unit.harga4,
      isDefault: unit.isDefault,
    })),
  };
  
  // Tambahkan harga modal untuk Owner dan Admin
  if (userRole === 'OWNER' || userRole === 'ADMIN_CABANG') {
    return {
      ...baseResponse,
      hargaModal: product.hargaModal,
    };
  }
  
  // Kasir tidak dapat harga modal
  return baseResponse;
}
```

### 5.2 Transaction Response

```typescript
// lib/api/transaction-response.ts

import { Role } from '@/types/auth';

export function filterTransactionResponse(
  transaction: TransactionWithDetails,
  userRole: Role
) {
  const baseResponse = {
    id: transaction.id,
    nomor: transaction.nomor,
    tanggal: transaction.tanggal,
    tingkatHarga: transaction.tingkatHarga,
    subtotal: transaction.subtotal,
    diskon: transaction.diskon,
    total: transaction.total,
    metodeBayar: transaction.metodeBayar,
    jumlahBayar: transaction.jumlahBayar,
    kembalian: transaction.kembalian,
    status: transaction.status,
    detailTransaksi: transaction.detailTransaksi.map(detail => ({
      id: detail.id,
      namaBarang: detail.namaBarang,
      jumlah: detail.jumlah,
      satuan: detail.satuan,
      hargaJual: detail.hargaJual,
      subtotal: detail.subtotal,
      // hargaModal dan laba TIDAK disertakan untuk kasir
      ...(userRole !== 'KASIR' && {
        hargaModal: detail.hargaModal,
        laba: detail.laba,
      }),
    })),
  };
  
  // Tambahkan total laba untuk Owner dan Admin
  if (userRole !== 'KASIR') {
    const totalLaba = transaction.detailTransaksi.reduce(
      (sum, d) => sum + Number(d.laba),
      0
    );
    return { ...baseResponse, totalLaba };
  }
  
  return baseResponse;
}
```

---

## 6. Menu Visibility

### 6.1 Sidebar Menu Configuration

```typescript
// config/navigation.ts

import { Role } from '@/types/auth';
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  Wallet,
  RotateCcw,
  Building2,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType;
  roles: Role[]; // Role yang bisa akses menu ini
  children?: NavItem[];
}

export const NAVIGATION: NavItem[] = [
  {
    title: 'Kasir',
    href: '/kasir',
    icon: ShoppingCart,
    roles: ['OWNER', 'ADMIN_CABANG', 'KASIR'],
  },
  {
    title: 'Produk',
    href: '/produk',
    icon: Package,
    roles: ['OWNER', 'ADMIN_CABANG'],
    children: [
      { title: 'Daftar Produk', href: '/produk', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Kategori', href: '/produk/kategori', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Stok', href: '/produk/stok', roles: ['OWNER', 'ADMIN_CABANG'] },
    ],
  },
  {
    title: 'Pelanggan',
    href: '/pelanggan',
    icon: Users,
    roles: ['OWNER', 'ADMIN_CABANG'],
    children: [
      { title: 'Daftar Pelanggan', href: '/pelanggan', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Hutang', href: '/pelanggan/hutang', roles: ['OWNER', 'ADMIN_CABANG'] },
    ],
  },
  {
    title: 'Kas',
    href: '/kas',
    icon: Wallet,
    roles: ['OWNER', 'ADMIN_CABANG'],
  },
  {
    title: 'Retur',
    href: '/retur',
    icon: RotateCcw,
    roles: ['OWNER', 'ADMIN_CABANG'],
  },
  {
    title: 'Laporan',
    href: '/laporan',
    icon: BarChart3,
    roles: ['OWNER', 'ADMIN_CABANG'],
    children: [
      { title: 'Dashboard', href: '/laporan', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Penjualan', href: '/laporan/penjualan', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Laba', href: '/laporan/laba', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Produk Terlaris', href: '/laporan/terlaris', roles: ['OWNER', 'ADMIN_CABANG'] },
      { title: 'Shift', href: '/laporan/shift', roles: ['OWNER', 'ADMIN_CABANG'] },
    ],
  },
  {
    title: 'Cabang',
    href: '/cabang',
    icon: Building2,
    roles: ['OWNER'], // Hanya Owner
  },
  {
    title: 'Karyawan',
    href: '/karyawan',
    icon: ClipboardList,
    roles: ['OWNER', 'ADMIN_CABANG'],
  },
  {
    title: 'Pengaturan',
    href: '/pengaturan',
    icon: Settings,
    roles: ['OWNER'],
  },
];
```

---

## 7. Security Considerations

### 7.1 Server-Side Validation

```typescript
// SELALU validasi di server, jangan percaya client

// ❌ SALAH - Hanya cek di frontend
const canEdit = user.role === 'OWNER';

// ✅ BENAR - Validasi di API route
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== 'OWNER') {
    return NextResponse.json(
      { error: 'Hanya Owner yang dapat mengubah harga' },
      { status: 403 }
    );
  }
  
  // ... proses update
}
```

### 7.2 Data Leakage Prevention

```typescript
// Jangan pernah mengirim data sensitif ke role yang tidak berhak

// ❌ SALAH - Kirim semua data, hide di frontend
const product = await prisma.produk.findUnique({ ... });
return NextResponse.json(product); // hargaModal ikut terkirim!

// ✅ BENAR - Filter data di server
const product = await prisma.produk.findUnique({ ... });
const filtered = filterProductResponse(product, session.user.role);
return NextResponse.json(filtered);
```

### 7.3 Branch Isolation

```typescript
// Selalu filter data berdasarkan cabang user

// ❌ SALAH - Tidak filter cabang
const transactions = await prisma.transaksi.findMany();

// ✅ BENAR - Filter by cabang
const transactions = await prisma.transaksi.findMany({
  where: session.user.role === 'OWNER' 
    ? {} 
    : { cabangId: session.user.cabangId },
});
```

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

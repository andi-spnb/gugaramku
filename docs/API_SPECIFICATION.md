# 🔌 API SPECIFICATION — GUGARAMKU

## Spesifikasi API

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |
| **Base URL** | `/api` |
| **Format** | JSON |
| **Authentication** | JWT Bearer Token |

---

## 1. Konvensi Umum

### 1.1 HTTP Methods

| Method | Penggunaan |
|--------|------------|
| `GET` | Mengambil data (read) |
| `POST` | Membuat data baru (create) |
| `PATCH` | Update sebagian data (partial update) |
| `DELETE` | Menghapus data (soft delete) |

### 1.2 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Harga tidak boleh kosong",
    "details": [
      {
        "field": "harga1",
        "message": "Harga 1 wajib diisi"
      }
    ]
  }
}
```

### 1.3 HTTP Status Codes

| Code | Meaning | Penggunaan |
|------|---------|------------|
| 200 | OK | Request berhasil |
| 201 | Created | Resource berhasil dibuat |
| 400 | Bad Request | Validasi gagal |
| 401 | Unauthorized | Token tidak valid/expired |
| 403 | Forbidden | Tidak punya akses |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Duplikat data |
| 422 | Unprocessable | Business logic error |
| 500 | Internal Error | Server error |

### 1.4 Authentication Header

```
Authorization: Bearer <jwt_token>
```

### 1.5 Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Halaman ke-n |
| `limit` | number | 10 | Jumlah per halaman (max: 100) |
| `sort` | string | createdAt | Field untuk sorting |
| `order` | string | desc | asc / desc |

### 1.6 Filter Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `search` | string | "indomie" | Pencarian teks |
| `kategoriId` | uuid | "uuid..." | Filter by kategori |
| `isActive` | boolean | true | Filter by status |
| `startDate` | date | "2026-11-01" | Tanggal mulai |
| `endDate` | date | "2026-11-30" | Tanggal akhir |

---

## 2. Authentication Endpoints

### 2.1 Login dengan Email

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "ahmad@gugaramku.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "nama": "Ahmad",
      "email": "ahmad@gugaramku.com",
      "role": "KASIR",
      "cabangId": "uuid",
      "cabang": {
        "id": "uuid",
        "kode": "SJI",
        "nama": "Cabang Sinjai"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### 2.2 Login dengan PIN

```
POST /api/auth/login-pin
```

**Request Body:**
```json
{
  "email": "ahmad@gugaramku.com",
  "pin": "1234"
}
```

### 2.3 Refresh Token

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.4 Logout

```
POST /api/auth/logout
```

### 2.5 Lupa Password

```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "ahmad@gugaramku.com"
}
```

### 2.6 Reset Password

```
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}
```

---

## 3. Product Endpoints

### 3.1 List Products

```
GET /api/products
```

**Query Parameters:**
- `page`, `limit`, `sort`, `order`
- `search` - Cari nama/barcode
- `kategoriId` - Filter kategori
- `isActive` - Filter status

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "barcode": "8991234567890",
      "nama": "Indomie Goreng",
      "kategori": {
        "id": "uuid",
        "nama": "Makanan Instan"
      },
      "hargaModal": 2800,  // Hanya untuk Owner/Admin
      "satuanDasar": "bks",
      "gambar": "/uploads/products/indomie.jpg",
      "isActive": true,
      "stok": {
        "jumlah": 150,
        "stokMinimum": 20
      },
      "produkSatuan": [
        {
          "id": "uuid",
          "namaSatuan": "bks",
          "konversi": 1,
          "harga1": 3500,
          "harga2": 3300,
          "harga3": 3200,
          "harga4": 3100,
          "isDefault": true
        },
        {
          "id": "uuid",
          "namaSatuan": "dos",
          "konversi": 40,
          "harga1": 135000,
          "harga2": 130000,
          "harga3": 125000,
          "harga4": 120000,
          "isDefault": false
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16
  }
}
```

### 3.2 Get Product by ID

```
GET /api/products/:id
```

### 3.3 Get Product by Barcode

```
GET /api/products/barcode/:code
```

### 3.4 Create Product

```
POST /api/products
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "barcode": "8991234567890",
  "nama": "Indomie Goreng",
  "kategoriId": "uuid",
  "hargaModal": 2800,
  "satuanDasar": "bks",
  "stokAwal": 100,
  "stokMinimum": 20,
  "satuan": [
    {
      "namaSatuan": "bks",
      "konversi": 1,
      "harga1": 3500,
      "harga2": 3300,
      "harga3": 3200,
      "harga4": 3100,
      "isDefault": true
    },
    {
      "namaSatuan": "dos",
      "konversi": 40,
      "harga1": 135000,
      "harga2": 130000,
      "harga3": 125000,
      "harga4": 120000,
      "isDefault": false
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "barcode": "8991234567890",
    "nama": "Indomie Goreng",
    ...
  },
  "message": "Produk berhasil ditambahkan"
}
```

### 3.5 Update Product

```
PATCH /api/products/:id
```

**Authorization:** Owner, Admin

**Request Body (partial update):**
```json
{
  "nama": "Indomie Goreng Special",
  "kategoriId": "uuid"
}
```

### 3.6 Update Product Prices

```
PATCH /api/products/:id/prices
```

**Authorization:** Owner ONLY

**Request Body:**
```json
{
  "hargaModal": 2900,
  "satuan": [
    {
      "id": "uuid",
      "harga1": 3600,
      "harga2": 3400,
      "harga3": 3300,
      "harga4": 3200
    }
  ]
}
```

### 3.7 Delete Product (Soft Delete)

```
DELETE /api/products/:id
```

**Authorization:** Owner, Admin

### 3.8 Import Products

```
POST /api/products/import
```

**Authorization:** Owner, Admin

**Content-Type:** multipart/form-data

**Request:**
- `file`: Excel file (.xlsx)

### 3.9 Export Products

```
GET /api/products/export
```

**Authorization:** Owner, Admin

**Query Parameters:**
- `format`: xlsx / csv

---

## 4. Product Unit Endpoints

### 4.1 Add Unit to Product

```
POST /api/products/:productId/units
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "namaSatuan": "bal",
  "konversi": 200,
  "harga1": 650000,
  "harga2": 630000,
  "harga3": 620000,
  "harga4": 600000,
  "isDefault": false
}
```

### 4.2 Update Unit

```
PATCH /api/products/:productId/units/:unitId
```

### 4.3 Delete Unit

```
DELETE /api/products/:productId/units/:unitId
```

---

## 5. Category Endpoints

### 5.1 List Categories

```
GET /api/categories
```

### 5.2 Create Category

```
POST /api/categories
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "nama": "Makanan Instan",
  "deskripsi": "Mie, bubur, dll",
  "urutan": 1
}
```

### 5.3 Update Category

```
PATCH /api/categories/:id
```

### 5.4 Delete Category

```
DELETE /api/categories/:id
```

---

## 6. Stock Endpoints

### 6.1 List Stock

```
GET /api/stock
```

**Query Parameters:**
- `cabangId` - Filter by cabang (auto-filter untuk non-Owner)
- `status` - `low` (stok menipis), `empty` (stok habis)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "produk": {
        "id": "uuid",
        "barcode": "8991234567890",
        "nama": "Indomie Goreng",
        "satuanDasar": "bks"
      },
      "cabang": {
        "id": "uuid",
        "nama": "Cabang Sinjai"
      },
      "jumlah": 150,
      "stokMinimum": 20,
      "status": "normal"  // normal, low, empty
    }
  ]
}
```

### 6.2 Get Stock for Product

```
GET /api/stock/product/:productId
```

### 6.3 Adjust Stock

```
POST /api/stock/adjust
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "produkId": "uuid",
  "cabangId": "uuid",
  "jumlah": 50,
  "tipe": "MASUK",  // MASUK, RUSAK, EXPIRED, ADJUSTMENT_PLUS, ADJUSTMENT_MINUS
  "keterangan": "Barang masuk dari supplier",
  "hargaBeli": 2800  // Optional, untuk MASUK
}
```

### 6.4 Stock Opname

```
POST /api/stock/opname
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "cabangId": "uuid",
  "items": [
    {
      "produkId": "uuid",
      "jumlahFisik": 145,
      "keterangan": "Selisih 5 bks"
    }
  ]
}
```

### 6.5 Stock Movement History

```
GET /api/stock/movements/:productId
```

**Query Parameters:**
- `cabangId`
- `startDate`, `endDate`
- `tipe` - Filter by tipe mutasi

---

## 7. Transaction Endpoints

### 7.1 List Transactions

```
GET /api/transactions
```

**Query Parameters:**
- `cabangId`
- `kasirId`
- `startDate`, `endDate`
- `status` - SELESAI, BATAL, HOLD
- `metodeBayar` - TUNAI, QRIS, TRANSFER, HUTANG

### 7.2 Get Transaction Detail

```
GET /api/transactions/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nomor": "GGK-SJI-20261102-0001",
    "tanggal": "2026-11-02T10:30:00Z",
    "cabang": {
      "id": "uuid",
      "nama": "Cabang Sinjai"
    },
    "kasir": {
      "id": "uuid",
      "nama": "Ahmad"
    },
    "pelanggan": null,
    "tingkatHarga": 1,
    "subtotal": 320500,
    "diskon": 0,
    "total": 320500,
    "metodeBayar": "TUNAI",
    "jumlahBayar": 350000,
    "kembalian": 29500,
    "status": "SELESAI",
    "detailTransaksi": [
      {
        "id": "uuid",
        "namaBarang": "Indomie Goreng",
        "barcode": "8991234567890",
        "jumlah": 5,
        "satuan": "bks",
        "konversi": 1,
        "hargaJual": 3500,
        "tingkatHarga": 1,
        "subtotal": 17500,
        "hargaModal": 2800,  // Hanya untuk Owner/Admin
        "laba": 3500         // Hanya untuk Owner/Admin
      }
    ],
    "totalLaba": 12500  // Hanya untuk Owner/Admin
  }
}
```

### 7.3 Create Transaction (Sale)

```
POST /api/transactions
```

**Request Body:**
```json
{
  "id": "uuid",  // Client-generated UUID untuk offline support
  "cabangId": "uuid",
  "pelangganId": null,
  "tingkatHarga": 1,
  "items": [
    {
      "produkId": "uuid",
      "produkSatuanId": "uuid",
      "jumlah": 5
    },
    {
      "produkId": "uuid",
      "produkSatuanId": "uuid",
      "jumlah": 2
    }
  ],
  "diskon": 0,
  "metodeBayar": "TUNAI",
  "jumlahBayar": 350000,
  "catatan": null,
  "deviceId": "device-123"  // Untuk tracking offline
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nomor": "GGK-SJI-20261102-0001",
    "total": 320500,
    "kembalian": 29500,
    ...
  },
  "message": "Transaksi berhasil"
}
```

### 7.4 Quick Sale

```
POST /api/transactions/quick-sale
```

**Request Body:**
```json
{
  "cabangId": "uuid",
  "tingkatHarga": 1,
  "items": [
    {
      "namaBarang": "Barang Tanpa Barcode",
      "jumlah": 1,
      "satuan": "pcs",
      "hargaJual": 15000
    }
  ],
  "metodeBayar": "TUNAI",
  "jumlahBayar": 15000
}
```

### 7.5 Hold Transaction

```
POST /api/transactions/hold
```

**Request Body:**
```json
{
  "cabangId": "uuid",
  "tingkatHarga": 1,
  "items": [...],
  "catatan": "Pelanggan masih pilih-pilih"
}
```

### 7.6 Resume Held Transaction

```
POST /api/transactions/hold/:id/resume
```

### 7.7 Void Transaction

```
POST /api/transactions/:id/void
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "alasan": "Pembeli batal"
}
```

---

## 8. Customer Endpoints

### 8.1 List Customers

```
GET /api/customers
```

### 8.2 Get Customer

```
GET /api/customers/:id
```

### 8.3 Create Customer

```
POST /api/customers
```

**Request Body:**
```json
{
  "nama": "Toko Makmur",
  "telepon": "08123456789",
  "alamat": "Jl. Contoh No. 123",
  "kategori": "RESELLER",
  "maxHutang": 5000000
}
```

### 8.4 Update Customer

```
PATCH /api/customers/:id
```

### 8.5 Customer Purchase History

```
GET /api/customers/:id/transactions
```

### 8.6 Customer Debt Summary

```
GET /api/customers/:id/debts
```

---

## 9. Debt Endpoints

### 9.1 List All Debts

```
GET /api/debts
```

**Query Parameters:**
- `status` - BELUM_LUNAS, LUNAS
- `pelangganId`
- `dueSoon` - true (jatuh tempo dalam 7 hari)

### 9.2 Get Debts by Customer

```
GET /api/debts/customer/:customerId
```

### 9.3 Record Debt Payment

```
POST /api/debts/:id/payment
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "jumlah": 500000,
  "metode": "TUNAI",
  "catatan": "Bayar sebagian"
}
```

### 9.4 Get Debts Due Soon

```
GET /api/debts/due
```

---

## 10. Report Endpoints

### 10.1 Dashboard Summary

```
GET /api/reports/dashboard
```

**Authorization:** Owner, Admin

**Query Parameters:**
- `cabangId` (optional untuk Owner)
- `date` - Tanggal (default: hari ini)

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "penjualan": 5250000,
      "modal": 4100000,
      "laba": 1150000,
      "transaksi": 47,
      "rataRataTransaksi": 111702
    },
    "week": {
      "penjualan": 35000000,
      "laba": 8500000
    },
    "month": {
      "penjualan": 150000000,
      "laba": 42000000
    },
    "alerts": {
      "stokMenipis": 5,
      "stokHabis": 2,
      "hutangJatuhTempo": 1
    },
    "topProducts": [
      {
        "id": "uuid",
        "nama": "Indomie Goreng",
        "terjual": 250,
        "omzet": 875000
      }
    ]
  }
}
```

### 10.2 Sales Report

```
GET /api/reports/sales
```

**Query Parameters:**
- `cabangId`
- `startDate`, `endDate`
- `groupBy` - day, week, month

### 10.3 Profit Report

```
GET /api/reports/profit
```

**Authorization:** Owner, Admin

**Query Parameters:**
- `cabangId`
- `startDate`, `endDate`
- `groupBy` - day, week, month

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPenjualan": 85000000,
      "totalModal": 66000000,
      "totalLaba": 19000000,
      "margin": 22.4,
      "jumlahTransaksi": 892
    },
    "details": [
      {
        "tanggal": "2026-11-01",
        "penjualan": 4500000,
        "modal": 3500000,
        "laba": 1000000,
        "margin": 22.2,
        "transaksi": 45
      }
    ]
  }
}
```

### 10.4 Top Products

```
GET /api/reports/top-products
```

**Query Parameters:**
- `cabangId`
- `startDate`, `endDate`
- `limit` - default 10
- `sortBy` - quantity, revenue, profit

### 10.5 Export Report

```
GET /api/reports/export/:type
```

**Parameters:**
- `type`: sales, profit, products, stock

**Query Parameters:**
- `format`: pdf, xlsx
- `cabangId`
- `startDate`, `endDate`

---

## 11. Settings Endpoints

### 11.1 Get Store Settings

```
GET /api/settings/store
```

### 11.2 Update Store Settings

```
PATCH /api/settings/store
```

**Authorization:** Owner

**Request Body:**
```json
{
  "namaToko": "GuGaramKu",
  "alamat": "Jl. Contoh No. 123",
  "telepon": "0812-xxxx-xxxx",
  "footerStruk": "Terima Kasih!",
  "printerSize": "58mm"
}
```

### 11.3 Get Price Level Names

```
GET /api/settings/price-levels
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "tingkat": 1, "nama": "Eceran", "warna": "#3498db" },
    { "tingkat": 2, "nama": "Grosir", "warna": "#27ae60" },
    { "tingkat": 3, "nama": "Reseller", "warna": "#f39c12" },
    { "tingkat": 4, "nama": "Distributor", "warna": "#9b59b6" }
  ]
}
```

### 11.4 Update Price Level Names

```
PATCH /api/settings/price-levels
```

**Authorization:** Owner

**Request Body:**
```json
{
  "levels": [
    { "tingkat": 1, "nama": "Retail", "warna": "#3498db" },
    { "tingkat": 2, "nama": "Wholesale", "warna": "#27ae60" }
  ]
}
```

### 11.5 Upload Logo

```
POST /api/settings/logo
```

**Authorization:** Owner

**Content-Type:** multipart/form-data

### 11.6 Upload QRIS

```
POST /api/settings/qris
```

**Authorization:** Owner

**Content-Type:** multipart/form-data

---

## 12. User Management Endpoints

### 12.1 List Users

```
GET /api/users
```

**Authorization:** Owner (all), Admin (cabang sendiri)

### 12.2 Get User

```
GET /api/users/:id
```

### 12.3 Create User

```
POST /api/users
```

**Authorization:** Owner (any role), Admin (Kasir only)

**Request Body:**
```json
{
  "nama": "Budi Kasir",
  "email": "budi@gugaramku.com",
  "password": "password123",
  "pin": "1234",
  "role": "KASIR",
  "cabangId": "uuid"
}
```

### 12.4 Update User

```
PATCH /api/users/:id
```

### 12.5 Deactivate User

```
DELETE /api/users/:id
```

### 12.6 Reset User Password

```
POST /api/users/:id/reset-password
```

**Authorization:** Owner (any), Admin (Kasir di cabangnya)

---

## 13. Shift Endpoints

### 13.1 Open Shift

```
POST /api/shifts/open
```

**Request Body:**
```json
{
  "modalAwal": 500000
}
```

### 13.2 Close Shift

```
POST /api/shifts/close
```

**Request Body:**
```json
{
  "kasAkhirAktual": 1250000,
  "catatan": "Serah terima ke shift malam"
}
```

### 13.3 Get Current Shift

```
GET /api/shifts/current
```

### 13.4 Get Shift History

```
GET /api/shifts
```

**Query Parameters:**
- `kasirId`
- `startDate`, `endDate`

---

## 14. Sync Endpoints

### 14.1 Push Pending Transactions

```
POST /api/sync/push
```

**Request Body:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "nomor": "GGK-SJI-20261102-0001",
      "tanggal": "2026-11-02T10:30:00Z",
      ...
    }
  ],
  "deviceId": "device-123",
  "lastSyncTime": "2026-11-02T09:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 5,
    "failed": 0,
    "conflicts": []
  }
}
```

### 14.2 Pull Updates

```
GET /api/sync/pull
```

**Query Parameters:**
- `lastSyncTime` - ISO datetime
- `tables` - products, stock, customers, settings

**Response:**
```json
{
  "success": true,
  "data": {
    "products": {
      "created": [...],
      "updated": [...],
      "deleted": [...]
    },
    "stock": {...},
    "customers": {...},
    "settings": {...},
    "syncTime": "2026-11-02T11:00:00Z"
  }
}
```

### 14.3 Get Sync Status

```
GET /api/sync/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingTransactions": 3,
    "lastSyncTime": "2026-11-02T10:30:00Z",
    "serverTime": "2026-11-02T11:00:00Z"
  }
}
```

---

## 15. Return (Retur) Endpoints

### 15.1 Create Return

```
POST /api/returns
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "transaksiAsalId": "uuid",
  "items": [
    {
      "detailTransaksiId": "uuid",
      "jumlah": 2,
      "alasan": "RUSAK"
    }
  ],
  "metodeRefund": "TUNAI",
  "catatan": "Kemasan rusak"
}
```

### 15.2 List Returns

```
GET /api/returns
```

### 15.3 Get Return Detail

```
GET /api/returns/:id
```

---

## 16. Branch Endpoints (Fase 5)

### 16.1 List Branches

```
GET /api/branches
```

**Authorization:** Owner

### 16.2 Create Branch

```
POST /api/branches
```

**Authorization:** Owner

### 16.3 Update Branch

```
PATCH /api/branches/:id
```

### 16.4 Stock Transfer Between Branches

```
POST /api/branches/transfer-stock
```

**Authorization:** Owner, Admin

**Request Body:**
```json
{
  "fromCabangId": "uuid",
  "toCabangId": "uuid",
  "items": [
    {
      "produkId": "uuid",
      "jumlah": 50
    }
  ],
  "catatan": "Transfer stok mingguan"
}
```

---

## 17. Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Email/password salah |
| `AUTH_INVALID_PIN` | PIN salah |
| `AUTH_TOKEN_EXPIRED` | Token kadaluarsa |
| `AUTH_FORBIDDEN` | Tidak punya akses |
| `VALIDATION_ERROR` | Input tidak valid |
| `RESOURCE_NOT_FOUND` | Data tidak ditemukan |
| `RESOURCE_DUPLICATE` | Data sudah ada |
| `STOCK_INSUFFICIENT` | Stok tidak mencukupi |
| `PRICE_BELOW_COST` | Harga di bawah modal |
| `DEBT_LIMIT_EXCEEDED` | Hutang melebihi batas |
| `SHIFT_ALREADY_OPEN` | Shift sudah dibuka |
| `SHIFT_NOT_OPEN` | Tidak ada shift aktif |
| `SYNC_CONFLICT` | Konflik saat sinkronisasi |

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

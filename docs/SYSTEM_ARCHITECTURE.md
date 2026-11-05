# 🏗️ SYSTEM ARCHITECTURE — GUGARAMKU

## Arsitektur Sistem

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |
| **Pola Arsitektur** | Monolith Modular + Offline-First |

---

## 1. Gambaran Umum

GuGaramKu menggunakan arsitektur **Monolith Modular** dengan kemampuan **Offline-First**. Pendekatan ini dipilih karena:

1. **Kompleksitas terkontrol** — Satu codebase lebih mudah di-deploy dan maintain untuk tim kecil
2. **Offline capability** — Retail POS harus tetap berjalan tanpa internet
3. **Real-time sync** — Perubahan harga/stok harus segera tersinkron ke semua device
4. **Skalabilitas bertahap** — Mudah dipecah menjadi microservices di masa depan jika diperlukan

---

## 2. Diagram Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD SERVER (VPS)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           NGINX (Reverse Proxy)                         ││
│  │                         SSL Termination + Load Balancer                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                       │
│  ┌───────────────────────────────────┴───────────────────────────────────┐  │
│  │                                                                        │  │
│  │  ┌──────────────────────────┐    ┌──────────────────────────────────┐ │  │
│  │  │      NEXT.JS SERVER      │    │        SOCKET.IO SERVER          │ │  │
│  │  │  ┌────────────────────┐  │    │  ┌────────────────────────────┐  │ │  │
│  │  │  │   App Router       │  │    │  │   Real-time Events         │  │ │  │
│  │  │  │   (Pages + API)    │  │    │  │   - Price Updates          │  │ │  │
│  │  │  ├────────────────────┤  │    │  │   - Stock Updates          │  │ │  │
│  │  │  │   API Routes       │  │    │  │   - Sync Status            │  │ │  │
│  │  │  │   (/api/*)         │  │    │  │   - Notifications          │  │ │  │
│  │  │  ├────────────────────┤  │    │  └────────────────────────────┘  │ │  │
│  │  │  │   Server Actions   │  │    └──────────────────────────────────┘ │  │
│  │  │  └────────────────────┘  │                                         │  │
│  │  │            │             │                                         │  │
│  │  │  ┌─────────▼──────────┐  │    ┌──────────────────────────────────┐ │  │
│  │  │  │   Business Logic   │  │    │        BACKGROUND JOBS           │ │  │
│  │  │  │   (Services)       │  │    │  ┌────────────────────────────┐  │ │  │
│  │  │  └─────────┬──────────┘  │    │  │   - Daily Backup           │  │ │  │
│  │  │            │             │    │  │   - Report Generation      │  │ │  │
│  │  │  ┌─────────▼──────────┐  │    │  │   - Notification Sender    │  │ │  │
│  │  │  │      PRISMA ORM    │  │    │  │   - Stock Alert Check      │  │ │  │
│  │  │  └─────────┬──────────┘  │    │  └────────────────────────────┘  │ │  │
│  │  └────────────┼─────────────┘    └──────────────────────────────────┘ │  │
│  │               │                                                        │  │
│  └───────────────┼────────────────────────────────────────────────────────┘  │
│                  │                                                           │
│  ┌───────────────▼───────────────────────────────────────────────────────┐  │
│  │                         POSTGRESQL DATABASE                            │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │  │
│  │  │  Users  │ │ Products│ │  Stock  │ │  Trans  │ │ Branches│         │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                            Internet   │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   WEB CLIENT     │          │   OWNER APP      │          │  EMPLOYEE APP    │
│   (Browser)      │          │   (React Native) │          │  (React Native)  │
├──────────────────┤          ├──────────────────┤          ├──────────────────┤
│ ┌──────────────┐ │          │ ┌──────────────┐ │          │ ┌──────────────┐ │
│ │ Next.js      │ │          │ │ Expo Router  │ │          │ │ Expo Router  │ │
│ │ (React SSR)  │ │          │ │ (Navigation) │ │          │ │ (Navigation) │ │
│ ├──────────────┤ │          │ ├──────────────┤ │          │ ├──────────────┤ │
│ │ Zustand      │ │          │ │ Zustand      │ │          │ │ Zustand      │ │
│ │ (State)      │ │          │ │ (State)      │ │          │ │ (State)      │ │
│ ├──────────────┤ │          │ ├──────────────┤ │          │ ├──────────────┤ │
│ │ TanStack     │ │          │ │ TanStack     │ │          │ │ TanStack     │ │
│ │ Query        │ │          │ │ Query        │ │          │ │ Query        │ │
│ ├──────────────┤ │          │ ├──────────────┤ │          │ ├──────────────┤ │
│ │ Dexie.js     │ │          │ │ SQLite       │ │          │ │ SQLite       │ │
│ │ (IndexedDB)  │ │          │ │ (Local DB)   │ │          │ │ (Local DB)   │ │
│ └──────────────┘ │          │ └──────────────┘ │          │ └──────────────┘ │
├──────────────────┤          ├──────────────────┤          ├──────────────────┤
│ FULL ACCESS      │          │ FULL ACCESS      │          │ LIMITED ACCESS   │
│ (by role)        │          │ (Owner only)     │          │ (Kasir only)     │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 3. Arsitektur Frontend (Web)

### 3.1 Struktur Folder

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: Auth pages
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Route group: Protected pages
│   │   ├── kasir/                # POS/Cashier
│   │   ├── produk/               # Product management
│   │   ├── stok/                 # Stock management
│   │   ├── laporan/              # Reports
│   │   ├── pelanggan/            # Customers
│   │   ├── pengaturan/           # Settings
│   │   └── layout.tsx            # Dashboard layout with sidebar
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── produk/
│   │   ├── transaksi/
│   │   ├── stok/
│   │   └── laporan/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing/redirect
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── forms/                    # Form components
│   │   ├── product-form.tsx
│   │   ├── login-form.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── mobile-nav.tsx
│   │   └── ...
│   ├── kasir/                    # POS-specific components
│   │   ├── price-level-selector.tsx
│   │   ├── cart-item.tsx
│   │   ├── payment-dialog.tsx
│   │   └── ...
│   └── shared/                   # Shared components
│       ├── data-table.tsx
│       ├── loading-skeleton.tsx
│       └── ...
│
├── lib/
│   ├── db/                       # Database utilities
│   │   ├── prisma.ts             # Prisma client
│   │   └── offline-db.ts         # Dexie.js setup
│   ├── auth/                     # Auth utilities
│   │   └── auth-options.ts       # NextAuth config
│   ├── services/                 # Business logic services
│   │   ├── product-service.ts
│   │   ├── transaction-service.ts
│   │   ├── stock-service.ts
│   │   ├── pricing-service.ts
│   │   └── sync-service.ts
│   ├── utils/                    # Utility functions
│   │   ├── currency.ts           # Format rupiah
│   │   ├── date.ts               # Date formatting
│   │   ├── validation.ts         # Common validations
│   │   └── ...
│   └── constants/                # Constants
│       ├── units.ts              # Unit definitions
│       ├── price-levels.ts       # Price level config
│       └── ...
│
├── hooks/                        # Custom React hooks
│   ├── use-cart.ts               # Cart state management
│   ├── use-offline.ts            # Offline detection
│   ├── use-sync.ts               # Sync status
│   └── ...
│
├── stores/                       # Zustand stores
│   ├── cart-store.ts             # Shopping cart
│   ├── auth-store.ts             # Auth state
│   ├── settings-store.ts         # User settings
│   └── sync-store.ts             # Sync queue
│
├── types/                        # TypeScript types
│   ├── product.ts
│   ├── transaction.ts
│   ├── user.ts
│   └── ...
│
└── styles/
    └── globals.css               # Global styles + Tailwind
```

### 3.2 Komponen Kunci

#### Price Level Selector
```
┌────────────────────────────────────────────────────────────────┐
│  PILIH TINGKATAN HARGA:                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 💰 H1    │ │ 💰 H2    │ │ 💰 H3    │ │ 💰 H4    │          │
│  │ ECERAN   │ │ GROSIR   │ │ RESELLER │ │ DISTRI   │          │
│  │ ████████ │ │          │ │          │ │          │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ▲ Aktif (warna sesuai level)                                  │
└────────────────────────────────────────────────────────────────┘
```

#### Cart Item with Unit Selector
```
┌─────────────────────────────────────────────────────────────────┐
│  Indomie Goreng                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Satuan: [Bks ▼]    Qty: [-] 5 [+]    @3.500 = Rp17.500  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [🗑️ Hapus]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Arsitektur Backend (API)

### 4.1 Struktur API Routes

```
/api
├── /auth
│   ├── POST   /login              # Email + password login
│   ├── POST   /login-pin          # PIN login
│   ├── POST   /logout             # Logout
│   ├── POST   /refresh            # Refresh token
│   ├── POST   /forgot-password    # Request reset
│   └── POST   /reset-password     # Execute reset
│
├── /users
│   ├── GET    /                   # List users (admin)
│   ├── POST   /                   # Create user
│   ├── GET    /:id                # Get user detail
│   ├── PATCH  /:id                # Update user
│   ├── DELETE /:id                # Deactivate user
│   └── POST   /:id/reset-password # Admin reset password
│
├── /products
│   ├── GET    /                   # List products (paginated, search)
│   ├── POST   /                   # Create product
│   ├── GET    /:id                # Get product detail
│   ├── PATCH  /:id                # Update product
│   ├── DELETE /:id                # Soft delete product
│   ├── GET    /barcode/:code      # Lookup by barcode
│   └── POST   /import             # Bulk import from Excel
│
├── /product-units
│   ├── POST   /                   # Add unit to product
│   ├── PATCH  /:id                # Update unit
│   └── DELETE /:id                # Remove unit
│
├── /categories
│   ├── GET    /                   # List categories
│   ├── POST   /                   # Create category
│   ├── PATCH  /:id                # Update category
│   └── DELETE /:id                # Delete category
│
├── /stock
│   ├── GET    /                   # List stock (with filters)
│   ├── GET    /:productId         # Get stock for product
│   ├── POST   /adjust             # Adjust stock (in/out)
│   ├── POST   /opname             # Stock opname
│   └── GET    /movements/:productId # Stock movement history
│
├── /transactions
│   ├── GET    /                   # List transactions
│   ├── POST   /                   # Create transaction (sale)
│   ├── GET    /:id                # Get transaction detail
│   ├── POST   /:id/void           # Void transaction (admin)
│   └── GET    /pending            # Get pending sync transactions
│
├── /customers
│   ├── GET    /                   # List customers
│   ├── POST   /                   # Create customer
│   ├── GET    /:id                # Get customer detail
│   ├── PATCH  /:id                # Update customer
│   └── GET    /:id/transactions   # Customer purchase history
│
├── /debts
│   ├── GET    /                   # List all debts
│   ├── GET    /:customerId        # Customer debts
│   ├── POST   /payment            # Record debt payment
│   └── GET    /due                # Debts due soon
│
├── /reports
│   ├── GET    /dashboard          # Dashboard summary
│   ├── GET    /sales              # Sales report
│   ├── GET    /profit             # Profit report
│   ├── GET    /top-products       # Best selling products
│   └── GET    /export/:type       # Export report (PDF/Excel)
│
├── /settings
│   ├── GET    /store              # Get store settings
│   ├── PATCH  /store              # Update store settings
│   ├── GET    /price-levels       # Get price level names
│   ├── PATCH  /price-levels       # Update price level names
│   └── GET    /printer            # Get printer settings
│
├── /sync
│   ├── POST   /push               # Push local changes to server
│   ├── GET    /pull               # Pull server changes
│   └── GET    /status             # Get sync status
│
└── /branches (Fase 5)
    ├── GET    /                   # List branches
    ├── POST   /                   # Create branch
    ├── GET    /:id                # Get branch detail
    └── POST   /transfer-stock     # Transfer stock between branches
```

### 4.2 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API ROUTES                               │
│                   (Request/Response handling)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CONTROLLERS                              │
│               (Input validation, authorization)                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          SERVICES                                │
│                    (Business logic layer)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Product     │ │ Transaction │ │ Stock       │ │ Pricing   │ │
│  │ Service     │ │ Service     │ │ Service     │ │ Service   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        REPOSITORIES                              │
│                   (Data access abstraction)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          PRISMA ORM                              │
│                   (Database operations)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Arsitektur Offline-First

### 5.1 Strategi Offline

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/App)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     APPLICATION                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │   │
│  │  │   UI       │  │  Zustand   │  │   TanStack Query   │  │   │
│  │  │ Components │◄─┤   Store    │◄─┤   (Cache + Fetch)  │  │   │
│  │  └────────────┘  └────────────┘  └─────────┬──────────┘  │   │
│  │                                            │              │   │
│  └────────────────────────────────────────────┼──────────────┘   │
│                                               │                  │
│  ┌────────────────────────────────────────────▼──────────────┐   │
│  │                    SYNC MANAGER                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │ Online       │  │ Conflict     │  │ Queue          │  │   │
│  │  │ Detector     │  │ Resolver     │  │ Processor      │  │   │
│  │  └──────────────┘  └──────────────┘  └────────────────┘  │   │
│  └────────────────────────────────────────────┬──────────────┘   │
│                                               │                  │
│  ┌────────────────────────────────────────────▼──────────────┐   │
│  │                    LOCAL DATABASE                         │   │
│  │           (IndexedDB via Dexie.js / SQLite)               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │Products │ │ Stock   │ │ Pending │ │ Sync Metadata   │ │   │
│  │  │ Cache   │ │ Cache   │ │ Trans.  │ │ (versions, etc) │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                │
                     Internet   │ (when available)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                          SERVER                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Data yang Di-cache Lokal

| Data | Strategi Cache | Sync Direction |
|------|----------------|----------------|
| **Produk** | Full cache dengan pagination | Server → Client |
| **Harga** | Full cache | Server → Client (priority) |
| **Stok** | Full cache | Bidirectional |
| **Transaksi Pending** | Queue untuk sync | Client → Server |
| **Pelanggan** | Full cache | Bidirectional |
| **Pengaturan** | Full cache | Server → Client |

### 5.3 Conflict Resolution

```
Conflict Scenario: Stock Update

Timeline:
─────────────────────────────────────────────────────────────────►
     │                    │                    │
     │ Client A           │ Client B           │ Server
     │ (Offline)          │ (Online)           │
     │                    │                    │
     │ Stock: 100         │                    │ Stock: 100
     │                    │                    │
     │ Sell 5 units       │                    │
     │ Local: 95          │                    │
     │                    │ Sell 3 units       │
     │                    │ ─────────────────► │ Stock: 97
     │                    │                    │
     │ [Goes Online]      │                    │
     │ Sync attempt       │                    │
     │ ─────────────────► │                    │
     │                    │                    │ CONFLICT!
     │                    │                    │ Expected: 100
     │                    │                    │ Actual: 97
     │                    │                    │
     │                    │                    │ Resolution:
     │                    │                    │ 97 - 5 = 92
     │ ◄───────────────── │                    │
     │ New Stock: 92      │                    │ Stock: 92
```

**Strategi Resolusi:**
1. **Transaksi**: Tidak ada conflict (UUID-based, append-only)
2. **Stok**: Server menghitung ulang berdasarkan movement delta
3. **Harga**: Server wins (Owner's changes take precedence)
4. **Produk**: Last-write-wins dengan version number

---

## 6. Arsitektur Keamanan

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│  Email/Password  │              │    PIN Login     │
│     Login        │              │   (Quick Auth)   │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐
│ Validate against │              │ Validate PIN     │
│ bcrypt hash      │              │ (hashed)         │
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         └────────────────┬────────────────┘
                          │
                          ▼
               ┌──────────────────┐
               │  Generate JWT    │
               │  Access Token    │
               │  (expires: 1h)   │
               ├──────────────────┤
               │  Refresh Token   │
               │  (expires: 7d)   │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │  Set HTTP-only   │
               │  Cookies         │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │  Return User +   │
               │  Role + Branch   │
               └──────────────────┘
```

### 6.2 Authorization Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL                     │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │              RESOURCES                       │
                    ├───────┬───────┬───────┬───────┬────────────┤
                    │Product│ Stock │ Price │ Trans │  Reports   │
                    │ CRUD  │Adjust │ Edit  │ View  │   View     │
┌───────────────────┼───────┼───────┼───────┼───────┼────────────┤
│ OWNER             │  ✅   │  ✅   │  ✅   │  ✅   │    ✅      │
├───────────────────┼───────┼───────┼───────┼───────┼────────────┤
│ ADMIN_CABANG      │  ✅   │  ✅   │  ❌   │  ✅   │  ✅*       │
├───────────────────┼───────┼───────┼───────┼───────┼────────────┤
│ KASIR             │  ❌   │  ❌   │  ❌   │  ✅   │    ❌      │
└───────────────────┴───────┴───────┴───────┴───────┴────────────┘

* = Cabang sendiri saja

Data Restriction (Kasir):
- harga_modal: HIDDEN (tidak dikirim via API)
- laporan_laba: HIDDEN
- log_aktivitas: HIDDEN
```

### 6.3 API Security Layers

```
Request → [Rate Limiter] → [Auth Middleware] → [Role Checker] → [Input Validator] → Handler
              │                   │                  │                  │
              ▼                   ▼                  ▼                  ▼
         100 req/min         JWT Valid?         Role allowed?      Zod Schema
         per IP              Token expired?     Branch match?      Sanitization
```

---

## 7. Arsitektur Real-time Sync

### 7.1 Socket.io Events

```typescript
// Server → Client Events
interface ServerEvents {
  'price:updated': { productId: string; prices: PriceData };
  'stock:updated': { productId: string; branchId: string; quantity: number };
  'product:created': { product: Product };
  'product:updated': { product: Product };
  'settings:updated': { settings: StoreSettings };
  'sync:required': { reason: string };
  'notification': { type: string; message: string; data?: any };
}

// Client → Server Events
interface ClientEvents {
  'sync:push': { transactions: PendingTransaction[] };
  'sync:status': { lastSyncTime: Date };
  'join:branch': { branchId: string };
}
```

### 7.2 Sync Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      REAL-TIME SYNC FLOW                         │
└──────────────────────────────────────────────────────────────────┘

  Owner Device                    Server                    Kasir Device
       │                            │                            │
       │    Update Price            │                            │
       │ ─────────────────────────► │                            │
       │                            │                            │
       │                            │  Broadcast 'price:updated' │
       │                            │ ──────────────────────────►│
       │                            │                            │
       │                            │                            │ Update local
       │                            │                            │ cache
       │                            │                            │
       │                            │                            │ Show toast:
       │                            │                            │ "Harga diperbarui"
       │                            │                            │
```

---

## 8. Deployment Architecture

### 8.1 Server Setup (VPS)

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPS (Ubuntu 22.04)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                        NGINX                                │ │
│  │  - SSL/TLS termination (Let's Encrypt)                     │ │
│  │  - Reverse proxy to Next.js                                │ │
│  │  - Static file serving                                     │ │
│  │  - Gzip compression                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│         ┌────────────────────┴────────────────────┐             │
│         │                                         │             │
│         ▼                                         ▼             │
│  ┌──────────────┐                         ┌──────────────┐      │
│  │  Next.js     │                         │  Socket.io   │      │
│  │  (PM2)       │                         │  Server      │      │
│  │  Port: 3000  │                         │  Port: 3001  │      │
│  └──────────────┘                         └──────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      PostgreSQL 16                          │ │
│  │                       Port: 5432                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                        Backups                              │ │
│  │  - Daily automated backup (pg_dump)                        │ │
│  │  - Stored in /backups and synced to external storage       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Process Management (PM2)

```yaml
# ecosystem.config.js
apps:
  - name: gugaramku-web
    script: npm
    args: start
    instances: 2
    exec_mode: cluster
    env:
      NODE_ENV: production
      PORT: 3000
    
  - name: gugaramku-socket
    script: ./dist/socket-server.js
    instances: 1
    env:
      NODE_ENV: production
      PORT: 3001
```

---

## 9. Monitoring & Logging

### 9.1 Application Logs

```
/var/log/gugaramku/
├── app.log           # Application logs
├── error.log         # Error logs
├── access.log        # HTTP access logs
├── sync.log          # Sync operations
└── audit.log         # User actions (price changes, etc.)
```

### 9.2 Health Checks

```
GET /api/health
Response:
{
  "status": "healthy",
  "timestamp": "2026-11-02T10:00:00Z",
  "services": {
    "database": "connected",
    "cache": "connected",
    "socket": "running"
  },
  "version": "1.0.0"
}
```

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

# 🧪 TESTING STRATEGY — GUGARAMKU

## Strategi Pengujian

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |

---

## 1. Testing Philosophy

### 1.1 Prinsip Pengujian

| Prinsip | Implementasi |
|---------|--------------|
| **Test Early** | Tulis test bersamaan dengan fitur |
| **Test Often** | Jalankan test di setiap commit |
| **Test Real Scenarios** | Fokus pada use case bisnis nyata |
| **Test Edge Cases** | Perhatikan kasus batas dan error |

### 1.2 Testing Pyramid

```
                    ┌─────────────────┐
                    │    E2E Tests    │  ← Few, Slow, Expensive
                    │   (Playwright)  │
                    └────────┬────────┘
                             │
               ┌─────────────┴─────────────┐
               │    Integration Tests      │  ← Some, Medium
               │   (API + Component)       │
               └─────────────┬─────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │              Unit Tests                  │  ← Many, Fast, Cheap
        │        (Vitest + React Testing Lib)     │
        └──────────────────────────────────────────┘
```

### 1.3 Test Coverage Target

| Area | Target | Priority |
|------|--------|----------|
| Business Logic (Services) | 90%+ | Critical |
| API Routes | 85%+ | Critical |
| UI Components | 70%+ | High |
| Utility Functions | 90%+ | High |
| E2E Critical Paths | 100% | Critical |

---

## 2. Testing Tools

### 2.1 Technology Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing framework |
| **React Testing Library** | Component testing |
| **MSW (Mock Service Worker)** | API mocking |
| **Playwright** | E2E testing |
| **Prisma Test Environment** | Database testing |
| **Faker.js** | Generate test data |

### 2.2 Project Setup

```bash
# Install dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test msw
npm install -D @faker-js/faker
```

### 2.3 Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 3. Unit Tests

### 3.1 Business Logic Tests

#### 3.1.1 Pricing Service

```typescript
// tests/services/pricing-service.test.ts

import { describe, it, expect } from 'vitest';
import { PricingService } from '@/lib/services/pricing-service';

describe('PricingService', () => {
  describe('getPrice', () => {
    const produkSatuan = {
      id: '1',
      namaSatuan: 'bks',
      konversi: 1,
      harga1: 3500,
      harga2: 3300,
      harga3: 3200,
      harga4: 3100,
    };

    it('should return H1 price for tingkatHarga 1', () => {
      const price = PricingService.getPrice(produkSatuan, 1);
      expect(price).toBe(3500);
    });

    it('should return H2 price for tingkatHarga 2', () => {
      const price = PricingService.getPrice(produkSatuan, 2);
      expect(price).toBe(3300);
    });

    it('should throw error for invalid tingkatHarga', () => {
      expect(() => PricingService.getPrice(produkSatuan, 5)).toThrow();
    });
  });

  describe('calculateMargin', () => {
    it('should calculate margin percentage correctly', () => {
      const margin = PricingService.calculateMargin(3500, 2800);
      expect(margin).toBeCloseTo(25, 1); // 25%
    });

    it('should return negative margin when price below cost', () => {
      const margin = PricingService.calculateMargin(2500, 2800);
      expect(margin).toBeLessThan(0);
    });
  });
});
```

#### 3.1.2 Stock Service

```typescript
// tests/services/stock-service.test.ts

import { describe, it, expect } from 'vitest';
import { StockService } from '@/lib/services/stock-service';

describe('StockService', () => {
  describe('calculateBaseUnitQuantity', () => {
    it('should calculate base unit quantity correctly', () => {
      // Jual 2 Dos, 1 Dos = 40 Bks
      const result = StockService.calculateBaseUnitQuantity(2, 40);
      expect(result).toBe(80);
    });

    it('should handle decimal quantities', () => {
      // Jual 0.5 kg
      const result = StockService.calculateBaseUnitQuantity(0.5, 1);
      expect(result).toBe(0.5);
    });
  });

  describe('validateStockAvailability', () => {
    it('should return true when stock is sufficient', () => {
      const result = StockService.validateStockAvailability({
        currentStock: 100,
        requestedQuantity: 2,
        conversionFactor: 40,
      });
      expect(result.isAvailable).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const result = StockService.validateStockAvailability({
        currentStock: 30,
        requestedQuantity: 1,
        conversionFactor: 40, // Butuh 40, tersedia 30
      });
      expect(result.isAvailable).toBe(false);
      expect(result.required).toBe(40);
      expect(result.available).toBe(30);
    });
  });
});
```

#### 3.1.3 Loss Prevention Service

```typescript
// tests/services/loss-prevention.test.ts

import { describe, it, expect } from 'vitest';
import { LossPreventionService } from '@/lib/services/loss-prevention';

describe('LossPreventionService', () => {
  describe('validatePrice', () => {
    const product = {
      hargaModal: 2800, // per satuan dasar
    };

    it('should pass when price is above cost', () => {
      const result = LossPreventionService.validatePrice({
        hargaJual: 3500,
        hargaModal: 2800,
        konversi: 1,
      });
      expect(result.isValid).toBe(true);
    });

    it('should fail when price is below cost', () => {
      const result = LossPreventionService.validatePrice({
        hargaJual: 2500,
        hargaModal: 2800,
        konversi: 1,
      });
      expect(result.isValid).toBe(false);
      expect(result.loss).toBe(300);
    });

    it('should calculate correctly for larger units', () => {
      // 1 Dos (40 bks), modal per bks = 2800
      // Modal per Dos = 2800 × 40 = 112,000
      // Harga jual = 110,000 (rugi)
      const result = LossPreventionService.validatePrice({
        hargaJual: 110000,
        hargaModal: 2800,
        konversi: 40,
      });
      expect(result.isValid).toBe(false);
      expect(result.loss).toBe(2000); // Rugi 2000 per Dos
    });
  });

  describe('validateTransaction', () => {
    it('should validate all items in transaction', () => {
      const items = [
        { hargaJual: 3500, hargaModal: 2800, konversi: 1, jumlah: 5 },
        { hargaJual: 2500, hargaModal: 2800, konversi: 1, jumlah: 3 }, // Rugi
      ];

      const result = LossPreventionService.validateTransaction(items);
      expect(result.hasLossItems).toBe(true);
      expect(result.lossItems).toHaveLength(1);
      expect(result.totalLoss).toBe(900); // 300 × 3
    });
  });
});
```

#### 3.1.4 Transaction Number Generator

```typescript
// tests/services/transaction-number.test.ts

import { describe, it, expect, vi } from 'vitest';
import { TransactionNumberService } from '@/lib/services/transaction-number';

describe('TransactionNumberService', () => {
  it('should generate correct format', () => {
    vi.setSystemTime(new Date('2026-11-02'));
    
    const number = TransactionNumberService.generate('SJI', 1);
    expect(number).toBe('GGK-SJI-20261102-0001');
  });

  it('should pad sequence number correctly', () => {
    vi.setSystemTime(new Date('2026-11-02'));
    
    const number = TransactionNumberService.generate('SJI', 123);
    expect(number).toBe('GGK-SJI-20261102-0123');
  });
});
```

### 3.2 Utility Function Tests

```typescript
// tests/utils/currency.test.ts

import { describe, it, expect } from 'vitest';
import { formatRupiah, parseRupiah } from '@/lib/utils/currency';

describe('Currency Utils', () => {
  describe('formatRupiah', () => {
    it('should format number to Rupiah', () => {
      expect(formatRupiah(15000)).toBe('Rp 15.000');
    });

    it('should format large numbers', () => {
      expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
    });

    it('should handle zero', () => {
      expect(formatRupiah(0)).toBe('Rp 0');
    });
  });

  describe('parseRupiah', () => {
    it('should parse Rupiah string to number', () => {
      expect(parseRupiah('Rp 15.000')).toBe(15000);
    });

    it('should handle string without Rp prefix', () => {
      expect(parseRupiah('15.000')).toBe(15000);
    });
  });
});
```

---

## 4. Integration Tests

### 4.1 API Route Tests

```typescript
// tests/api/products.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/db/prisma';
import { GET, POST } from '@/app/api/products/route';

describe('Products API', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.kategori.create({
      data: { id: 'test-kategori', nama: 'Test Category' },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.produk.deleteMany();
    await prisma.kategori.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const { req } = createMocks({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter by search term', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { search: 'indomie' },
      });
      const response = await GET(req);
      const data = await response.json();

      expect(data.data.every(p => 
        p.nama.toLowerCase().includes('indomie')
      )).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          barcode: '8991234567890',
          nama: 'Test Product',
          kategoriId: 'test-kategori',
          hargaModal: 2800,
          satuanDasar: 'bks',
          satuan: [
            {
              namaSatuan: 'bks',
              konversi: 1,
              harga1: 3500,
              harga2: 3300,
              harga3: 3200,
              harga4: 3100,
              isDefault: true,
            },
          ],
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.nama).toBe('Test Product');
    });

    it('should reject duplicate barcode', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          barcode: '8991234567890', // Same as above
          nama: 'Another Product',
          hargaModal: 2800,
          satuanDasar: 'bks',
          satuan: [],
        },
      });

      const response = await POST(req);
      expect(response.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          nama: '', // Empty name
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 4.2 Transaction API Tests

```typescript
// tests/api/transactions.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { POST } from '@/app/api/transactions/route';

describe('Transactions API', () => {
  let testProduct: any;
  let testCabang: any;
  let testUser: any;

  beforeAll(async () => {
    // Setup test data
    testCabang = await prisma.cabang.create({
      data: { kode: 'TST', nama: 'Test Branch' },
    });

    testUser = await prisma.user.create({
      data: {
        nama: 'Test Kasir',
        email: 'test@test.com',
        password: 'hashed',
        role: 'KASIR',
        cabangId: testCabang.id,
      },
    });

    testProduct = await prisma.produk.create({
      data: {
        barcode: 'TEST001',
        nama: 'Test Product',
        hargaModal: 2800,
        satuanDasar: 'bks',
        produkSatuan: {
          create: {
            namaSatuan: 'bks',
            konversi: 1,
            harga1: 3500,
            harga2: 3300,
            harga3: 3200,
            harga4: 3100,
            isDefault: true,
          },
        },
      },
      include: { produkSatuan: true },
    });

    await prisma.stok.create({
      data: {
        produkId: testProduct.id,
        cabangId: testCabang.id,
        jumlah: 100,
      },
    });
  });

  afterAll(async () => {
    await prisma.detailTransaksi.deleteMany();
    await prisma.transaksi.deleteMany();
    await prisma.stok.deleteMany();
    await prisma.produkSatuan.deleteMany();
    await prisma.produk.deleteMany();
    await prisma.user.deleteMany();
    await prisma.cabang.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/transactions', () => {
    it('should create transaction and deduct stock', async () => {
      const response = await POST({
        json: async () => ({
          id: 'test-trx-1',
          cabangId: testCabang.id,
          tingkatHarga: 1,
          items: [
            {
              produkId: testProduct.id,
              produkSatuanId: testProduct.produkSatuan[0].id,
              jumlah: 5,
            },
          ],
          metodeBayar: 'TUNAI',
          jumlahBayar: 20000,
        }),
      } as any);

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.total).toBe(17500); // 5 × 3500

      // Verify stock was deducted
      const stock = await prisma.stok.findFirst({
        where: { produkId: testProduct.id, cabangId: testCabang.id },
      });
      expect(Number(stock?.jumlah)).toBe(95); // 100 - 5
    });

    it('should reject when stock insufficient', async () => {
      const response = await POST({
        json: async () => ({
          id: 'test-trx-2',
          cabangId: testCabang.id,
          tingkatHarga: 1,
          items: [
            {
              produkId: testProduct.id,
              produkSatuanId: testProduct.produkSatuan[0].id,
              jumlah: 1000, // More than available
            },
          ],
          metodeBayar: 'TUNAI',
          jumlahBayar: 3500000,
        }),
      } as any);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error.code).toBe('STOCK_INSUFFICIENT');
    });
  });
});
```

---

## 5. Component Tests

### 5.1 Price Level Selector

```typescript
// tests/components/price-level-selector.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceLevelSelector } from '@/components/kasir/price-level-selector';

describe('PriceLevelSelector', () => {
  const mockOnChange = vi.fn();
  const priceLevels = [
    { tingkat: 1, nama: 'Eceran', warna: '#3498db' },
    { tingkat: 2, nama: 'Grosir', warna: '#27ae60' },
    { tingkat: 3, nama: 'Reseller', warna: '#f39c12' },
    { tingkat: 4, nama: 'Distributor', warna: '#9b59b6' },
  ];

  it('should render all price levels', () => {
    render(
      <PriceLevelSelector
        levels={priceLevels}
        selected={1}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Eceran')).toBeInTheDocument();
    expect(screen.getByText('Grosir')).toBeInTheDocument();
    expect(screen.getByText('Reseller')).toBeInTheDocument();
    expect(screen.getByText('Distributor')).toBeInTheDocument();
  });

  it('should highlight selected level', () => {
    render(
      <PriceLevelSelector
        levels={priceLevels}
        selected={2}
        onChange={mockOnChange}
      />
    );

    const grosirButton = screen.getByText('Grosir').closest('button');
    expect(grosirButton).toHaveAttribute('data-active', 'true');
  });

  it('should call onChange when clicking a level', () => {
    render(
      <PriceLevelSelector
        levels={priceLevels}
        selected={1}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('Grosir'));
    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('should support keyboard shortcuts', () => {
    render(
      <PriceLevelSelector
        levels={priceLevels}
        selected={1}
        onChange={mockOnChange}
      />
    );

    fireEvent.keyDown(document, { key: 'F2' });
    expect(mockOnChange).toHaveBeenCalledWith(2);
  });
});
```

### 5.2 Cart Component

```typescript
// tests/components/cart.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Cart } from '@/components/kasir/cart';

describe('Cart', () => {
  const mockItems = [
    {
      id: '1',
      produkId: 'p1',
      nama: 'Indomie Goreng',
      satuan: 'bks',
      konversi: 1,
      jumlah: 5,
      hargaJual: 3500,
      subtotal: 17500,
    },
    {
      id: '2',
      produkId: 'p2',
      nama: 'Gula 1kg',
      satuan: 'pcs',
      konversi: 1,
      jumlah: 2,
      hargaJual: 15000,
      subtotal: 30000,
    },
  ];

  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemoveItem = vi.fn();
  const mockOnChangeUnit = vi.fn();

  it('should render all items', () => {
    render(
      <Cart
        items={mockItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onChangeUnit={mockOnChangeUnit}
      />
    );

    expect(screen.getByText('Indomie Goreng')).toBeInTheDocument();
    expect(screen.getByText('Gula 1kg')).toBeInTheDocument();
  });

  it('should calculate total correctly', () => {
    render(
      <Cart
        items={mockItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onChangeUnit={mockOnChangeUnit}
      />
    );

    expect(screen.getByText('Rp 47.500')).toBeInTheDocument(); // 17500 + 30000
  });

  it('should call onUpdateQuantity when changing quantity', () => {
    render(
      <Cart
        items={mockItems}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onChangeUnit={mockOnChangeUnit}
      />
    );

    const increaseButtons = screen.getAllByText('+');
    fireEvent.click(increaseButtons[0]);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 6);
  });

  it('should show empty state when no items', () => {
    render(
      <Cart
        items={[]}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemoveItem={mockOnRemoveItem}
        onChangeUnit={mockOnChangeUnit}
      />
    );

    expect(screen.getByText('Keranjang masih kosong')).toBeInTheDocument();
  });
});
```

---

## 6. E2E Tests

### 6.1 Playwright Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 6.2 Login Flow Test

```typescript
// e2e/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with email and password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'owner@gugaramku.com');
    await page.fill('[name="password"]', 'owner123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/kasir');
    await expect(page.locator('text=Owner GuGaramKu')).toBeVisible();
  });

  test('should login with PIN', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('text=Login dengan PIN');
    await page.fill('[name="email"]', 'ahmad@gugaramku.com');
    await page.fill('[name="pin"]', '1234');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/kasir');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'wrong@email.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email atau password salah')).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'owner@gugaramku.com');
    await page.fill('[name="password"]', 'owner123');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Keluar');

    await expect(page).toHaveURL('/login');
  });
});
```

### 6.3 POS Transaction Flow Test

```typescript
// e2e/pos.spec.ts

import { test, expect } from '@playwright/test';

test.describe('POS Transaction', () => {
  test.beforeEach(async ({ page }) => {
    // Login as kasir
    await page.goto('/login');
    await page.fill('[name="email"]', 'ahmad@gugaramku.com');
    await page.fill('[name="password"]', 'kasir123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/kasir');
  });

  test('should complete a basic transaction', async ({ page }) => {
    // Select price level
    await page.click('text=Eceran');
    await expect(page.locator('[data-level="1"]')).toHaveAttribute('data-active', 'true');

    // Search and add product
    await page.fill('[placeholder="Cari produk..."]', 'Indomie');
    await page.click('text=Indomie Goreng');

    // Verify cart
    await expect(page.locator('.cart-item')).toContainText('Indomie Goreng');
    await expect(page.locator('.cart-item')).toContainText('Rp 3.500');

    // Change quantity
    await page.click('.cart-item >> text=+');
    await page.click('.cart-item >> text=+');
    await expect(page.locator('.cart-item >> .quantity')).toContainText('3');

    // Check total
    await expect(page.locator('.total-amount')).toContainText('Rp 10.500');

    // Process payment
    await page.click('text=BAYAR');
    await expect(page.locator('.payment-dialog')).toBeVisible();
    
    await page.fill('[name="jumlahBayar"]', '20000');
    await expect(page.locator('.change-amount')).toContainText('Rp 9.500');

    await page.click('text=Proses Pembayaran');

    // Verify success
    await expect(page.locator('text=Transaksi berhasil')).toBeVisible();
    await expect(page.locator('.receipt-preview')).toBeVisible();
  });

  test('should change price level with confirmation', async ({ page }) => {
    // Add item first
    await page.fill('[placeholder="Cari produk..."]', 'Gula');
    await page.click('text=Gula 1kg');
    await expect(page.locator('.cart-item')).toContainText('Rp 15.000'); // H1 price

    // Try to change price level
    await page.click('text=Grosir');

    // Confirmation dialog should appear
    await expect(page.locator('.confirmation-dialog')).toBeVisible();
    await expect(page.locator('.confirmation-dialog')).toContainText(
      'Harga semua item di keranjang akan berubah'
    );

    // Confirm
    await page.click('text=Ya, Ganti Harga');

    // Price should update
    await expect(page.locator('.cart-item')).toContainText('Rp 14.000'); // H2 price
  });

  test('should prevent sale when stock insufficient', async ({ page }) => {
    await page.fill('[placeholder="Cari produk..."]', 'Test Low Stock');
    await page.click('text=Test Low Stock');

    // Try to increase quantity beyond stock
    for (let i = 0; i < 100; i++) {
      await page.click('.cart-item >> text=+');
    }

    // Should show warning
    await expect(page.locator('text=Stok tidak mencukupi')).toBeVisible();
  });

  test('should handle unit change correctly', async ({ page }) => {
    await page.fill('[placeholder="Cari produk..."]', 'Indomie');
    await page.click('text=Indomie Goreng');

    // Change unit from Bks to Dos
    await page.click('.cart-item >> .unit-selector');
    await page.click('text=Dos (40 bks)');

    // Price should change
    await expect(page.locator('.cart-item')).toContainText('Rp 135.000');
  });
});
```

### 6.4 Stock Validation E2E Test

```typescript
// e2e/stock-validation.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Stock Validation', () => {
  test('should validate stock when selling larger units', async ({ page }) => {
    // Login as kasir
    await page.goto('/login');
    await page.fill('[name="email"]', 'ahmad@gugaramku.com');
    await page.fill('[name="password"]', 'kasir123');
    await page.click('button[type="submit"]');

    // Search for product with limited stock (30 bks)
    await page.fill('[placeholder="Cari produk..."]', 'Limited Stock Product');
    await page.click('text=Limited Stock Product');

    // Change to Dos (1 Dos = 40 Bks)
    await page.click('.cart-item >> .unit-selector');
    await page.click('text=Dos (40 bks)');

    // Should show error - need 40, have 30
    await expect(page.locator('.stock-warning')).toBeVisible();
    await expect(page.locator('.stock-warning')).toContainText('Butuh: 40');
    await expect(page.locator('.stock-warning')).toContainText('Tersedia: 30');
  });
});
```

---

## 7. Test Data Management

### 7.1 Test Fixtures

```typescript
// tests/fixtures/products.ts

import { faker } from '@faker-js/faker';

export function createTestProduct(overrides = {}) {
  return {
    barcode: faker.string.numeric(13),
    nama: faker.commerce.productName(),
    hargaModal: faker.number.int({ min: 1000, max: 50000 }),
    satuanDasar: 'bks',
    produkSatuan: [
      {
        namaSatuan: 'bks',
        konversi: 1,
        harga1: faker.number.int({ min: 1500, max: 60000 }),
        harga2: faker.number.int({ min: 1400, max: 55000 }),
        harga3: faker.number.int({ min: 1300, max: 50000 }),
        harga4: faker.number.int({ min: 1200, max: 45000 }),
        isDefault: true,
      },
    ],
    ...overrides,
  };
}

export function createTestTransaction(overrides = {}) {
  return {
    tingkatHarga: 1,
    subtotal: faker.number.int({ min: 10000, max: 1000000 }),
    diskon: 0,
    total: faker.number.int({ min: 10000, max: 1000000 }),
    metodeBayar: 'TUNAI',
    ...overrides,
  };
}
```

### 7.2 Database Seeding for Tests

```typescript
// tests/helpers/seed-test-db.ts

import { prisma } from '@/lib/db/prisma';
import { createTestProduct } from '../fixtures/products';

export async function seedTestDatabase() {
  // Clear existing data
  await prisma.detailTransaksi.deleteMany();
  await prisma.transaksi.deleteMany();
  await prisma.stokMutasi.deleteMany();
  await prisma.stok.deleteMany();
  await prisma.produkSatuan.deleteMany();
  await prisma.produk.deleteMany();
  await prisma.kategori.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cabang.deleteMany();

  // Create test cabang
  const cabang = await prisma.cabang.create({
    data: { kode: 'TST', nama: 'Test Branch' },
  });

  // Create test users
  await prisma.user.createMany({
    data: [
      {
        nama: 'Test Owner',
        email: 'owner@test.com',
        password: '$2a$10$hashedpassword',
        role: 'OWNER',
      },
      {
        nama: 'Test Kasir',
        email: 'kasir@test.com',
        password: '$2a$10$hashedpassword',
        role: 'KASIR',
        cabangId: cabang.id,
      },
    ],
  });

  // Create test kategori
  const kategori = await prisma.kategori.create({
    data: { nama: 'Test Category' },
  });

  // Create test products
  const products = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.produk.create({
        data: {
          ...createTestProduct(),
          kategoriId: kategori.id,
        },
      })
    )
  );

  // Create stock for each product
  for (const product of products) {
    await prisma.stok.create({
      data: {
        produkId: product.id,
        cabangId: cabang.id,
        jumlah: 100,
        stokMinimum: 10,
      },
    });
  }

  return { cabang, products };
}
```

---

## 8. CI/CD Integration

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: gugaramku_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gugaramku_test
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gugaramku_test

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 9. Test Scripts

### 9.1 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

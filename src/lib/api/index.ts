import type { ApiResponse, ProdukWithDetails, TransaksiWithDetails, PaginationMeta, Kategori } from '@/types';

const API_BASE = '/api';

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Gagal terhubung ke server',
      },
    };
  }
}

// ==========================================
// CATEGORIES API
// ==========================================

export async function getCategories(): Promise<ApiResponse<Kategori[]>> {
  return fetchApi<Kategori[]>('/categories');
}

export async function getCategory(id: string): Promise<ApiResponse<Kategori>> {
  return fetchApi<Kategori>(`/categories/${id}`);
}

export async function createCategory(data: {
  nama: string;
  deskripsi?: string;
}): Promise<ApiResponse<Kategori>> {
  return fetchApi<Kategori>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: { nama: string; deskripsi?: string; isActive?: boolean }
): Promise<ApiResponse<Kategori>> {
  return fetchApi<Kategori>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderCategories(
  orders: Array<{ id: string; urutan: number }>
): Promise<ApiResponse<null>> {
  return fetchApi<null>('/categories/reorder', {
    method: 'PUT',
    body: JSON.stringify({ orders }),
  });
}

// ==========================================
// PRODUCTS API
// ==========================================

export interface SearchProductsParams {
  search?: string;
  kategoriId?: string;
  barcode?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface SearchProductsResult {
  products: ProdukWithDetails[];
  meta?: PaginationMeta;
}

export async function searchProducts(
  params: SearchProductsParams = {}
): Promise<ApiResponse<SearchProductsResult>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.kategoriId) searchParams.set('kategoriId', params.kategoriId);
  if (params.barcode) searchParams.set('barcode', params.barcode);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));

  const queryString = searchParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  const response = await fetchApi<ProdukWithDetails[]>(endpoint);

  if (response.success && response.data) {
    return {
      success: true,
      data: {
        products: response.data,
        meta: response.meta,
      },
    };
  }

  return {
    success: false,
    error: response.error,
  };
}

export async function getProductByBarcode(
  barcode: string
): Promise<ApiResponse<ProdukWithDetails | null>> {
  const response = await searchProducts({ barcode, limit: 1 });

  if (response.success && response.data?.products.length) {
    return {
      success: true,
      data: response.data.products[0],
    };
  }

  return {
    success: true,
    data: null,
  };
}

export async function getProduct(id: string): Promise<ApiResponse<ProdukWithDetails>> {
  return fetchApi<ProdukWithDetails>(`/products/${id}`);
}

export interface CreateProductParams {
  barcode?: string | null;
  nama: string;
  kategoriId?: string | null;
  hargaModal: number;
  satuanDasar: string;
  gambar?: string | null;
  cabangId?: string;
  stokAwal?: number;
  stokMinimum?: number;
  satuan: Array<{
    namaSatuan: string;
    konversi: number;
    harga1: number;
    harga2: number;
    harga3: number;
    harga4: number;
    isDefault?: boolean;
  }>;
}

export async function createProduct(
  params: CreateProductParams
): Promise<ApiResponse<ProdukWithDetails>> {
  return fetchApi<ProdukWithDetails>('/products', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateProduct(
  id: string,
  params: Partial<CreateProductParams> & { isActive?: boolean }
): Promise<ApiResponse<ProdukWithDetails>> {
  return fetchApi<ProdukWithDetails>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/products/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// TRANSACTIONS API
// ==========================================

export interface CreateTransactionParams {
  cabangId: string;
  kasirId: string;
  pelangganId?: string | null;
  tingkatHarga: number;
  metodeBayar: 'TUNAI' | 'QRIS' | 'TRANSFER' | 'HUTANG' | 'SPLIT';
  jumlahBayar: number;
  catatan?: string | null;
  diskonTotal: number;
  items: Array<{
    produkId?: string | null;
    produkSatuanId?: string | null;
    namaBarang: string;
    barcode?: string | null;
    jumlah: number;
    satuan: string;
    konversi: number;
    hargaModal: number;
    hargaJual: number;
    diskon: number;
    isQuickSale: boolean;
  }>;
}

export async function createTransaction(
  params: CreateTransactionParams
): Promise<ApiResponse<TransaksiWithDetails>> {
  return fetchApi<TransaksiWithDetails>('/transactions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface GetTransactionsParams {
  cabangId?: string;
  kasirId?: string;
  tanggalMulai?: string;
  tanggalAkhir?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<ApiResponse<TransaksiWithDetails[]>> {
  const searchParams = new URLSearchParams();

  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.kasirId) searchParams.set('kasirId', params.kasirId);
  if (params.tanggalMulai) searchParams.set('tanggalMulai', params.tanggalMulai);
  if (params.tanggalAkhir) searchParams.set('tanggalAkhir', params.tanggalAkhir);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;

  return fetchApi<TransaksiWithDetails[]>(endpoint);
}

// ==========================================
// STOCK API
// ==========================================

export interface StockItem {
  id: string | null;
  produkId: string;
  cabangId: string;
  barcode: string | null;
  namaProduk: string;
  kategori: string | null;
  satuanDasar: string;
  jumlah: number;
  stokMinimum: number;
  status: 'normal' | 'low' | 'empty';
  updatedAt: string | null;
}

export interface StockMutation {
  id: string;
  produkId: string;
  namaProduk: string;
  barcode: string | null;
  satuanDasar: string;
  cabangId: string;
  jumlah: number;
  jumlahSebelum: number;
  jumlahSesudah: number;
  tipe: string;
  referensiTipe: string | null;
  referensiId: string | null;
  keterangan: string | null;
  userId: string;
  namaUser: string;
  createdAt: string;
}

export interface GetStockParams {
  search?: string;
  kategoriId?: string;
  cabangId?: string;
  status?: 'normal' | 'low' | 'empty';
  page?: number;
  limit?: number;
}

export async function getStock(params: GetStockParams = {}): Promise<ApiResponse<StockItem[]>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.kategoriId) searchParams.set('kategoriId', params.kategoriId);
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = `/stock${queryString ? `?${queryString}` : ''}`;

  return fetchApi<StockItem[]>(endpoint);
}

export interface CreateAdjustmentParams {
  produkId: string;
  cabangId?: string;
  jumlah: number;
  tipe: 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'OPNAME' | 'RUSAK' | 'EXPIRED';
  keterangan?: string;
  userId?: string;
}

export async function createStockAdjustment(
  params: CreateAdjustmentParams
): Promise<ApiResponse<{ stok: unknown; mutasi: unknown }>> {
  return fetchApi('/stock/adjustment', {
    method: 'POST',
    body: JSON.stringify({
      ...params,
      cabangId: params.cabangId || 'demo-cabang-001',
    }),
  });
}

export interface GetMutationsParams {
  produkId?: string;
  cabangId?: string;
  tipe?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getStockMutations(
  params: GetMutationsParams = {}
): Promise<ApiResponse<StockMutation[]>> {
  const searchParams = new URLSearchParams();

  if (params.produkId) searchParams.set('produkId', params.produkId);
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.tipe) searchParams.set('tipe', params.tipe);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = `/stock/mutations${queryString ? `?${queryString}` : ''}`;

  return fetchApi<StockMutation[]>(endpoint);
}

// ==========================================
// CUSTOMERS API
// ==========================================

export interface Customer {
  id: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  kategori: string;
  maxHutang: number;
  totalBelanja: number;
  catatan: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetCustomersParams {
  search?: string;
  kategori?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getCustomers(params: GetCustomersParams = {}): Promise<ApiResponse<Customer[]>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.kategori) searchParams.set('kategori', params.kategori);
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

  return fetchApi<Customer[]>(endpoint);
}

export interface CreateCustomerParams {
  nama: string;
  telepon?: string;
  alamat?: string;
  kategori?: 'RETAIL' | 'RESELLER' | 'DISTRIBUTOR';
  maxHutang?: number;
  catatan?: string;
}

export async function createCustomer(params: CreateCustomerParams): Promise<ApiResponse<Customer>> {
  return fetchApi<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function updateCustomer(
  id: string,
  params: Partial<CreateCustomerParams> & { isActive?: boolean }
): Promise<ApiResponse<Customer>> {
  return fetchApi<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteCustomer(id: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/customers/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// DEBTS API
// ==========================================

export interface Debt {
  id: string;
  transaksiId: string;
  pelangganId: string;
  jumlah: number;
  sisa: number;
  jatuhTempo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  pelanggan: {
    id: string;
    nama: string;
    telepon: string | null;
  };
  transaksi: {
    id: string;
    nomor: string;
    tanggal: string;
    total: number;
  };
  pembayaran: Array<{
    id: string;
    jumlah: number;
    metode: string;
    catatan: string | null;
    createdAt: string;
  }>;
}

export interface GetDebtsParams {
  pelangganId?: string;
  status?: 'BELUM_LUNAS' | 'LUNAS';
  page?: number;
  limit?: number;
}

export async function getDebts(params: GetDebtsParams = {}): Promise<ApiResponse<Debt[]>> {
  const searchParams = new URLSearchParams();

  if (params.pelangganId) searchParams.set('pelangganId', params.pelangganId);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = `/debts${queryString ? `?${queryString}` : ''}`;

  return fetchApi<Debt[]>(endpoint);
}

export interface PayDebtParams {
  jumlah: number;
  metode?: 'TUNAI' | 'QRIS' | 'TRANSFER';
  catatan?: string;
  userId?: string;
}

export async function payDebt(id: string, params: PayDebtParams): Promise<ApiResponse<unknown>> {
  return fetchApi(`/debts/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ==========================================
// KAS API
// ==========================================

export interface KasBalance {
  id: string;
  cabangId: string;
  saldo: number;
  updatedAt: string;
}

export interface KasMutation {
  id: string;
  cabangId: string;
  jenis: 'MASUK' | 'KELUAR';
  kategori: string;
  nominal: number;
  saldoSebelum: number;
  saldoSesudah: number;
  keterangan: string | null;
  referensiTipe: string | null;
  referensiId: string | null;
  userId: string;
  namaUser: string;
  createdAt: string;
}

export interface GetKasParams {
  cabangId?: string;
}

export async function getKasBalance(params: GetKasParams = {}): Promise<ApiResponse<KasBalance>> {
  const searchParams = new URLSearchParams();

  if (params.cabangId) searchParams.set('cabangId', params.cabangId);

  const queryString = searchParams.toString();
  const endpoint = `/kas${queryString ? `?${queryString}` : ''}`;

  return fetchApi<KasBalance>(endpoint);
}

export interface GetKasMutationsParams {
  cabangId?: string;
  jenis?: 'MASUK' | 'KELUAR';
  kategori?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getKasMutations(
  params: GetKasMutationsParams = {}
): Promise<ApiResponse<KasMutation[]>> {
  const searchParams = new URLSearchParams();

  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.jenis) searchParams.set('jenis', params.jenis);
  if (params.kategori) searchParams.set('kategori', params.kategori);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = `/kas/mutations${queryString ? `?${queryString}` : ''}`;

  return fetchApi<KasMutation[]>(endpoint);
}

export interface CreateKasMutationParams {
  cabangId?: string;
  kategori: string;
  nominal: number;
  keterangan?: string;
  userId?: string;
  referensiTipe?: string;
  referensiId?: string;
}

export interface KasMutationResponse {
  mutasi: KasMutation;
  kas: KasBalance;
}

export async function createKasIn(
  params: CreateKasMutationParams
): Promise<ApiResponse<KasMutationResponse>> {
  return fetchApi<KasMutationResponse>('/kas/in', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createKasOut(
  params: CreateKasMutationParams
): Promise<ApiResponse<KasMutationResponse>> {
  return fetchApi<KasMutationResponse>('/kas/out', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ==========================================
// REPORTS API
// ==========================================

export interface DashboardData {
  today: {
    totalPenjualan: number;
    totalTransaksi: number;
    totalLaba: number;
    totalItem: number;
  };
  changes: {
    penjualan: number;
    transaksi: number;
    laba: number;
  };
  alerts: {
    lowStock: number;
    emptyStock: number;
    pendingDebts: number;
    totalDebt: number;
  };
  kas: {
    saldo: number;
  };
}

export interface GetDashboardParams {
  cabangId?: string;
}

export async function getDashboard(
  params: GetDashboardParams = {}
): Promise<ApiResponse<DashboardData>> {
  const searchParams = new URLSearchParams();
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  const queryString = searchParams.toString();
  const endpoint = `/reports/dashboard${queryString ? `?${queryString}` : ''}`;
  return fetchApi<DashboardData>(endpoint);
}

export interface SalesReportData {
  periode: {
    start: string;
    end: string;
    type: string;
  };
  summary: {
    totalPenjualan: number;
    totalTransaksi: number;
    totalLaba: number;
    totalItem: number;
    totalDiskon: number;
    rataRataPerTransaksi: number;
  };
  byPaymentMethod: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  chartData: Array<{
    date: string;
    penjualan: number;
    laba: number;
    transaksi: number;
  }>;
  transactions: Array<{
    id: string;
    nomor: string;
    tanggal: string;
    pelanggan: string;
    kasir: string;
    metodeBayar: string;
    subtotal: number;
    diskon: number;
    total: number;
    laba: number;
    itemCount: number;
  }>;
}

export interface GetSalesReportParams {
  cabangId?: string;
  periode?: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  startDate?: string;
  endDate?: string;
}

export async function getSalesReport(
  params: GetSalesReportParams = {}
): Promise<ApiResponse<SalesReportData>> {
  const searchParams = new URLSearchParams();
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.periode) searchParams.set('periode', params.periode);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  const queryString = searchParams.toString();
  const endpoint = `/reports/sales${queryString ? `?${queryString}` : ''}`;
  return fetchApi<SalesReportData>(endpoint);
}

export interface TopProductsData {
  periode: {
    start: string;
    end: string;
    type: string;
  };
  topProducts: Array<{
    produkId: string;
    nama: string;
    barcode: string | null;
    kategori: string | null;
    totalTerjual: number;
    totalPendapatan: number;
    totalLaba: number;
    transaksiCount: number;
  }>;
  slowProducts: Array<{
    produkId: string;
    nama: string;
    barcode: string | null;
    kategori: string | null;
    totalTerjual: number;
    totalPendapatan: number;
    totalLaba: number;
    transaksiCount: number;
  }>;
  neverSold: Array<{
    produkId: string;
    nama: string;
    barcode: string | null;
    kategori: string | null;
    stok: number;
  }>;
  totalProducts: number;
}

export interface GetTopProductsParams {
  cabangId?: string;
  periode?: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export async function getTopProducts(
  params: GetTopProductsParams = {}
): Promise<ApiResponse<TopProductsData>> {
  const searchParams = new URLSearchParams();
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.periode) searchParams.set('periode', params.periode);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  const queryString = searchParams.toString();
  const endpoint = `/reports/top-products${queryString ? `?${queryString}` : ''}`;
  return fetchApi<TopProductsData>(endpoint);
}

// ==========================================
// RETUR API
// ==========================================

export interface ReturItem {
  id: string;
  namaBarang: string;
  satuan: string;
  jumlah: number;
  nilaiRefund: number;
}

export interface Retur {
  id: string;
  nomor: string;
  tanggal: string;
  transaksiAsal: {
    id: string;
    nomor: string;
    tanggal: string;
    total: number;
    pelanggan: string;
  };
  totalRefund: number;
  metodeRefund: string;
  alasan: string;
  catatan: string | null;
  user: string;
  itemCount: number;
  detail: ReturItem[];
  createdAt: string;
}

export interface GetReturParams {
  cabangId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getReturList(
  params: GetReturParams = {}
): Promise<ApiResponse<Retur[]>> {
  const searchParams = new URLSearchParams();
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.search) searchParams.set('search', params.search);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  const queryString = searchParams.toString();
  const endpoint = `/retur${queryString ? `?${queryString}` : ''}`;
  return fetchApi<Retur[]>(endpoint);
}

export interface TransactionForRetur {
  id: string;
  nomor: string;
  tanggal: string;
  pelanggan: string;
  kasir: string;
  total: number;
  metodeBayar: string;
  items: Array<{
    id: string;
    produkId: string | null;
    namaBarang: string;
    barcode: string | null;
    jumlah: number;
    satuan: string;
    hargaJual: number;
    diskon: number;
    subtotal: number;
    alreadyReturned: number;
    returnable: number;
  }>;
  hasReturnableItems: boolean;
}

export async function searchTransactionForRetur(
  search: string,
  cabangId?: string
): Promise<ApiResponse<TransactionForRetur[]>> {
  const searchParams = new URLSearchParams();
  searchParams.set('search', search);
  if (cabangId) searchParams.set('cabangId', cabangId);
  const queryString = searchParams.toString();
  return fetchApi<TransactionForRetur[]>(`/retur/search-transaction?${queryString}`);
}

export interface CreateReturParams {
  transaksiId: string;
  cabangId?: string;
  userId?: string;
  metodeRefund: 'TUNAI' | 'TUKAR_BARANG';
  alasan: 'RUSAK' | 'SALAH' | 'EXPIRED' | 'LAINNYA';
  catatan?: string;
  items: Array<{
    detailTransaksiId: string;
    jumlah: number;
  }>;
}

export async function createRetur(
  params: CreateReturParams
): Promise<ApiResponse<Retur>> {
  return fetchApi<Retur>('/retur', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ==========================================
// SETTINGS API
// ==========================================

export interface RekeningBank {
  id: string;
  bank: string;
  noRekening: string;
  atasNama: string;
}

export interface StoreSettings {
  id: string;
  namaToko: string;
  alamat: string | null;
  telepon: string | null;
  email: string | null;
  logo: string | null;
  footerStruk: string | null;
  printerSize: '58mm' | '80mm';
  autoLogoutMenit: number;
  qrisImage: string | null;
  rekeningBank: RekeningBank[];
  updatedAt: string;
}

export async function getSettings(): Promise<ApiResponse<StoreSettings>> {
  return fetchApi<StoreSettings>('/settings');
}

export interface UpdateSettingsParams {
  namaToko?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  logo?: string | null;
  footerStruk?: string;
  printerSize?: '58mm' | '80mm';
  autoLogoutMenit?: number;
  qrisImage?: string | null;
  rekeningBank?: RekeningBank[];
}

export async function updateSettings(
  params: UpdateSettingsParams
): Promise<ApiResponse<StoreSettings>> {
  return fetchApi<StoreSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

// ==========================================
// USERS API
// ==========================================

export interface User {
  id: string;
  nama: string;
  email: string;
  role: 'OWNER' | 'ADMIN_CABANG' | 'KASIR';
  pin: string | null;
  isActive: boolean;
  lastLogin: string | null;
  cabang: {
    id: string;
    nama: string;
    kode: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  cabangId?: string;
  page?: number;
  limit?: number;
}

export async function getUsers(
  params: GetUsersParams = {}
): Promise<ApiResponse<User[]>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params.cabangId) searchParams.set('cabangId', params.cabangId);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  const queryString = searchParams.toString();
  const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
  return fetchApi<User[]>(endpoint);
}

export interface CreateUserParams {
  nama: string;
  email: string;
  password: string;
  pin?: string;
  role?: 'OWNER' | 'ADMIN_CABANG' | 'KASIR';
  cabangId?: string;
}

export async function createUser(
  params: CreateUserParams
): Promise<ApiResponse<User>> {
  return fetchApi<User>('/users', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface UpdateUserParams {
  nama?: string;
  email?: string;
  role?: 'OWNER' | 'ADMIN_CABANG' | 'KASIR';
  pin?: string;
  cabangId?: string | null;
  isActive?: boolean;
}

export async function updateUser(
  id: string,
  params: UpdateUserParams
): Promise<ApiResponse<User>> {
  return fetchApi<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function resetUserPassword(
  id: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>(`/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

// ==========================================
// BRANCHES API
// ==========================================

export interface Branch {
  id: string;
  kode: string;
  nama: string;
  alamat: string | null;
  telepon: string | null;
  isActive: boolean;
  userCount: number;
  transactionCount: number;
  kasSaldo: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetBranchesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getBranches(
  params: GetBranchesParams = {}
): Promise<ApiResponse<Branch[]>> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  const queryString = searchParams.toString();
  const endpoint = `/branches${queryString ? `?${queryString}` : ''}`;
  return fetchApi<Branch[]>(endpoint);
}

export interface CreateBranchParams {
  kode: string;
  nama: string;
  alamat?: string;
  telepon?: string;
}

export async function createBranch(
  params: CreateBranchParams
): Promise<ApiResponse<Branch>> {
  return fetchApi<Branch>('/branches', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface UpdateBranchParams {
  kode?: string;
  nama?: string;
  alamat?: string;
  telepon?: string;
  isActive?: boolean;
}

export async function updateBranch(
  id: string,
  params: UpdateBranchParams
): Promise<ApiResponse<Branch>> {
  return fetchApi<Branch>(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function deleteBranch(id: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/branches/${id}`, {
    method: 'DELETE',
  });
}

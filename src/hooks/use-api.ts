'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  searchProducts, 
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createTransaction,
  getTransactions,
  getStock,
  getStockMutations,
  createStockAdjustment,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getDebts,
  payDebt,
  getKasBalance,
  getKasMutations,
  createKasIn,
  createKasOut,
  getDashboard,
  getSalesReport,
  getTopProducts,
  getReturList,
  searchTransactionForRetur,
  createRetur,
  getSettings,
  updateSettings,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type SearchProductsParams,
  type CreateProductParams,
  type CreateTransactionParams,
  type GetTransactionsParams,
  type GetStockParams,
  type GetMutationsParams,
  type CreateAdjustmentParams,
  type GetCustomersParams,
  type CreateCustomerParams,
  type GetDebtsParams,
  type PayDebtParams,
  type GetKasParams,
  type GetKasMutationsParams,
  type CreateKasMutationParams,
  type GetDashboardParams,
  type GetSalesReportParams,
  type GetTopProductsParams,
  type GetReturParams,
  type CreateReturParams,
  type UpdateSettingsParams,
  type GetUsersParams,
  type CreateUserParams,
  type UpdateUserParams,
  type GetBranchesParams,
  type CreateBranchParams,
  type UpdateBranchParams,
} from '@/lib/api';
import type { ProdukWithDetails, Kategori } from '@/types';

// ==========================================
// CATEGORIES HOOKS
// ==========================================

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await getCategories();
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat kategori');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nama: string; deskripsi?: string }) => {
      const response = await createCategory(data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menambah kategori');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nama: string; deskripsi?: string; isActive?: boolean }) => {
      const response = await updateCategory(id, data);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memperbarui kategori');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteCategory(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menghapus kategori');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orders: Array<{ id: string; urutan: number }>) => {
      const response = await reorderCategories(orders);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal mengubah urutan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ==========================================
// PRODUCTS HOOKS
// ==========================================

export function useProducts(params: SearchProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await searchProducts(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat produk');
      }
      return response.data!;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useProductSearch(search: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['products', 'search', search],
    queryFn: async () => {
      const response = await searchProducts({ search, limit: 50 });
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal mencari produk');
      }
      return response.data?.products || [];
    },
    enabled: options?.enabled ?? true,
    staleTime: 10 * 1000, // 10 seconds for search
  });
}

export function useProduct(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const response = await getProduct(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat produk');
      }
      return response.data!;
    },
    enabled: options?.enabled ?? !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateProductParams) => {
      const response = await createProduct(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menambah produk');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: Partial<CreateProductParams> & { id: string; isActive?: boolean }) => {
      const response = await updateProduct(id, params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memperbarui produk');
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', data.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteProduct(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menghapus produk');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ==========================================
// TRANSACTIONS HOOKS
// ==========================================

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTransactionParams) => {
      const response = await createTransaction(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menyimpan transaksi');
      }
      return response.data!;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changed
    },
  });
}

export function useTransactions(params: GetTransactionsParams = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const response = await getTransactions(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat transaksi');
      }
      return {
        transactions: response.data || [],
        meta: response.meta,
      };
    },
  });
}

// ==========================================
// STOCK HOOKS
// ==========================================

export function useStock(params: GetStockParams = {}) {
  return useQuery({
    queryKey: ['stock', params],
    queryFn: async () => {
      const response = await getStock(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat stok');
      }
      return {
        items: response.data || [],
        meta: response.meta,
      };
    },
    staleTime: 30 * 1000,
  });
}

export function useStockMutations(params: GetMutationsParams = {}) {
  return useQuery({
    queryKey: ['stock-mutations', params],
    queryFn: async () => {
      const response = await getStockMutations(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat riwayat mutasi');
      }
      return {
        mutations: response.data || [],
        meta: response.meta,
      };
    },
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateAdjustmentParams) => {
      const response = await createStockAdjustment(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menyimpan adjustment');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-mutations'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ==========================================
// CUSTOMERS HOOKS
// ==========================================

export function useCustomers(params: GetCustomersParams = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await getCustomers(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat pelanggan');
      }
      return {
        customers: response.data || [],
        meta: response.meta,
      };
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCustomerParams) => {
      const response = await createCustomer(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menambah pelanggan');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: Partial<CreateCustomerParams> & { id: string; isActive?: boolean }) => {
      const response = await updateCustomer(id, params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memperbarui pelanggan');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteCustomer(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menghapus pelanggan');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// ==========================================
// DEBTS HOOKS
// ==========================================

export function useDebts(params: GetDebtsParams = {}) {
  return useQuery({
    queryKey: ['debts', params],
    queryFn: async () => {
      const response = await getDebts(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat hutang');
      }
      return {
        debts: response.data || [],
        meta: response.meta,
      };
    },
  });
}

export function usePayDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: PayDebtParams & { id: string }) => {
      const response = await payDebt(id, params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memproses pembayaran');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// ==========================================
// KAS HOOKS
// ==========================================

export function useKasBalance(params: GetKasParams = {}) {
  return useQuery({
    queryKey: ['kas', 'balance', params],
    queryFn: async () => {
      const response = await getKasBalance(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat saldo kas');
      }
      return response.data!;
    },
    staleTime: 30 * 1000,
  });
}

export function useKasMutations(params: GetKasMutationsParams = {}) {
  return useQuery({
    queryKey: ['kas', 'mutations', params],
    queryFn: async () => {
      const response = await getKasMutations(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat mutasi kas');
      }
      return {
        mutations: response.data || [],
        meta: response.meta,
      };
    },
  });
}

export function useCreateKasIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateKasMutationParams) => {
      const response = await createKasIn(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menyimpan kas masuk');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kas'] });
    },
  });
}

export function useCreateKasOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateKasMutationParams) => {
      const response = await createKasOut(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menyimpan kas keluar');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kas'] });
    },
  });
}

// ==========================================
// REPORTS HOOKS
// ==========================================

export function useDashboard(params: GetDashboardParams = {}) {
  return useQuery({
    queryKey: ['reports', 'dashboard', params],
    queryFn: async () => {
      const response = await getDashboard(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat dashboard');
      }
      return response.data!;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Auto refresh every minute
  });
}

export function useSalesReport(params: GetSalesReportParams = {}) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => {
      const response = await getSalesReport(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat laporan penjualan');
      }
      return response.data!;
    },
    staleTime: 60 * 1000,
  });
}

export function useTopProducts(params: GetTopProductsParams = {}) {
  return useQuery({
    queryKey: ['reports', 'top-products', params],
    queryFn: async () => {
      const response = await getTopProducts(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat produk terlaris');
      }
      return response.data!;
    },
    staleTime: 60 * 1000,
  });
}

// ==========================================
// RETUR HOOKS
// ==========================================

export function useReturList(params: GetReturParams = {}) {
  return useQuery({
    queryKey: ['retur', params],
    queryFn: async () => {
      const response = await getReturList(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat data retur');
      }
      return {
        returList: response.data || [],
        meta: response.meta,
      };
    },
  });
}

export function useSearchTransactionForRetur(search: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['retur', 'search-transaction', search],
    queryFn: async () => {
      const response = await searchTransactionForRetur(search);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal mencari transaksi');
      }
      return response.data || [];
    },
    enabled: options?.enabled ?? (search.length >= 3),
    staleTime: 30 * 1000,
  });
}

export function useCreateRetur() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateReturParams) => {
      const response = await createRetur(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menyimpan retur');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retur'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['kas'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ==========================================
// SETTINGS HOOKS
// ==========================================

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await getSettings();
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat pengaturan');
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateSettingsParams) => {
      const response = await updateSettings(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menyimpan pengaturan');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ==========================================
// USERS HOOKS
// ==========================================

export function useUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await getUsers(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat data karyawan');
      }
      return {
        users: response.data || [],
        meta: response.meta,
      };
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateUserParams) => {
      const response = await createUser(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menambah karyawan');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateUserParams & { id: string }) => {
      const response = await updateUser(id, params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memperbarui karyawan');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteUser(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menghapus karyawan');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const response = await resetUserPassword(id, newPassword);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal mereset password');
      }
      return response.data!;
    },
  });
}

// ==========================================
// BRANCHES HOOKS
// ==========================================

export function useBranches(params: GetBranchesParams = {}) {
  return useQuery({
    queryKey: ['branches', params],
    queryFn: async () => {
      const response = await getBranches(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memuat data cabang');
      }
      return {
        branches: response.data || [],
        meta: response.meta,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateBranchParams) => {
      const response = await createBranch(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menambah cabang');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateBranchParams & { id: string }) => {
      const response = await updateBranch(id, params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal memperbarui cabang');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteBranch(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Gagal menghapus cabang');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

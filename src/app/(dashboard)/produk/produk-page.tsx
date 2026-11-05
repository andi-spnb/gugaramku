'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Package, Loader2 } from 'lucide-react';
import { useProducts, useCategories, useDeleteProduct } from '@/hooks/use-api';
import { ProductTable } from '@/components/produk/product-table';
import { ProductFormDialog } from '@/components/produk/product-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import type { ProdukWithDetails } from '@/types';

export function ProdukPage() {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProdukWithDetails | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProdukWithDetails | null>(null);

  // Fetch data
  const { data: kategoris } = useCategories();
  const { data, isLoading, isError } = useProducts({
    search: search || undefined,
    kategoriId: kategoriFilter || undefined,
    isActive: showInactive ? undefined : true,
    page,
    limit,
  });

  const deleteProductMutation = useDeleteProduct();

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: ProdukWithDetails) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (product: ProdukWithDetails) => {
    setDeletingProduct(product);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      await deleteProductMutation.mutateAsync(deletingProduct.id);
      toast.success('Produk berhasil dihapus');
      setDeletingProduct(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus produk');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola data produk, satuan, dan harga
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddProduct}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama produk atau barcode..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={kategoriFilter}
              onChange={(e) => {
                setKategoriFilter(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[180px]"
            >
              <option value="">Semua Kategori</option>
              {kategoris?.map((kat) => (
                <option key={kat.id} value={kat.id}>
                  {kat.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Show Inactive Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            Tampilkan nonaktif
          </label>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data produk</p>
          <p className="text-sm text-gray-400 mt-1">Silakan coba lagi nanti</p>
        </div>
      ) : !data?.products.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada produk</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Coba kata kunci lain' : 'Tambahkan produk pertama Anda'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleAddProduct}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          )}
        </div>
      ) : (
        <>
          <ProductTable
            products={data.products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />

          {/* Pagination */}
          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, data.meta.total)} dari {data.meta.total} produk
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-600">
                  Halaman {page} dari {data.meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.meta.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={handleFormSuccess}
        product={editingProduct}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={confirmDelete}
        title="Hapus Produk?"
        description={`Anda akan menghapus produk "${deletingProduct?.nama}". ${deletingProduct?.isActive ? 'Jika produk memiliki riwayat transaksi, produk akan dinonaktifkan.' : ''}`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}

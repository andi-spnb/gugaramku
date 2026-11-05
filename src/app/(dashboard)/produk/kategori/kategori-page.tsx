'use client';

import { useState } from 'react';
import { Plus, FolderOpen, Loader2, GripVertical, Pencil, Trash2, Package } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories } from '@/hooks/use-api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import type { Kategori } from '@/types';

export function KategoriPage() {
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Kategori | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Kategori | null>(null);
  
  // Form state
  const [formNama, setFormNama] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');

  // Fetch data
  const { data: kategoris, isLoading, isError } = useCategories();
  
  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormNama('');
    setFormDeskripsi('');
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Kategori) => {
    setEditingCategory(category);
    setFormNama(category.nama);
    setFormDeskripsi(category.deskripsi || '');
    setIsFormOpen(true);
  };

  const handleDeleteCategory = (category: Kategori) => {
    setDeletingCategory(category);
  };

  const handleSubmitForm = async () => {
    if (!formNama.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          nama: formNama.trim(),
          deskripsi: formDeskripsi.trim() || undefined,
        });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await createMutation.mutateAsync({
          nama: formNama.trim(),
          deskripsi: formDeskripsi.trim() || undefined,
        });
        toast.success('Kategori berhasil ditambahkan');
      }
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan kategori');
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      await deleteMutation.mutateAsync(deletingCategory.id);
      toast.success('Kategori berhasil dihapus');
      setDeletingCategory(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus kategori');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (!kategoris || index === 0) return;
    
    const newOrders = kategoris.map((k, i) => ({
      id: k.id,
      urutan: i === index ? kategoris[i - 1].urutan : i === index - 1 ? kategoris[i].urutan : k.urutan,
    }));
    
    // Swap urutan values
    const temp = newOrders[index].urutan;
    newOrders[index].urutan = newOrders[index - 1].urutan;
    newOrders[index - 1].urutan = temp;

    try {
      await reorderMutation.mutateAsync(newOrders);
    } catch (error) {
      toast.error('Gagal mengubah urutan');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (!kategoris || index === kategoris.length - 1) return;
    
    const newOrders = kategoris.map((k, i) => ({
      id: k.id,
      urutan: i === index ? kategoris[i + 1].urutan : i === index + 1 ? kategoris[i].urutan : k.urutan,
    }));
    
    // Swap urutan values  
    const temp = newOrders[index].urutan;
    newOrders[index].urutan = newOrders[index + 1].urutan;
    newOrders[index + 1].urutan = temp;

    try {
      await reorderMutation.mutateAsync(newOrders);
    } catch (error) {
      toast.error('Gagal mengubah urutan');
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kategori</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola kategori untuk mengelompokkan produk
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddCategory}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Tambah Kategori
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data kategori</p>
          <p className="text-sm text-gray-400 mt-1">Silakan coba lagi nanti</p>
        </div>
      ) : !kategoris?.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada kategori</p>
          <p className="text-sm text-gray-400 mt-1">Tambahkan kategori untuk mengelompokkan produk</p>
          <button
            type="button"
            onClick={handleAddCategory}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Urutan
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kategoris.map((kategori, index) => (
                  <tr key={kategori.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FolderOpen className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-gray-900">{kategori.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {kategori.deskripsi || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reorderMutation.isPending}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Pindah ke atas"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === kategoris.length - 1 || reorderMutation.isPending}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Pindah ke bawah"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditCategory(kategori)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(kategori)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !isFormLoading && setIsFormOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Makanan Ringan"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi <span className="text-gray-400">(opsional)</span>
                </label>
                <textarea
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Deskripsi singkat kategori"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isFormLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitForm}
                disabled={isFormLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isFormLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCategory ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDelete}
        title="Hapus Kategori?"
        description={`Anda akan menghapus kategori "${deletingCategory?.nama}". Kategori tidak dapat dihapus jika masih memiliki produk.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

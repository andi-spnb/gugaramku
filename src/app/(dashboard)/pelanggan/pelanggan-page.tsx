'use client';

import { useState } from 'react';
import { Plus, Search, Users, Loader2, Pencil, Trash2, Phone, MapPin } from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/use-api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import type { Customer } from '@/lib/api';

const KATEGORI_OPTIONS = [
  { value: 'RETAIL', label: 'Retail', color: 'bg-blue-100 text-blue-700' },
  { value: 'RESELLER', label: 'Reseller', color: 'bg-green-100 text-green-700' },
  { value: 'DISTRIBUTOR', label: 'Distributor', color: 'bg-purple-100 text-purple-700' },
];

export function PelangganPage() {
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [page, setPage] = useState(1);

  // Form dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formNama, setFormNama] = useState('');
  const [formTelepon, setFormTelepon] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formKategori, setFormKategori] = useState<'RETAIL' | 'RESELLER' | 'DISTRIBUTOR'>('RETAIL');
  const [formMaxHutang, setFormMaxHutang] = useState(0);
  const [formCatatan, setFormCatatan] = useState('');

  // Fetch & mutations
  const { data, isLoading, isError } = useCustomers({
    search: search || undefined,
    kategori: kategoriFilter || undefined,
    page,
    limit: 50,
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const resetForm = () => {
    setFormNama('');
    setFormTelepon('');
    setFormAlamat('');
    setFormKategori('RETAIL');
    setFormMaxHutang(0);
    setFormCatatan('');
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormNama(customer.nama);
    setFormTelepon(customer.telepon || '');
    setFormAlamat(customer.alamat || '');
    setFormKategori(customer.kategori as 'RETAIL' | 'RESELLER' | 'DISTRIBUTOR');
    setFormMaxHutang(customer.maxHutang);
    setFormCatatan(customer.catatan || '');
    setIsFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
  };

  const handleSubmit = async () => {
    if (!formNama.trim()) {
      toast.error('Nama pelanggan harus diisi');
      return;
    }

    try {
      if (editingCustomer) {
        await updateMutation.mutateAsync({
          id: editingCustomer.id,
          nama: formNama.trim(),
          telepon: formTelepon.trim() || undefined,
          alamat: formAlamat.trim() || undefined,
          kategori: formKategori,
          maxHutang: formMaxHutang,
          catatan: formCatatan.trim() || undefined,
        });
        toast.success('Pelanggan berhasil diperbarui');
      } else {
        await createMutation.mutateAsync({
          nama: formNama.trim(),
          telepon: formTelepon.trim() || undefined,
          alamat: formAlamat.trim() || undefined,
          kategori: formKategori,
          maxHutang: formMaxHutang,
          catatan: formCatatan.trim() || undefined,
        });
        toast.success('Pelanggan berhasil ditambahkan');
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pelanggan');
    }
  };

  const confirmDelete = async () => {
    if (!deletingCustomer) return;

    try {
      await deleteMutation.mutateAsync(deletingCustomer.id);
      toast.success('Pelanggan berhasil dihapus');
      setDeletingCustomer(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus pelanggan');
    }
  };

  const getKategoriBadge = (kategori: string) => {
    const opt = KATEGORI_OPTIONS.find((k) => k.value === kategori);
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${opt?.color || 'bg-gray-100 text-gray-700'}`}>
        {opt?.label || kategori}
      </span>
    );
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pelanggan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data pelanggan toko</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau telepon..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <select
            value={kategoriFilter}
            onChange={(e) => {
              setKategoriFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[160px]"
          >
            <option value="">Semua Kategori</option>
            {KATEGORI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data pelanggan</p>
        </div>
      ) : !data?.customers.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada pelanggan</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Belanja</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Limit Hutang</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{customer.nama}</p>
                      {customer.catatan && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{customer.catatan}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {customer.telepon && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.telepon}
                        </div>
                      )}
                      {customer.alamat && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{customer.alamat}</span>
                        </div>
                      )}
                      {!customer.telepon && !customer.alamat && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{getKategoriBadge(customer.kategori)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatRupiah(customer.totalBelanja)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {customer.maxHutang > 0 ? formatRupiah(customer.maxHutang) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer)}
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
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama pelanggan"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input
                    type="text"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as typeof formKategori)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                  >
                    {KATEGORI_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Alamat lengkap"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit Hutang</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={formMaxHutang || ''}
                    onChange={(e) => setFormMaxHutang(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maksimal hutang yang diizinkan. Kosongkan jika tidak dibatasi.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
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
                onClick={handleSubmit}
                disabled={isFormLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isFormLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCustomer ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={confirmDelete}
        title="Hapus Pelanggan?"
        description={`Anda akan menghapus pelanggan "${deletingCustomer?.nama}". Pelanggan dengan hutang belum lunas tidak dapat dihapus.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

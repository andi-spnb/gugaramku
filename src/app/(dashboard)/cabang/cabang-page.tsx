'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  X,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Receipt,
  Wallet,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from '@/hooks/use-api';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import type { Branch } from '@/lib/api';

type DialogMode = 'create' | 'edit' | null;

export function CabangPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Form state
  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formTelepon, setFormTelepon] = useState('');

  // Fetch data
  const { data, isLoading, isError } = useBranches({
    search: search || undefined,
    isActive: statusFilter !== '' ? statusFilter === 'true' : undefined,
  });

  // Mutations
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Handlers
  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedBranch(null);
    setFormKode('');
    setFormNama('');
    setFormAlamat('');
    setFormTelepon('');
  };

  const handleOpenEdit = (branch: Branch) => {
    setDialogMode('edit');
    setSelectedBranch(branch);
    setFormKode(branch.kode);
    setFormNama(branch.nama);
    setFormAlamat(branch.alamat || '');
    setFormTelepon(branch.telepon || '');
    setMenuOpenId(null);
  };

  const handleCloseDialog = () => {
    if (!isPending) {
      setDialogMode(null);
      setSelectedBranch(null);
    }
  };

  const handleSubmitCreate = async () => {
    if (!formKode.trim()) {
      toast.error('Kode cabang harus diisi');
      return;
    }
    if (!formNama.trim()) {
      toast.error('Nama cabang harus diisi');
      return;
    }

    try {
      await createMutation.mutateAsync({
        kode: formKode,
        nama: formNama,
        alamat: formAlamat || undefined,
        telepon: formTelepon || undefined,
      });
      toast.success('Cabang berhasil ditambahkan');
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambah cabang');
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedBranch) return;
    if (!formKode.trim()) {
      toast.error('Kode cabang harus diisi');
      return;
    }
    if (!formNama.trim()) {
      toast.error('Nama cabang harus diisi');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedBranch.id,
        kode: formKode,
        nama: formNama,
        alamat: formAlamat || undefined,
        telepon: formTelepon || undefined,
      });
      toast.success('Cabang berhasil diperbarui');
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui cabang');
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      await updateMutation.mutateAsync({
        id: branch.id,
        isActive: !branch.isActive,
      });
      toast.success(branch.isActive ? 'Cabang dinonaktifkan' : 'Cabang diaktifkan');
      setMenuOpenId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status');
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (branch.transactionCount > 0) {
      toast.error('Cabang dengan transaksi tidak dapat dihapus. Gunakan nonaktifkan.');
      setMenuOpenId(null);
      return;
    }

    try {
      await deleteMutation.mutateAsync(branch.id);
      toast.success('Cabang berhasil dihapus');
      setMenuOpenId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus cabang');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cabang</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola cabang toko</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Tambah Cabang
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama cabang..."
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[150px]"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Branch List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data cabang</p>
        </div>
      ) : !data?.branches.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data cabang</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Cabang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.branches.map((branch) => (
            <div
              key={branch.id}
              className={`bg-white rounded-xl border ${
                branch.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              } p-5 relative`}
            >
              {/* Menu Button */}
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setMenuOpenId(menuOpenId === branch.id ? null : branch.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuOpenId === branch.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpenId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(branch)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(branch)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        {branch.isActive ? (
                          <>
                            <XCircle className="h-4 w-4" />
                            Nonaktifkan
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Aktifkan
                          </>
                        )}
                      </button>
                      {branch.transactionCount === 0 && (
                        <button
                          type="button"
                          onClick={() => handleDelete(branch)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                      {branch.kode}
                    </span>
                    {branch.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1 truncate">{branch.nama}</h3>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                {branch.alamat && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{branch.alamat}</span>
                  </div>
                )}
                {branch.telepon && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{branch.telepon}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{branch.userCount}</p>
                  <p className="text-xs text-gray-500">Karyawan</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{branch.transactionCount}</p>
                  <p className="text-xs text-gray-500">Transaksi</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatRupiah(branch.kasSaldo)}</p>
                  <p className="text-xs text-gray-500">Kas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {dialogMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {dialogMode === 'create' ? 'Tambah Cabang' : 'Edit Cabang'}
              </h3>
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Kode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Cabang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: CBG01"
                  maxLength={10}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">Kode unik untuk identifikasi cabang</p>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Cabang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Cabang Pusat"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Alamat lengkap cabang"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Telepon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formTelepon}
                  onChange={(e) => setFormTelepon(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={dialogMode === 'create' ? handleSubmitCreate : handleSubmitEdit}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {dialogMode === 'create' ? 'Tambah' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

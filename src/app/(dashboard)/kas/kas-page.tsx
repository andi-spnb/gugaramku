'use client';

import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Loader2,
  Calendar,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import {
  useKasBalance,
  useKasMutations,
  useCreateKasIn,
  useCreateKasOut,
} from '@/hooks/use-api';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import {
  KAS_MASUK_CATEGORIES,
  KAS_KELUAR_CATEGORIES,
  getKasCategoryLabel,
} from '@/lib/constants/kas-categories';

type DialogType = 'masuk' | 'keluar' | null;

export function KasPage() {
  // Filters
  const [jenisFilter, setJenisFilter] = useState<'MASUK' | 'KELUAR' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [kategori, setKategori] = useState('');
  const [nominal, setNominal] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');

  // Fetch data
  const { data: kasBalance, isLoading: isLoadingBalance } = useKasBalance();
  const { data: mutationsData, isLoading: isLoadingMutations, isError } = useKasMutations({
    jenis: jenisFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 50,
  });

  // Mutations
  const kasInMutation = useCreateKasIn();
  const kasOutMutation = useCreateKasOut();

  const isPending = kasInMutation.isPending || kasOutMutation.isPending;

  // Calculate today's summary
  const today = new Date().toISOString().split('T')[0];
  const todayMutations = mutationsData?.mutations.filter(
    (m) => m.createdAt.startsWith(today)
  ) || [];
  const todayMasuk = todayMutations
    .filter((m) => m.jenis === 'MASUK')
    .reduce((sum, m) => sum + m.nominal, 0);
  const todayKeluar = todayMutations
    .filter((m) => m.jenis === 'KELUAR')
    .reduce((sum, m) => sum + m.nominal, 0);

  const handleOpenDialog = (type: DialogType) => {
    setDialogType(type);
    setKategori('');
    setNominal(0);
    setKeterangan('');
  };

  const handleCloseDialog = () => {
    if (!isPending) {
      setDialogType(null);
    }
  };

  const handleSubmit = async () => {
    if (!kategori) {
      toast.error('Pilih kategori');
      return;
    }

    if (!nominal || nominal <= 0) {
      toast.error('Nominal harus lebih dari 0');
      return;
    }

    try {
      if (dialogType === 'masuk') {
        await kasInMutation.mutateAsync({
          kategori,
          nominal,
          keterangan: keterangan || undefined,
        });
        toast.success('Kas masuk berhasil dicatat');
      } else {
        await kasOutMutation.mutateAsync({
          kategori,
          nominal,
          keterangan: keterangan || undefined,
        });
        toast.success('Kas keluar berhasil dicatat');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan');
    }
  };

  const handleClearFilters = () => {
    setJenisFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = jenisFilter || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kas</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kas masuk dan keluar</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleOpenDialog('masuk')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Kas Masuk
          </button>
          <button
            type="button"
            onClick={() => handleOpenDialog('keluar')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Minus className="h-4 w-4" />
            Kas Keluar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Kas */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-white/80 text-sm font-medium">Saldo Kas</span>
          </div>
          {isLoadingBalance ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <p className="text-3xl font-bold">{formatRupiah(kasBalance?.saldo || 0)}</p>
          )}
        </div>

        {/* Kas Masuk Hari Ini */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Masuk Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(todayMasuk)}</p>
        </div>

        {/* Kas Keluar Hari Ini */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-gray-500 text-sm font-medium">Keluar Hari Ini</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatRupiah(todayKeluar)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Jenis Filter */}
            <select
              value={jenisFilter}
              onChange={(e) => {
                setJenisFilter(e.target.value as typeof jenisFilter);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[150px]"
            >
              <option value="">Semua Jenis</option>
              <option value="MASUK">Kas Masuk</option>
              <option value="KELUAR">Kas Keluar</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Dari tanggal"
                />
              </div>
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Sampai tanggal"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Mutations List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Riwayat Mutasi</h2>
        </div>

        {isLoadingMutations ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Gagal memuat data mutasi</p>
          </div>
        ) : !mutationsData?.mutations.length ? (
          <div className="p-8 text-center">
            <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada mutasi kas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {mutationsData.mutations.map((mutation) => (
              <div key={mutation.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mutation.jenis === 'MASUK' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {mutation.jenis === 'MASUK' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {getKasCategoryLabel(mutation.kategori)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          mutation.jenis === 'MASUK'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {mutation.jenis}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {mutation.keterangan || '-'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(mutation.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' • '}
                      {mutation.namaUser}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        mutation.jenis === 'MASUK' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {mutation.jenis === 'MASUK' ? '+' : '-'}
                      {formatRupiah(mutation.nominal)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Saldo: {formatRupiah(mutation.saldoSesudah)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {mutationsData?.meta && mutationsData.meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Halaman {mutationsData.meta.page} dari {mutationsData.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= mutationsData.meta!.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialogType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div
              className={`px-6 py-4 border-b border-gray-200 rounded-t-xl ${
                dialogType === 'masuk' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    dialogType === 'masuk' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {dialogType === 'masuk' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {dialogType === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {dialogType === 'masuk' ? 'Catat uang masuk ke kas' : 'Catat pengeluaran dari kas'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                >
                  <option value="">Pilih kategori</option>
                  {(dialogType === 'masuk' ? KAS_MASUK_CATEGORIES : KAS_KELUAR_CATEGORIES).map(
                    (cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nominal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={nominal || ''}
                    onChange={(e) => setNominal(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[50000, 100000, 200000, 500000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setNominal(amount)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Current Balance Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saldo saat ini</span>
                  <span className="font-medium">{formatRupiah(kasBalance?.saldo || 0)}</span>
                </div>
                {nominal > 0 && (
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Saldo setelah</span>
                    <span
                      className={`font-bold ${
                        dialogType === 'masuk' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatRupiah(
                        (kasBalance?.saldo || 0) +
                          (dialogType === 'masuk' ? nominal : -nominal)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
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
                onClick={handleSubmit}
                disabled={isPending || !kategori || nominal <= 0}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                  dialogType === 'masuk'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Loader2,
  Calendar,
  Package,
  Receipt,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  useReturList,
  useSearchTransactionForRetur,
  useCreateRetur,
} from '@/hooks/use-api';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import type { TransactionForRetur } from '@/lib/api';

const ALASAN_OPTIONS = [
  { value: 'RUSAK', label: 'Barang Rusak' },
  { value: 'SALAH', label: 'Salah Barang' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'LAINNYA', label: 'Lainnya' },
] as const;

const METODE_REFUND_OPTIONS = [
  { value: 'TUNAI', label: 'Refund Tunai' },
  { value: 'TUKAR_BARANG', label: 'Tukar Barang' },
] as const;

type Alasan = typeof ALASAN_OPTIONS[number]['value'];
type MetodeRefund = typeof METODE_REFUND_OPTIONS[number]['value'];

interface SelectedItem {
  detailTransaksiId: string;
  jumlah: number;
  maxJumlah: number;
  namaBarang: string;
  hargaJual: number;
  diskon: number;
}

export function ReturPage() {
  // List filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionForRetur | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [alasan, setAlasan] = useState<Alasan>('RUSAK');
  const [metodeRefund, setMetodeRefund] = useState<MetodeRefund>('TUNAI');
  const [catatan, setCatatan] = useState('');

  // Fetch data
  const { data, isLoading, isError } = useReturList({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 50,
  });

  const { data: searchResults, isLoading: isSearching } = useSearchTransactionForRetur(
    searchQuery,
    { enabled: searchQuery.length >= 3 }
  );

  const createReturMutation = useCreateRetur();

  // Handlers
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setSearchQuery('');
    setSelectedTransaction(null);
    setSelectedItems([]);
    setAlasan('RUSAK');
    setMetodeRefund('TUNAI');
    setCatatan('');
  };

  const handleCloseDialog = () => {
    if (!createReturMutation.isPending) {
      setIsDialogOpen(false);
    }
  };

  const handleSelectTransaction = (transaction: TransactionForRetur) => {
    setSelectedTransaction(transaction);
    setSelectedItems([]);
  };

  const handleToggleItem = (item: TransactionForRetur['items'][0]) => {
    if (item.returnable <= 0) return;

    const exists = selectedItems.find((si) => si.detailTransaksiId === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((si) => si.detailTransaksiId !== item.id));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          detailTransaksiId: item.id,
          jumlah: item.returnable,
          maxJumlah: item.returnable,
          namaBarang: item.namaBarang,
          hargaJual: item.hargaJual,
          diskon: item.diskon,
        },
      ]);
    }
  };

  const handleUpdateItemQty = (detailTransaksiId: string, qty: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.detailTransaksiId === detailTransaksiId
          ? { ...item, jumlah: Math.max(1, Math.min(qty, item.maxJumlah)) }
          : item
      )
    );
  };

  const calculateTotalRefund = () => {
    return selectedItems.reduce(
      (sum, item) => sum + (item.hargaJual - item.diskon) * item.jumlah,
      0
    );
  };

  const handleSubmit = async () => {
    if (!selectedTransaction) {
      toast.error('Pilih transaksi terlebih dahulu');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Pilih minimal 1 item untuk diretur');
      return;
    }

    try {
      await createReturMutation.mutateAsync({
        transaksiId: selectedTransaction.id,
        metodeRefund,
        alasan,
        catatan: catatan || undefined,
        items: selectedItems.map((item) => ({
          detailTransaksiId: item.detailTransaksiId,
          jumlah: item.jumlah,
        })),
      });

      toast.success('Retur berhasil disimpan');
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan retur');
    }
  };

  const getAlasanLabel = (value: string) => {
    return ALASAN_OPTIONS.find((a) => a.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Retur Barang</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola retur dan refund</p>
        </div>
        <button
          type="button"
          onClick={handleOpenDialog}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Retur Baru
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
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
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Retur List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data retur</p>
        </div>
      ) : !data?.returList.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data retur</p>
          <button
            type="button"
            onClick={handleOpenDialog}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Buat Retur Baru
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.returList.map((retur) => (
            <div key={retur.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{retur.nomor}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        retur.metodeRefund === 'TUNAI'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {retur.metodeRefund === 'TUNAI' ? 'Refund Tunai' : 'Tukar Barang'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Transaksi: {retur.transaksiAsal.nomor} • {retur.transaksiAsal.pelanggan}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(retur.tanggal).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' • '}
                      {retur.user}
                    </p>
                  </div>
                </div>

                {/* Amount & Reason */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Alasan</p>
                    <p className="font-medium text-gray-700">{getAlasanLabel(retur.alasan)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Refund</p>
                    <p className="font-bold text-lg text-amber-600">
                      {formatRupiah(retur.totalRefund)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Item Retur ({retur.itemCount})
                </p>
                <div className="flex flex-wrap gap-2">
                  {retur.detail.map((item) => (
                    <span
                      key={item.id}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                    >
                      {item.namaBarang} × {item.jumlah} {item.satuan}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Retur Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Retur Baru</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedTransaction
                    ? `Transaksi: ${selectedTransaction.nomor}`
                    : 'Cari transaksi untuk diretur'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={createReturMutation.isPending}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {!selectedTransaction ? (
                <>
                  {/* Search Transaction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cari Transaksi
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Masukkan nomor transaksi..."
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Minimal 3 karakter</p>
                  </div>

                  {/* Search Results */}
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((trx) => (
                        <button
                          key={trx.id}
                          type="button"
                          onClick={() => trx.hasReturnableItems && handleSelectTransaction(trx)}
                          disabled={!trx.hasReturnableItems}
                          className={`w-full text-left p-4 border rounded-lg transition-colors ${
                            trx.hasReturnableItems
                              ? 'border-gray-200 hover:border-primary hover:bg-primary/5'
                              : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{trx.nomor}</span>
                                {!trx.hasReturnableItems && (
                                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                                    Sudah diretur semua
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {trx.pelanggan} •{' '}
                                {new Date(trx.tanggal).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatRupiah(trx.total)}</p>
                              <p className="text-xs text-gray-400">{trx.items.length} item</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 3 ? (
                    <div className="text-center py-8">
                      <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Transaksi tidak ditemukan</p>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Selected Transaction Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{selectedTransaction.nomor}</p>
                        <p className="text-sm text-gray-500">
                          {selectedTransaction.pelanggan} •{' '}
                          {new Date(selectedTransaction.tanggal).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTransaction(null)}
                        className="text-sm text-primary hover:underline"
                      >
                        Ganti
                      </button>
                    </div>
                  </div>

                  {/* Select Items */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Item Retur
                    </label>
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {selectedTransaction.items.map((item) => {
                        const isSelected = selectedItems.some(
                          (si) => si.detailTransaksiId === item.id
                        );
                        const selectedItem = selectedItems.find(
                          (si) => si.detailTransaksiId === item.id
                        );
                        const isDisabled = item.returnable <= 0;

                        return (
                          <div
                            key={item.id}
                            className={`p-3 ${isDisabled ? 'bg-gray-50 opacity-60' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleItem(item)}
                                disabled={isDisabled}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-primary border-primary text-white'
                                    : 'border-gray-300'
                                } ${isDisabled ? 'cursor-not-allowed' : ''}`}
                              >
                                {isSelected && <CheckCircle className="h-4 w-4" />}
                              </button>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.namaBarang}</p>
                                <p className="text-sm text-gray-500">
                                  {formatRupiah(item.hargaJual)} × {item.jumlah} {item.satuan}
                                  {item.alreadyReturned > 0 && (
                                    <span className="text-amber-600 ml-2">
                                      (sudah diretur: {item.alreadyReturned})
                                    </span>
                                  )}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemQty(
                                        item.id,
                                        (selectedItem?.jumlah || 1) - 1
                                      )
                                    }
                                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={selectedItem?.jumlah || 0}
                                    onChange={(e) =>
                                      handleUpdateItemQty(item.id, parseInt(e.target.value) || 1)
                                    }
                                    className="w-16 text-center py-1 border border-gray-300 rounded-lg text-sm"
                                    min={1}
                                    max={item.returnable}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItemQty(
                                        item.id,
                                        (selectedItem?.jumlah || 1) + 1
                                      )
                                    }
                                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alasan & Metode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alasan Retur
                      </label>
                      <select
                        value={alasan}
                        onChange={(e) => setAlasan(e.target.value as Alasan)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {ALASAN_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Metode Refund
                      </label>
                      <select
                        value={metodeRefund}
                        onChange={(e) => setMetodeRefund(e.target.value as MetodeRefund)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {METODE_REFUND_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Opsional"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Info Refund Tunai */}
                  {metodeRefund === 'TUNAI' && selectedItems.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Refund Tunai</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Saldo kas akan berkurang sebesar{' '}
                            <span className="font-bold">{formatRupiah(calculateTotalRefund())}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {selectedTransaction && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Refund</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatRupiah(calculateTotalRefund())}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseDialog}
                      disabled={createReturMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={createReturMutation.isPending || selectedItems.length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {createReturMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Simpan Retur
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

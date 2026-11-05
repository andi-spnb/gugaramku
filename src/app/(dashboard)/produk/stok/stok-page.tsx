'use client';

import { useState } from 'react';
import { Search, Filter, Package, Loader2, Plus, Minus, ClipboardList, AlertTriangle, PackageX } from 'lucide-react';
import { useStock, useCategories, useCreateAdjustment, useStockMutations } from '@/hooks/use-api';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import type { StockItem } from '@/lib/api';

type TabType = 'stock' | 'mutations';
type AdjustmentType = 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'OPNAME' | 'RUSAK' | 'EXPIRED';

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; icon: typeof Plus }[] = [
  { value: 'ADJUSTMENT_PLUS', label: 'Tambah Stok', icon: Plus },
  { value: 'ADJUSTMENT_MINUS', label: 'Kurang Stok', icon: Minus },
  { value: 'OPNAME', label: 'Stok Opname', icon: ClipboardList },
  { value: 'RUSAK', label: 'Barang Rusak', icon: PackageX },
  { value: 'EXPIRED', label: 'Kadaluarsa', icon: AlertTriangle },
];

export function StokPage() {
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'normal' | 'low' | 'empty' | ''>('');
  const [page, setPage] = useState(1);

  // Adjustment dialog
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('ADJUSTMENT_PLUS');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentNote, setAdjustmentNote] = useState('');

  // Fetch data
  const { data: kategoris } = useCategories();
  const { data: stockData, isLoading, isError } = useStock({
    search: search || undefined,
    kategoriId: kategoriFilter || undefined,
    status: statusFilter || undefined,
    page,
    limit: 50,
  });

  const { data: mutationsData, isLoading: isMutationsLoading } = useStockMutations({
    page: 1,
    limit: 100,
  });

  const adjustmentMutation = useCreateAdjustment();

  const handleOpenAdjustment = (item: StockItem, type: AdjustmentType = 'ADJUSTMENT_PLUS') => {
    setSelectedProduct(item);
    setAdjustmentType(type);
    setAdjustmentQty(type === 'OPNAME' ? item.jumlah : 0);
    setAdjustmentNote('');
    setIsAdjustmentOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct) return;

    if (adjustmentQty < 0) {
      toast.error('Jumlah tidak boleh negatif');
      return;
    }

    if (adjustmentType !== 'OPNAME' && adjustmentQty === 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    try {
      await adjustmentMutation.mutateAsync({
        produkId: selectedProduct.produkId,
        jumlah: adjustmentQty,
        tipe: adjustmentType,
        keterangan: adjustmentNote || undefined,
      });

      toast.success('Adjustment stok berhasil');
      setIsAdjustmentOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan adjustment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'empty':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Habis</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Menipis</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Normal</span>;
    }
  };

  const getMutationTypeBadge = (tipe: string) => {
    const colors: Record<string, string> = {
      MASUK: 'bg-green-100 text-green-700',
      KELUAR: 'bg-red-100 text-red-700',
      ADJUSTMENT_PLUS: 'bg-blue-100 text-blue-700',
      ADJUSTMENT_MINUS: 'bg-orange-100 text-orange-700',
      OPNAME: 'bg-purple-100 text-purple-700',
      RUSAK: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-amber-100 text-amber-700',
    };
    const labels: Record<string, string> = {
      MASUK: 'Masuk',
      KELUAR: 'Keluar',
      ADJUSTMENT_PLUS: 'Tambah',
      ADJUSTMENT_MINUS: 'Kurang',
      OPNAME: 'Opname',
      RUSAK: 'Rusak',
      EXPIRED: 'Expired',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[tipe] || 'bg-gray-100 text-gray-700'}`}>
        {labels[tipe] || tipe}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Stok</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola stok produk dan riwayat mutasi</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stock'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Daftar Stok
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mutations')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mutations'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Riwayat Mutasi
          </button>
        </nav>
      </div>

      {activeTab === 'stock' ? (
        <>
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
                  placeholder="Cari produk..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={kategoriFilter}
                  onChange={(e) => {
                    setKategoriFilter(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[160px]"
                >
                  <option value="">Semua Kategori</option>
                  {kategoris?.map((kat) => (
                    <option key={kat.id} value={kat.id}>{kat.nama}</option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setPage(1);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[140px]"
              >
                <option value="">Semua Status</option>
                <option value="normal">Normal</option>
                <option value="low">Menipis</option>
                <option value="empty">Habis</option>
              </select>
            </div>
          </div>

          {/* Stock Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : isError ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Gagal memuat data stok</p>
            </div>
          ) : !stockData?.items.length ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada data stok</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Minimum</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockData.items.map((item) => (
                      <tr key={item.produkId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.namaProduk}</p>
                            {item.barcode && (
                              <p className="text-xs text-gray-500 font-mono">{item.barcode}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.kategori || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900">{item.jumlah}</span>
                          <span className="text-sm text-gray-500 ml-1">{item.satuanDasar}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {item.stokMinimum} {item.satuanDasar}
                        </td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustment(item, 'ADJUSTMENT_PLUS')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Tambah Stok"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustment(item, 'ADJUSTMENT_MINUS')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Kurang Stok"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustment(item, 'OPNAME')}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Stok Opname"
                            >
                              <ClipboardList className="h-4 w-4" />
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
        </>
      ) : (
        /* Mutations Tab */
        <>
          {isMutationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : !mutationsData?.mutations.length ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada riwayat mutasi</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stok Akhir</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mutationsData.mutations.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(m.createdAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{m.namaProduk}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{getMutationTypeBadge(m.tipe)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${m.jumlah >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {m.jumlah >= 0 ? '+' : ''}{m.jumlah}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">{m.satuanDasar}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {m.jumlahSesudah} {m.satuanDasar}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                          {m.keterangan || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{m.namaUser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Adjustment Dialog */}
      {isAdjustmentOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !adjustmentMutation.isPending && setIsAdjustmentOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Adjustment Stok</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedProduct.namaProduk}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Current Stock */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Stok Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedProduct.jumlah} <span className="text-sm font-normal text-gray-500">{selectedProduct.satuanDasar}</span>
                </p>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Adjustment</label>
                <div className="grid grid-cols-2 gap-2">
                  {ADJUSTMENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setAdjustmentType(type.value);
                        if (type.value === 'OPNAME') {
                          setAdjustmentQty(selectedProduct.jumlah);
                        } else {
                          setAdjustmentQty(0);
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        adjustmentType === type.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {adjustmentType === 'OPNAME' ? 'Stok Aktual' : 'Jumlah'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                    min={0}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-sm text-gray-500">{selectedProduct.satuanDasar}</span>
                </div>
                {adjustmentType === 'OPNAME' && adjustmentQty !== selectedProduct.jumlah && (
                  <p className="text-sm text-amber-600 mt-1">
                    Selisih: {adjustmentQty - selectedProduct.jumlah > 0 ? '+' : ''}{adjustmentQty - selectedProduct.jumlah} {selectedProduct.satuanDasar}
                  </p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan <span className="text-gray-400">(opsional)</span>
                </label>
                <textarea
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="Alasan adjustment..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsAdjustmentOpen(false)}
                disabled={adjustmentMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitAdjustment}
                disabled={adjustmentMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {adjustmentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

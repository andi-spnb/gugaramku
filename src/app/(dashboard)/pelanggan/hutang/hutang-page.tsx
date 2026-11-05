'use client';

import { useState } from 'react';
import { Search, CreditCard, Loader2, CheckCircle, Clock, Banknote } from 'lucide-react';
import { useDebts, usePayDebt } from '@/hooks/use-api';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import type { Debt } from '@/lib/api';

export function HutangPage() {
  const [statusFilter, setStatusFilter] = useState<'BELUM_LUNAS' | 'LUNAS' | ''>('BELUM_LUNAS');
  const [page, setPage] = useState(1);

  // Payment dialog
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'QRIS' | 'TRANSFER'>('TUNAI');
  const [paymentNote, setPaymentNote] = useState('');

  // Fetch & mutations
  const { data, isLoading, isError } = useDebts({
    status: statusFilter || undefined,
    page,
    limit: 50,
  });

  const payMutation = usePayDebt();

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.sisa);
    setPaymentMethod('TUNAI');
    setPaymentNote('');
    setIsPaymentOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedDebt) return;

    if (paymentAmount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (paymentAmount > selectedDebt.sisa) {
      toast.error('Pembayaran melebihi sisa hutang');
      return;
    }

    try {
      await payMutation.mutateAsync({
        id: selectedDebt.id,
        jumlah: paymentAmount,
        metode: paymentMethod,
        catatan: paymentNote || undefined,
      });

      toast.success(paymentAmount === selectedDebt.sisa ? 'Hutang telah lunas!' : 'Pembayaran berhasil dicatat');
      setIsPaymentOpen(false);
      setSelectedDebt(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memproses pembayaran');
    }
  };

  const totalHutang = data?.debts
    .filter((d) => d.status === 'BELUM_LUNAS')
    .reduce((sum, d) => sum + d.sisa, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Hutang Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan catat pembayaran hutang</p>
      </div>

      {/* Summary */}
      {statusFilter === 'BELUM_LUNAS' && totalHutang > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
          <p className="text-amber-100 text-sm">Total Piutang Belum Lunas</p>
          <p className="text-3xl font-bold mt-1">{formatRupiah(totalHutang)}</p>
          <p className="text-amber-100 text-sm mt-2">{data?.debts.filter((d) => d.status === 'BELUM_LUNAS').length} transaksi</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[180px]"
          >
            <option value="">Semua Status</option>
            <option value="BELUM_LUNAS">Belum Lunas</option>
            <option value="LUNAS">Lunas</option>
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
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data hutang</p>
        </div>
      ) : !data?.debts.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {statusFilter === 'BELUM_LUNAS' ? 'Tidak ada hutang belum lunas' : 'Tidak ada data hutang'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.debts.map((debt) => (
            <div key={debt.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      debt.status === 'LUNAS' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {debt.status === 'LUNAS' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{debt.pelanggan.nama}</p>
                      <p className="text-sm text-gray-500">
                        {debt.transaksi.nomor} • {new Date(debt.transaksi.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Hutang</p>
                  <p className="font-semibold text-gray-900">{formatRupiah(debt.jumlah)}</p>
                </div>

                {/* Remaining */}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Sisa</p>
                  <p className={`font-bold text-lg ${debt.status === 'LUNAS' ? 'text-green-600' : 'text-amber-600'}`}>
                    {debt.status === 'LUNAS' ? 'LUNAS' : formatRupiah(debt.sisa)}
                  </p>
                </div>

                {/* Action */}
                {debt.status === 'BELUM_LUNAS' && (
                  <button
                    type="button"
                    onClick={() => handleOpenPayment(debt)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <Banknote className="h-4 w-4" />
                    Bayar
                  </button>
                )}
              </div>

              {/* Payment History */}
              {debt.pembayaran.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Riwayat Pembayaran</p>
                  <div className="space-y-2">
                    {debt.pembayaran.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.metode}</span>
                        </div>
                        <span className="font-medium text-green-600">+{formatRupiah(p.jumlah)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Dialog */}
      {isPaymentOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !payMutation.isPending && setIsPaymentOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bayar Hutang</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedDebt.pelanggan.nama}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Debt Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Total Hutang</span>
                  <span className="font-medium">{formatRupiah(selectedDebt.jumlah)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Sudah Dibayar</span>
                  <span className="font-medium text-green-600">{formatRupiah(selectedDebt.jumlah - selectedDebt.sisa)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Sisa Hutang</span>
                  <span className="font-bold text-amber-600">{formatRupiah(selectedDebt.sisa)}</span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={selectedDebt.sisa}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedDebt.sisa)}
                    className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                  >
                    Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(selectedDebt.sisa / 2))}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    50%
                  </button>
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TUNAI', 'QRIS', 'TRANSFER'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        paymentMethod === method
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                disabled={payMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={payMutation.isPending || paymentAmount <= 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Bayar {formatRupiah(paymentAmount)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

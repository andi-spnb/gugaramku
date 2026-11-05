'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  Percent,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import { useSalesReport } from '@/hooks/use-api';
import { formatRupiah } from '@/lib/utils';

type Periode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export function LabaPage() {
  const [periode, setPeriode] = useState<Periode>('bulanan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);

  const { data, isLoading, isError } = useSalesReport({
    periode: useCustomDate ? undefined : periode,
    startDate: useCustomDate ? startDate : undefined,
    endDate: useCustomDate ? endDate : undefined,
  });

  // Calculate margin percentage
  const marginPercentage = data?.summary?.totalPenjualan
    ? ((data.summary.totalLaba / data.summary.totalPenjualan) * 100).toFixed(1)
    : '0';

  // Calculate average profit per transaction
  const avgProfitPerTransaction = data?.summary?.totalTransaksi
    ? data.summary.totalLaba / data.summary.totalTransaksi
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Laporan Laba</h1>
        <p className="text-sm text-gray-500 mt-1">Analisis laba dan margin keuntungan</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Periode Buttons */}
          <div className="flex flex-wrap gap-2">
            {(['harian', 'mingguan', 'bulanan', 'tahunan'] as Periode[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriode(p);
                  setUseCustomDate(false);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  periode === p && !useCustomDate
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Custom Date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setUseCustomDate(true);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setUseCustomDate(true);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {data?.periode && (
          <p className="text-sm text-gray-500 mt-3">
            Periode:{' '}
            <span className="font-medium text-gray-700">
              {new Date(data.periode.start).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {' - '}
            <span className="font-medium text-gray-700">
              {new Date(data.periode.end).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat laporan laba</p>
        </div>
      ) : (
        <>
          {/* Main Profit Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Total Laba Bersih</p>
                <p className="text-4xl font-bold">{formatRupiah(data?.summary.totalLaba || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-green-100 text-xs">Penjualan</p>
                <p className="text-lg font-semibold">{formatRupiah(data?.summary.totalPenjualan || 0)}</p>
              </div>
              <div>
                <p className="text-green-100 text-xs">Margin</p>
                <p className="text-lg font-semibold">{marginPercentage}%</p>
              </div>
              <div>
                <p className="text-green-100 text-xs">Transaksi</p>
                <p className="text-lg font-semibold">{data?.summary.totalTransaksi || 0}</p>
              </div>
              <div>
                <p className="text-green-100 text-xs">Rata-rata Laba/Trx</p>
                <p className="text-lg font-semibold">{formatRupiah(avgProfitPerTransaction)}</p>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Total Penjualan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatRupiah(data?.summary.totalPenjualan || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {data?.summary.totalItem || 0} item terjual
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Total Diskon</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatRupiah(data?.summary.totalDiskon || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-2">Potongan yang diberikan</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Percent className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Margin Laba</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{marginPercentage}%</p>
              <p className="text-xs text-gray-400 mt-2">Persentase keuntungan</p>
            </div>
          </div>

          {/* Profit Chart */}
          {data?.chartData && data.chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Grafik Laba Harian</h2>
              <div className="space-y-3">
                {data.chartData.map((item) => {
                  const maxLaba = Math.max(...data.chartData.map((d) => d.laba));
                  const percentage = maxLaba > 0 ? (item.laba / maxLaba) * 100 : 0;
                  const isProfit = item.laba > 0;
                  return (
                    <div key={item.date} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-24">
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg transition-all duration-500 ${
                            isProfit
                              ? 'bg-gradient-to-r from-green-500 to-green-400'
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                      <div className="w-28 text-right">
                        <span
                          className={`text-sm font-medium ${
                            isProfit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isProfit ? '+' : ''}
                          {formatRupiah(item.laba)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Laba by Payment Method */}
          {data?.byPaymentMethod && data.byPaymentMethod.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Penjualan per Metode Pembayaran</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.byPaymentMethod.map((method) => {
                  const methodPercentage =
                    data.summary.totalPenjualan > 0
                      ? ((method.total / data.summary.totalPenjualan) * 100).toFixed(1)
                      : '0';
                  return (
                    <div key={method.method} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">{method.method}</p>
                        <span className="text-xs text-gray-400">{methodPercentage}%</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{formatRupiah(method.total)}</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${methodPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{method.count} transaksi</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Catatan:</strong> Laba dihitung berdasarkan selisih harga jual dan harga modal
              yang tercatat di setiap transaksi. Pastikan harga modal produk selalu ter-update untuk
              hasil yang akurat.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

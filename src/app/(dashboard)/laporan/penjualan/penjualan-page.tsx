'use client';

import { useState } from 'react';
import {
  Calendar,
  Filter,
  Loader2,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Download,
  BarChart3,
} from 'lucide-react';
import { useSalesReport } from '@/hooks/use-api';
import { formatRupiah } from '@/lib/utils';

type Periode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

export function PenjualanPage() {
  const [periode, setPeriode] = useState<Periode>('harian');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);

  const { data, isLoading, isError } = useSalesReport({
    periode: useCustomDate ? undefined : periode,
    startDate: useCustomDate ? startDate : undefined,
    endDate: useCustomDate ? endDate : undefined,
  });

  const handleClearFilters = () => {
    setPeriode('harian');
    setStartDate('');
    setEndDate('');
    setUseCustomDate(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Laporan Penjualan</h1>
          <p className="text-sm text-gray-500 mt-1">Detail transaksi dan ringkasan penjualan</p>
        </div>
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

          {/* Custom Date Range */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-[180px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setUseCustomDate(true);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setUseCustomDate(true);
              }}
              className="flex-1 max-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {(useCustomDate || startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>

        {/* Period Info */}
        {data?.periode && (
          <p className="text-sm text-gray-500 mt-3">
            Menampilkan data:{' '}
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
          <p className="text-gray-500">Gagal memuat laporan penjualan</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Total Penjualan</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(data?.summary.totalPenjualan || 0)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Total Laba</p>
              <p className="text-xl font-bold text-green-600">
                {formatRupiah(data?.summary.totalLaba || 0)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {data?.summary.totalTransaksi || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500">Rata-rata/Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {formatRupiah(data?.summary.rataRataPerTransaksi || 0)}
              </p>
            </div>
          </div>

          {/* Chart */}
          {data?.chartData && data.chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Grafik Penjualan</h2>
              <div className="space-y-3">
                {data.chartData.map((item) => {
                  const maxPenjualan = Math.max(...data.chartData.map((d) => d.penjualan));
                  const percentage = maxPenjualan > 0 ? (item.penjualan / maxPenjualan) * 100 : 0;
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
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
                          {item.transaksi} trx
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-28 text-right">
                        {formatRupiah(item.penjualan)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {data?.byPaymentMethod && data.byPaymentMethod.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Berdasarkan Metode Pembayaran</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.byPaymentMethod.map((method) => (
                  <div key={method.method} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">{method.method}</p>
                    <p className="text-lg font-bold text-gray-900">{formatRupiah(method.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">{method.count} transaksi</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Daftar Transaksi</h2>
              <span className="text-sm text-gray-500">{data?.transactions?.length || 0} transaksi</span>
            </div>

            {data?.transactions && data.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No. Transaksi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metode
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Laba
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.transactions.map((trx) => (
                      <tr key={trx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trx.nomor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trx.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trx.pelanggan}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {trx.metodeBayar}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {formatRupiah(trx.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                          {formatRupiah(trx.laba)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada transaksi pada periode ini</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Wallet,
  AlertTriangle,
  CreditCard,
  Loader2,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useDashboard, useSalesReport, useTopProducts } from '@/hooks/use-api';
import { formatRupiah } from '@/lib/utils';

export function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dashboard, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useDashboard();
  const { data: salesReport, isLoading: isLoadingSales, refetch: refetchSales } = useSalesReport({ periode: 'mingguan' });
  const { data: topProducts, isLoading: isLoadingProducts, refetch: refetchProducts } = useTopProducts({ periode: 'bulanan', limit: 5 });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchDashboard(), refetchSales(), refetchProducts()]);
    setIsRefreshing(false);
  };

  const isLoading = isLoadingDashboard || isLoadingSales || isLoadingProducts;

  // Format percentage change
  const formatChange = (value: number) => {
    const formatted = Math.abs(value).toFixed(1);
    if (value > 0) return `+${formatted}%`;
    if (value < 0) return `-${formatted}%`;
    return '0%';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan bisnis hari ini •{' '}
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Penjualan Hari Ini */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                {dashboard && (
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${
                      dashboard.changes.penjualan >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {dashboard.changes.penjualan >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatChange(dashboard.changes.penjualan)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-1">Penjualan Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(dashboard?.today.totalPenjualan || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {dashboard?.today.totalTransaksi || 0} transaksi
              </p>
            </div>

            {/* Laba Hari Ini */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                {dashboard && (
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-medium ${
                      dashboard.changes.laba >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {dashboard.changes.laba >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatChange(dashboard.changes.laba)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-1">Laba Hari Ini</p>
              <p className="text-2xl font-bold text-green-600">
                {formatRupiah(dashboard?.today.totalLaba || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {dashboard?.today.totalItem || 0} item terjual
              </p>
            </div>

            {/* Saldo Kas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Saldo Kas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(dashboard?.kas.saldo || 0)}
              </p>
              <Link
                href="/kas"
                className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
              >
                Kelola Kas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Total Piutang */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Piutang</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatRupiah(dashboard?.alerts.totalDebt || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {dashboard?.alerts.pendingDebts || 0} hutang belum lunas
              </p>
            </div>
          </div>

          {/* Alerts */}
          {dashboard && (dashboard.alerts.lowStock > 0 || dashboard.alerts.emptyStock > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Perhatian Stok</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    {dashboard.alerts.emptyStock > 0 && (
                      <span className="text-red-700">
                        {dashboard.alerts.emptyStock} produk stok habis
                      </span>
                    )}
                    {dashboard.alerts.lowStock > 0 && (
                      <span className="text-amber-700">
                        {dashboard.alerts.lowStock} produk stok menipis
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href="/produk/stok?status=low"
                  className="text-sm text-amber-700 font-medium hover:underline"
                >
                  Lihat
                </Link>
              </div>
            </div>
          )}

          {/* Charts & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart (Simple bar representation) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900">Penjualan 7 Hari Terakhir</h2>
                <Link
                  href="/laporan/penjualan"
                  className="text-sm text-primary hover:underline"
                >
                  Lihat Detail
                </Link>
              </div>
              {salesReport?.chartData && salesReport.chartData.length > 0 ? (
                <div className="space-y-3">
                  {salesReport.chartData.slice(-7).map((item) => {
                    const maxPenjualan = Math.max(...salesReport.chartData.map((d) => d.penjualan));
                    const percentage = maxPenjualan > 0 ? (item.penjualan / maxPenjualan) * 100 : 0;
                    return (
                      <div key={item.date} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-24 text-right">
                          {formatRupiah(item.penjualan)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <BarChart3 className="h-12 w-12 mb-2" />
                  <p className="text-sm">Belum ada data penjualan</p>
                </div>
              )}

              {/* Summary */}
              {salesReport?.summary && (
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Minggu Ini</p>
                    <p className="font-semibold text-gray-900">
                      {formatRupiah(salesReport.summary.totalPenjualan)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Laba</p>
                    <p className="font-semibold text-green-600">
                      {formatRupiah(salesReport.summary.totalLaba)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900">Produk Terlaris Bulan Ini</h2>
                <Link
                  href="/laporan/terlaris"
                  className="text-sm text-primary hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>
              {topProducts?.topProducts && topProducts.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.topProducts.map((product, index) => (
                    <div key={product.produkId} className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-600'
                            : index === 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.nama}</p>
                        <p className="text-xs text-gray-500">{product.kategori || 'Tanpa kategori'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {product.totalTerjual.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-gray-500">terjual</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Package className="h-12 w-12 mb-2" />
                  <p className="text-sm">Belum ada data produk</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods Summary */}
          {salesReport?.byPaymentMethod && salesReport.byPaymentMethod.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Metode Pembayaran Minggu Ini</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {salesReport.byPaymentMethod.map((method) => (
                  <div key={method.method} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">{method.method}</p>
                    <p className="font-semibold text-gray-900">{formatRupiah(method.total)}</p>
                    <p className="text-xs text-gray-400 mt-1">{method.count} transaksi</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

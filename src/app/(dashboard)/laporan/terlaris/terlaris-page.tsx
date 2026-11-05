'use client';

import { useState } from 'react';
import {
  Trophy,
  TrendingDown,
  Package,
  Loader2,
  Calendar,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { useTopProducts } from '@/hooks/use-api';
import { formatRupiah } from '@/lib/utils';

type Periode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
type Tab = 'terlaris' | 'slowMoving' | 'neverSold';

export function TerlarisPage() {
  const [periode, setPeriode] = useState<Periode>('bulanan');
  const [activeTab, setActiveTab] = useState<Tab>('terlaris');

  const { data, isLoading, isError } = useTopProducts({
    periode,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Produk Terlaris</h1>
        <p className="text-sm text-gray-500 mt-1">Analisis produk berdasarkan penjualan</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {(['harian', 'mingguan', 'bulanan', 'tahunan'] as Periode[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                periode === p
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('terlaris')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'terlaris'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Terlaris
              {data?.topProducts && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {data.topProducts.length}
                </span>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slowMoving')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'slowMoving'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Slow Moving
              {data?.slowProducts && (
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                  {data.slowProducts.length}
                </span>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('neverSold')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'neverSold'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tidak Terjual
              {data?.neverSold && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                  {data.neverSold.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data produk</p>
        </div>
      ) : (
        <>
          {/* Terlaris Tab */}
          {activeTab === 'terlaris' && (
            <div className="bg-white rounded-xl border border-gray-200">
              {data?.topProducts && data.topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Terjual
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pendapatan
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Laba
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.topProducts.map((product, index) => (
                        <tr key={product.produkId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                index === 0
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : index === 1
                                  ? 'bg-gray-200 text-gray-600'
                                  : index === 2
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-50 text-gray-500'
                              }`}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.nama}</p>
                              {product.barcode && (
                                <p className="text-xs text-gray-400">{product.barcode}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.kategori || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-bold text-gray-900">
                              {product.totalTerjual.toLocaleString('id-ID')}
                            </span>
                            <p className="text-xs text-gray-400">{product.transaksiCount} trx</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatRupiah(product.totalPendapatan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                            {formatRupiah(product.totalLaba)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada data penjualan pada periode ini</p>
                </div>
              )}
            </div>
          )}

          {/* Slow Moving Tab */}
          {activeTab === 'slowMoving' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
                <p className="text-sm text-amber-800">
                  Produk dengan penjualan rendah. Pertimbangkan untuk memberi promo atau diskon.
                </p>
              </div>
              {data?.slowProducts && data.slowProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Terjual
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pendapatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.slowProducts.map((product) => (
                        <tr key={product.produkId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.nama}</p>
                              {product.barcode && (
                                <p className="text-xs text-gray-400">{product.barcode}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.kategori || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-medium text-amber-600">
                              {product.totalTerjual.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatRupiah(product.totalPendapatan)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada produk slow moving</p>
                </div>
              )}
            </div>
          )}

          {/* Never Sold Tab */}
          {activeTab === 'neverSold' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                <p className="text-sm text-red-800">
                  Produk yang tidak terjual sama sekali pada periode ini.
                </p>
              </div>
              {data?.neverSold && data.neverSold.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok Tersedia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.neverSold.map((product) => (
                        <tr key={product.produkId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.nama}</p>
                              {product.barcode && (
                                <p className="text-xs text-gray-400">{product.barcode}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.kategori || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span
                              className={`font-medium ${
                                product.stok > 0 ? 'text-gray-900' : 'text-red-600'
                              }`}
                            >
                              {product.stok.toLocaleString('id-ID')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Semua produk sudah pernah terjual</p>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            Total {data?.totalProducts || 0} produk tercatat penjualannya pada periode ini.
          </div>
        </>
      )}
    </div>
  );
}

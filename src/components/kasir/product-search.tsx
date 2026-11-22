'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Camera, Loader2, Package, Plus, WifiOff } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import { getPriceByLevel } from '@/lib/constants/price-levels';
import { useProductSearch } from '@/hooks/use-api';
import type { ProdukWithDetails, ProdukSatuan } from '@/types';

interface ProductSearchProps {
  onSelectProduct: (produk: ProdukWithDetails, satuan: ProdukSatuan, jumlah?: number) => void;
  /** Dipanggil saat produk diklik: buka dialog pilih satuan (opsional, default langsung tambah) */
  onOpenProduct?: (produk: ProdukWithDetails) => void;
  onQuickSale: () => void;
  tingkatHarga: number;
  onCameraScan?: () => void;
  /** Cabang aktif untuk menghitung stok yang ditampilkan */
  cabangId?: string;
  /** Jumlah yang sudah ada di keranjang untuk cek batas stok */
  getStockInfo?: (produk: ProdukWithDetails) => { total: number; inCart: number };
}

export function ProductSearch({
  onSelectProduct,
  onOpenProduct,
  onQuickSale,
  tingkatHarga,
  onCameraScan,
  cabangId,
  getStockInfo,
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: apiProducts, isLoading, isError, isFetched, dataUpdatedAt } = useProductSearch(debouncedSearch, {
    enabled: true,
  });

  const products = useMemo(() => {
    if (isFetched && !isError && apiProducts) return apiProducts;
    if (isLoading) return [];
    return apiProducts || [];
  }, [apiProducts, isError, isLoading, isFetched]);

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectProduct = (produk: ProdukWithDetails) => {
    const defaultSatuan = produk.produkSatuan?.find((s) => s.isDefault) || produk.produkSatuan?.[0];
    if (!defaultSatuan) return;
    // Klik: tampilkan dulu pilihan satuan, jumlah, dan stok
    if (onOpenProduct) {
      onOpenProduct(produk);
      return;
    }
    onSelectProduct(produk, defaultSatuan, 1);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Search Input */}
      <div className="shrink-0 border-b border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                // Enter pada hasil pencarian: tambahkan produk pertama (perilaku scan).
                // Hanya saat ada kata kunci/scan, bukan saat menampilkan daftar awal.
                if (e.key === 'Enter' && products.length > 0 && debouncedSearch.trim()) {
                  e.preventDefault();
                  const first = products[0];
                  const anyStock = getStockInfo ? getStockInfo(first).total : 1;
                  if (anyStock > 0) {
                    // Enter/scan: langsung tambah satuan default tanpa dialog
                    const def =
                      first.produkSatuan?.find((s) => s.isDefault) || first.produkSatuan?.[0];
                    if (def) onSelectProduct(first, def, 1);
                  }
                }
              }}
              placeholder="Cari nama produk atau scan barcode..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={onCameraScan}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-200"
            title="Scan barcode via kamera"
          >
            <Camera className="h-5 w-5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button
            type="button"
            onClick={onQuickSale}
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-primary transition-colors hover:bg-primary/20"
            title="Quick Sale - Jual barang tidak terdaftar"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Quick Sale</span>
          </button>
        </div>
      </div>

      {isError && (
        <div className="mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <WifiOff className="h-4 w-4" />
          <span>Gagal memuat produk. Periksa koneksi lalu muat ulang.</span>
        </div>
      )}

      {/* Product List (baris kompak, tanpa gambar) */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" data-refresh={dataUpdatedAt}>
        {isLoading ? (
          <div className="divide-y divide-gray-100" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-14" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-500">Produk tidak ditemukan</p>
            <p className="mt-1 text-sm text-gray-400">
              Coba kata kunci lain, scan barcode, atau tambah produk baru
            </p>
          </div>
        ) : (
          <>
            {/* Header kolom list */}
            <div className="sticky top-0 z-10 hidden items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:flex">
              <span className="min-w-0 flex-1">Produk</span>
              <span className="w-28 text-right">Harga</span>
              <span className="w-20 text-right">Stok</span>
              <span className="w-8" />
            </div>
            <ul className="divide-y divide-gray-100">
              {products.map((produk) => {
                const defaultSatuan =
                  produk.produkSatuan?.find((s) => s.isDefault) || produk.produkSatuan?.[0];
                const harga = defaultSatuan ? getPriceByLevel(defaultSatuan, tingkatHarga) : 0;
                const satuanNama = defaultSatuan?.namaSatuan || produk.satuanDasar;

                const stockRow = cabangId
                  ? produk.stok?.find((s) => s.cabangId === cabangId)
                  : produk.stok?.[0];
                const stokTotal = stockRow ? Number(stockRow.jumlah) : undefined;
                const konversi = defaultSatuan ? Number(defaultSatuan.konversi) || 1 : 1;
                const stokSatuan =
                  stokTotal === undefined ? undefined : Math.floor(stokTotal / konversi);
                const inCart = getStockInfo ? getStockInfo(produk).inCart : 0;
                const remaining = stokSatuan === undefined ? undefined : stokSatuan - inCart;
                const isOut = remaining !== undefined && remaining <= 0;
                const isLow = remaining !== undefined && !isOut && remaining <= 5;

                return (
                  <li key={produk.id}>
                    <button
                      type="button"
                      onClick={() => !isOut && handleSelectProduct(produk)}
                      disabled={isOut}
                      title={isOut ? 'Stok habis' : `Tambah ${produk.nama}`}
                      className={cn(
                        'group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isOut
                          ? 'cursor-not-allowed bg-gray-50 opacity-60'
                          : 'hover:bg-primary/5 active:bg-primary/10'
                      )}
                    >
                      {/* Nama + barcode + info satuan */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-semibold',
                            isOut ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary'
                          )}
                        >
                          {produk.nama}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {produk.barcode ? (
                            <span className="font-mono">{produk.barcode}</span>
                          ) : (
                            <span>Tanpa barcode</span>
                          )}
                          {produk.produkSatuan && produk.produkSatuan.length > 1 && (
                            <span> · +{produk.produkSatuan.length - 1} satuan</span>
                          )}
                        </p>
                      </div>

                      {/* Harga */}
                      <div className="w-28 shrink-0 text-right">
                        <p
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            isOut ? 'text-gray-500' : 'text-primary'
                          )}
                        >
                          {formatRupiah(harga)}
                        </p>
                        <p className="text-[11px] text-gray-400">per {satuanNama}</p>
                      </div>

                      {/* Stok */}
                      <div className="w-20 shrink-0 text-right">
                        {stokSatuan === undefined ? (
                          <span className="text-xs text-gray-300">-</span>
                        ) : (
                          <span
                            className={cn(
                              'inline-block rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                              isOut
                                ? 'bg-red-50 text-red-600'
                                : isLow
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-green-50 text-green-700'
                            )}
                          >
                            {isOut ? 'Habis' : stokSatuan}
                          </span>
                        )}
                      </div>

                      {/* Tombol tambah */}
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                          isOut
                            ? 'border-gray-200 text-gray-300'
                            : 'border-primary/30 text-primary group-hover:bg-primary group-hover:text-white'
                        )}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

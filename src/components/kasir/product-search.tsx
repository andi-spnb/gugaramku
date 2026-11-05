'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Camera, Loader2, Package, Plus, WifiOff } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { getPriceByLevel } from '@/lib/constants/price-levels';
import { useProductSearch } from '@/hooks/use-api';
import type { ProdukWithDetails, ProdukSatuan } from '@/types';

// Data dummy produk untuk fallback ketika offline atau API belum tersedia
const DUMMY_PRODUCTS: ProdukWithDetails[] = [
  {
    id: '1',
    barcode: '8991234567890',
    nama: 'Indomie Goreng',
    kategoriId: '1',
    hargaModal: 2800,
    satuanDasar: 'bks',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    produkSatuan: [
      { id: '1a', produkId: '1', namaSatuan: 'bks', konversi: 1, harga1: 3500, harga2: 3300, harga3: 3200, harga4: 3100, isDefault: true, urutan: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: '1b', produkId: '1', namaSatuan: 'dos', konversi: 40, harga1: 135000, harga2: 130000, harga3: 125000, harga4: 120000, isDefault: false, urutan: 2, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: '2',
    barcode: '8992345678901',
    nama: 'Gula Pasir 1kg',
    kategoriId: '2',
    hargaModal: 12000,
    satuanDasar: 'pcs',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    produkSatuan: [
      { id: '2a', produkId: '2', namaSatuan: 'pcs', konversi: 1, harga1: 15000, harga2: 14000, harga3: 13500, harga4: 13000, isDefault: true, urutan: 1, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: '3',
    barcode: '8993456789012',
    nama: 'Kopi ABC Sachet',
    kategoriId: '3',
    hargaModal: 1000,
    satuanDasar: 'sct',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    produkSatuan: [
      { id: '3a', produkId: '3', namaSatuan: 'sct', konversi: 1, harga1: 1500, harga2: 1400, harga3: 1300, harga4: 1200, isDefault: true, urutan: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: '3b', produkId: '3', namaSatuan: 'rncg', konversi: 10, harga1: 14000, harga2: 13000, harga3: 12500, harga4: 12000, isDefault: false, urutan: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: '3c', produkId: '3', namaSatuan: 'dos', konversi: 120, harga1: 160000, harga2: 150000, harga3: 145000, harga4: 140000, isDefault: false, urutan: 3, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: '4',
    barcode: '8994567890123',
    nama: 'Sampoerna Mild',
    kategoriId: '4',
    hargaModal: 25000,
    satuanDasar: 'bks',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    produkSatuan: [
      { id: '4a', produkId: '4', namaSatuan: 'bks', konversi: 1, harga1: 28000, harga2: 27500, harga3: 27000, harga4: 26500, isDefault: true, urutan: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: '4b', produkId: '4', namaSatuan: 'slp', konversi: 10, harga1: 275000, harga2: 270000, harga3: 265000, harga4: 260000, isDefault: false, urutan: 2, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    id: '5',
    barcode: '8995678901234',
    nama: 'Chitato Original',
    kategoriId: '5',
    hargaModal: 1500,
    satuanDasar: 'bks',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    produkSatuan: [
      { id: '5a', produkId: '5', namaSatuan: 'bks', konversi: 1, harga1: 2000, harga2: 1800, harga3: 1700, harga4: 1600, isDefault: true, urutan: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: '5b', produkId: '5', namaSatuan: 'gtg', konversi: 10, harga1: 18000, harga2: 17000, harga3: 16000, harga4: 15000, isDefault: false, urutan: 2, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
];

interface ProductSearchProps {
  onSelectProduct: (produk: ProdukWithDetails, satuan: ProdukSatuan, jumlah?: number) => void;
  onQuickSale: () => void;
  tingkatHarga: number;
}

export function ProductSearch({ onSelectProduct, onQuickSale, tingkatHarga }: ProductSearchProps) {
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

  // Use API hook for product search
  const { data: apiProducts, isLoading, isError, isFetched } = useProductSearch(debouncedSearch, {
    enabled: true,
  });

  // Use API data or fallback to dummy data
  const products = useMemo(() => {
    // Jika sudah fetch dan berhasil, gunakan data API
    if (isFetched && !isError && apiProducts) {
      return apiProducts;
    }
    
    // Jika error atau belum fetch, fallback ke dummy
    if (isError) {
      if (!debouncedSearch.trim()) return DUMMY_PRODUCTS;
      const lowercaseTerm = debouncedSearch.toLowerCase();
      return DUMMY_PRODUCTS.filter(
        (p) =>
          p.nama.toLowerCase().includes(lowercaseTerm) ||
          p.barcode?.toLowerCase().includes(lowercaseTerm)
      );
    }
    
    // Saat loading, tampilkan data kosong (biar loading spinner muncul)
    if (isLoading) {
      return [];
    }
    
    // Default: gunakan API data jika ada, atau dummy
    return apiProducts || DUMMY_PRODUCTS;
  }, [apiProducts, isError, isLoading, isFetched, debouncedSearch]);

  // Focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 to focus search
      if (e.key === 'F2') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectProduct = (produk: ProdukWithDetails) => {
    // Get default unit
    const defaultSatuan = produk.produkSatuan?.find((s) => s.isDefault) || produk.produkSatuan?.[0];
    if (defaultSatuan) {
      onSelectProduct(produk, defaultSatuan, 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Search Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk atau scan barcode... (F2)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Camera className="h-5 w-5" />
            <span className="hidden sm:inline">Scan</span>
          </button>
          <button
            type="button"
            onClick={onQuickSale}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            title="Quick Sale - Jual barang tidak terdaftar"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Quick Sale</span>
          </button>
        </div>
      </div>

      {/* Offline indicator */}
      {isError && (
        <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-700">
          <WifiOff className="h-4 w-4" />
          <span>Mode offline - menampilkan data lokal</span>
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Produk tidak ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">
              Coba kata kunci lain atau tambah produk baru
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((produk) => {
              const defaultSatuan = produk.produkSatuan?.find((s) => s.isDefault) || produk.produkSatuan?.[0];
              const harga = defaultSatuan ? getPriceByLevel(defaultSatuan, tingkatHarga) : 0;

              return (
                <button
                  key={produk.id}
                  type="button"
                  onClick={() => handleSelectProduct(produk)}
                  className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary hover:shadow-sm transition-all text-left group"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-full aspect-square bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* Product Name */}
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary">
                    {produk.nama}
                  </h4>

                  {/* Price */}
                  <p className="text-sm font-semibold text-primary mt-1 tabular-nums">
                    {formatRupiah(harga)}
                  </p>

                  {/* Unit */}
                  <p className="text-xs text-gray-500 mt-0.5">
                    per {defaultSatuan?.namaSatuan || produk.satuanDasar}
                  </p>

                  {/* Multiple units indicator */}
                  {produk.produkSatuan && produk.produkSatuan.length > 1 && (
                    <p className="text-xs text-gray-400 mt-1">
                      +{produk.produkSatuan.length - 1} satuan lain
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

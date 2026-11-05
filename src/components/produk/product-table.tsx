'use client';

import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatRupiah } from '@/lib/utils';
import type { ProdukWithDetails } from '@/types';

interface ProductTableProps {
  products: ProdukWithDetails[];
  onEdit: (product: ProdukWithDetails) => void;
  onDelete: (product: ProdukWithDetails) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga Modal
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                H1 (Eceran)
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: ProdukWithDetails;
  onEdit: (product: ProdukWithDetails) => void;
  onDelete: (product: ProdukWithDetails) => void;
}

function ProductRow({ product, onEdit, onDelete }: ProductRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const defaultSatuan = product.produkSatuan?.find((s) => s.isDefault) || product.produkSatuan?.[0];
  const totalStok = product.stok?.reduce((sum, s) => sum + s.jumlah, 0) || 0;

  return (
    <tr className={`hover:bg-gray-50 ${!product.isActive ? 'opacity-60' : ''}`}>
      {/* Product Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-500">
              {product.nama.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{product.nama}</p>
            {product.barcode && (
              <p className="text-xs text-gray-500 font-mono">{product.barcode}</p>
            )}
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">
          {product.kategori?.nama || '-'}
        </span>
      </td>

      {/* Units */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {product.produkSatuan?.map((satuan) => (
            <span
              key={satuan.id}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                satuan.isDefault
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {satuan.namaSatuan.toUpperCase()}
              {satuan.konversi > 1 && (
                <span className="ml-1 text-gray-400">({satuan.konversi})</span>
              )}
            </span>
          ))}
        </div>
      </td>

      {/* Modal Price */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-gray-600 tabular-nums">
          {formatRupiah(product.hargaModal)}
        </span>
      </td>

      {/* Sell Price (H1) */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-gray-900 tabular-nums">
          {defaultSatuan ? formatRupiah(defaultSatuan.harga1) : '-'}
        </span>
        {defaultSatuan && (
          <span className="text-xs text-gray-500 ml-1">
            /{defaultSatuan.namaSatuan}
          </span>
        )}
      </td>

      {/* Stock */}
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            totalStok <= 0
              ? 'bg-red-100 text-red-700'
              : totalStok <= 10
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {totalStok} {product.satuanDasar}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        {product.isActive ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <Eye className="h-3.5 w-3.5" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <EyeOff className="h-3.5 w-3.5" />
            Nonaktif
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                type="button"
                onClick={() => {
                  onEdit(product);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(product);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

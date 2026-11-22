'use client';

import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, ChevronDown, Check, Tag, AlertTriangle } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import type { CartItem, CartItemUnit } from '@/types';

export interface PriceLevelOption {
  tingkat: number;
  nama: string;
  warna: string;
}

interface CartProps {
  items: CartItem[];
  tingkatHarga: number;
  priceLevels: PriceLevelOption[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeUnit: (itemId: string, newUnit: CartItemUnit) => void;
  onEditDiscount: (item: CartItem) => void;
  /** Ganti tingkat harga untuk SATU item saja */
  onChangeItemPriceLevel: (itemId: string, tingkat: number) => void;
  /** Batas stok dalam satuan item (qty dasar / konversi). undefined = tanpa batas (quick sale). */
  getMaxQty?: (item: CartItem) => number | undefined;
}

export function Cart({
  items,
  tingkatHarga,
  priceLevels,
  onUpdateQuantity,
  onRemoveItem,
  onChangeUnit,
  onEditDiscount,
  onChangeItemPriceLevel,
  getMaxQty,
}: CartProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <ShoppingCart className="h-10 w-10 text-gray-300" />
        </div>
        <p className="text-base font-semibold text-gray-600">Keranjang masih kosong</p>
        <p className="mt-1 max-w-[16rem] text-center text-sm text-gray-400">
          Scan barcode, klik produk, atau gunakan Quick Sale untuk memulai transaksi
        </p>
      </div>
    );
  }

  const totalQty = items.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-2 text-xs text-gray-500 backdrop-blur">
        <span className="font-medium">Daftar belanja</span>
        <span className="tabular-nums">
          {items.length} jenis · {totalQty} qty
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <CartItemRow
            key={item.id}
            item={item}
            index={index + 1}
            tingkatHarga={tingkatHarga}
            priceLevels={priceLevels}
            maxQty={getMaxQty?.(item)}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onChangeUnit={onChangeUnit}
            onEditDiscount={onEditDiscount}
            onChangeItemPriceLevel={onChangeItemPriceLevel}
          />
        ))}
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  index: number;
  tingkatHarga: number;
  priceLevels: PriceLevelOption[];
  maxQty?: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeUnit: (itemId: string, newUnit: CartItemUnit) => void;
  onEditDiscount: (item: CartItem) => void;
  onChangeItemPriceLevel: (itemId: string, tingkat: number) => void;
}

function CartItemRow({
  item,
  index,
  tingkatHarga,
  priceLevels,
  maxQty,
  onUpdateQuantity,
  onRemoveItem,
  onChangeUnit,
  onEditDiscount,
  onChangeItemPriceLevel,
}: CartItemRowProps) {
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [qtyDraft, setQtyDraft] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const levelDropdownRef = useRef<HTMLDivElement>(null);

  // Tingkat harga item ini: pakai milik item jika sudah di-set, fallback ke global
  const itemTingkat = item.tingkatHarga ?? tingkatHarga;
  const itemLevel = priceLevels.find((l) => l.tingkat === itemTingkat);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setIsLevelDropdownOpen(false);
      }
    }

    if (isUnitDropdownOpen || isLevelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUnitDropdownOpen, isLevelDropdownOpen]);

  const getPriceForUnit = (unit: CartItemUnit, tingkat: number): number => {
    switch (tingkat) {
      case 1: return unit.harga1;
      case 2: return unit.harga2;
      case 3: return unit.harga3;
      case 4: return unit.harga4;
      default: return unit.harga1;
    }
  };

  const hasMultipleUnits = item.availableUnits && item.availableUnits.length > 1;
  const subtotalBeforeDiscount = item.hargaJual * item.jumlah;

  // Status stok: berapa lagi yang masih bisa ditambahkan dalam satuan item ini
  const remainingQty = maxQty === undefined ? undefined : maxQty - item.jumlah;
  const isOutOfStock = maxQty !== undefined && maxQty <= 0;
  const isLowStock = maxQty !== undefined && !isOutOfStock && maxQty < 5;
  const isOverStock = remainingQty !== undefined && remainingQty < 0;

  const handleSelectUnit = (unit: CartItemUnit) => {
    if (unit.id !== item.produkSatuanId) {
      onChangeUnit(item.id, unit);
    }
    setIsUnitDropdownOpen(false);
  };

  // Ketik jumlah: pakai draft supaya user bisa menghapus dulu sebelum mengetik angka baru
  const commitDraft = () => {
    if (qtyDraft === null) return;
    const value = parseInt(qtyDraft, 10);
    setQtyDraft(null);
    if (!isNaN(value) && value >= 0 && value !== item.jumlah) {
      onUpdateQuantity(item.id, value);
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-2 transition-colors',
        isOverStock ? 'bg-red-50/70 hover:bg-red-50' : 'hover:bg-gray-50'
      )}
    >
      {/* Item Header */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-200 text-xs font-semibold text-gray-600 tabular-nums">
              {index}
            </span>
            <h4 className="truncate text-[15px] font-semibold text-gray-900">{item.nama}</h4>
          </div>
          {item.barcode && (
            <p className="ml-8 mt-0.5 font-mono text-xs text-gray-400">{item.barcode}</p>
          )}
          {maxQty !== undefined && (
            <p
              className={cn(
                'ml-8 mt-0.5 flex items-center gap-1 text-xs',
                isOverStock
                  ? 'font-semibold text-red-600'
                  : isLowStock
                    ? 'text-amber-600'
                    : 'text-gray-400'
              )}
            >
              {(isLowStock || isOverStock) && <AlertTriangle className="h-3 w-3" />}
              {isOverStock
                ? `Stok kurang ${Math.abs(remainingQty ?? 0)} ${item.satuan} (sisa ${maxQty})`
                : `Stok tersedia ${maxQty} ${item.satuan}`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEditDiscount(item)}
            className={cn(
              'rounded p-1.5 transition-colors',
              item.diskon > 0
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'text-gray-400 hover:bg-primary/10 hover:text-primary'
            )}
            title="Tambah/Edit Diskon"
            aria-label={`Diskon ${item.nama}`}
          >
            <Tag className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Hapus item"
            aria-label={`Hapus ${item.nama}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Unit & Quantity */}
      <div className="ml-8 flex items-center gap-2">
        {/* Unit Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors',
              hasMultipleUnits ? 'cursor-pointer bg-gray-100 hover:bg-gray-200' : 'cursor-default bg-gray-100'
            )}
            onClick={() => hasMultipleUnits && setIsUnitDropdownOpen(!isUnitDropdownOpen)}
            disabled={!hasMultipleUnits}
          >
            <span className="uppercase">{item.satuan}</span>
            {hasMultipleUnits && (
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', isUnitDropdownOpen && 'rotate-180')}
              />
            )}
          </button>

          {isUnitDropdownOpen && hasMultipleUnits && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 animate-fade-in rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-3 py-1.5">
                <p className="text-xs font-medium text-gray-500">Pilih Satuan</p>
              </div>
              {item.availableUnits.map((unit) => {
                const isSelected = unit.id === item.produkSatuanId;
                const unitPrice = getPriceForUnit(unit, itemTingkat);

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => handleSelectUnit(unit)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-medium uppercase',
                          isSelected ? 'text-primary' : 'text-gray-900'
                        )}
                      >
                        {unit.namaSatuan}
                      </span>
                      {unit.konversi > 1 && (
                        <span className="text-xs text-gray-400">({unit.konversi} pcs)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'tabular-nums',
                          isSelected ? 'font-medium text-primary' : 'text-gray-600'
                        )}
                      >
                        {formatRupiah(unitPrice)}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Level Selector (per item) */}
        <div className="relative" ref={levelDropdownRef}>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            style={
              itemLevel
                ? { backgroundColor: `${itemLevel.warna}1a`, color: itemLevel.warna }
                : undefined
            }
            onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
            title="Ganti tingkat harga item ini"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: itemLevel?.warna || '#9ca3af' }}
            />
            {itemLevel?.nama || `Level ${itemTingkat}`}
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', isLevelDropdownOpen && 'rotate-180')}
            />
          </button>

          {isLevelDropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-48 animate-fade-in rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-3 py-1.5">
                <p className="text-xs font-medium text-gray-500">Tingkat Harga Item Ini</p>
              </div>
              {priceLevels.map((level) => {
                const isSelected = level.tingkat === itemTingkat;
                // Harga level ini untuk satuan item saat ini
                const currentUnit = item.availableUnits?.find((u) => u.id === item.produkSatuanId);
                const levelPrice = currentUnit
                  ? getPriceForUnit(currentUnit, level.tingkat)
                  : item.hargaJual;
                return (
                  <button
                    key={level.tingkat}
                    type="button"
                    onClick={() => {
                      onChangeItemPriceLevel(item.id, level.tingkat);
                      setIsLevelDropdownOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: level.warna }}
                      />
                      <span
                        className={cn(
                          'font-medium',
                          isSelected ? 'text-primary' : 'text-gray-900'
                        )}
                      >
                        {level.nama}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatRupiah(levelPrice)}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quantity Controls (besar untuk touch screen kasir) */}
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.jumlah - 1)}
            className="p-2 text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200"
            aria-label="Kurangi jumlah"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={qtyDraft ?? String(item.jumlah)}
            onChange={(e) => setQtyDraft(e.target.value.replace(/\D/g, ''))}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setQtyDraft(null);
                e.currentTarget.blur();
              }
            }}
            className="w-12 border-x border-gray-200 py-1.5 text-center text-base font-bold text-gray-900 tabular-nums focus:bg-primary/5 focus:outline-none"
            aria-label={`Jumlah ${item.nama}`}
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.jumlah + 1)}
            disabled={remainingQty !== undefined && remainingQty <= 0}
            className="p-2 text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Tambah jumlah"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Price */}
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs text-gray-500 tabular-nums">@{formatRupiah(item.hargaJual)}</p>
          <p className="text-base font-bold text-gray-900 tabular-nums">{formatRupiah(item.subtotal)}</p>
        </div>
      </div>

      {/* Discount (if any) */}
      {item.diskon > 0 && (
        <div className="ml-8 mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onEditDiscount(item)}
            className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600 transition-colors hover:bg-green-100"
          >
            Diskon: -{formatRupiah(item.diskon)}
          </button>
          <span className="text-xs text-gray-400 tabular-nums line-through">
            {formatRupiah(subtotalBeforeDiscount)}
          </span>
        </div>
      )}
    </div>
  );
}

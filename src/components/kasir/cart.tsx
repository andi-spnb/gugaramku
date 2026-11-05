'use client';

import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, ChevronDown, Check, Tag } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import type { CartItem, CartItemUnit } from '@/types';

interface CartProps {
  items: CartItem[];
  tingkatHarga: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeUnit: (itemId: string, newUnit: CartItemUnit) => void;
  onEditDiscount: (item: CartItem) => void;
}

export function Cart({
  items,
  tingkatHarga,
  onUpdateQuantity,
  onRemoveItem,
  onChangeUnit,
  onEditDiscount,
}: CartProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Keranjang masih kosong</p>
        <p className="text-sm text-gray-400 mt-1 text-center">
          Scan barcode atau cari produk untuk memulai transaksi
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item, index) => (
        <CartItemRow
          key={item.id}
          item={item}
          index={index + 1}
          tingkatHarga={tingkatHarga}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onChangeUnit={onChangeUnit}
          onEditDiscount={onEditDiscount}
        />
      ))}
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  index: number;
  tingkatHarga: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeUnit: (itemId: string, newUnit: CartItemUnit) => void;
  onEditDiscount: (item: CartItem) => void;
}

function CartItemRow({
  item,
  index,
  tingkatHarga,
  onUpdateQuantity,
  onRemoveItem,
  onChangeUnit,
  onEditDiscount,
}: CartItemRowProps) {
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    }

    if (isUnitDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUnitDropdownOpen]);

  // Get price based on current tingkat harga
  const getPriceForUnit = (unit: CartItemUnit): number => {
    switch (tingkatHarga) {
      case 1: return unit.harga1;
      case 2: return unit.harga2;
      case 3: return unit.harga3;
      case 4: return unit.harga4;
      default: return unit.harga1;
    }
  };

  const hasMultipleUnits = item.availableUnits && item.availableUnits.length > 1;
  const subtotalBeforeDiscount = item.hargaJual * item.jumlah;

  const handleSelectUnit = (unit: CartItemUnit) => {
    if (unit.id !== item.produkSatuanId) {
      onChangeUnit(item.id, unit);
    }
    setIsUnitDropdownOpen(false);
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      {/* Item Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center">
              {index}
            </span>
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {item.nama}
            </h4>
          </div>
          {item.barcode && (
            <p className="text-xs text-gray-400 mt-0.5 ml-7">{item.barcode}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEditDiscount(item)}
            className={cn(
              'p-1.5 rounded transition-colors',
              item.diskon > 0
                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                : 'text-gray-400 hover:text-primary hover:bg-primary/10'
            )}
            title="Tambah/Edit Diskon"
          >
            <Tag className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Hapus item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Unit & Quantity */}
      <div className="flex items-center gap-3 ml-7">
        {/* Unit Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-sm text-gray-700 bg-gray-100 rounded transition-colors',
              hasMultipleUnits 
                ? 'hover:bg-gray-200 cursor-pointer' 
                : 'cursor-default'
            )}
            onClick={() => hasMultipleUnits && setIsUnitDropdownOpen(!isUnitDropdownOpen)}
            disabled={!hasMultipleUnits}
          >
            <span className="font-medium uppercase">{item.satuan}</span>
            {hasMultipleUnits && (
              <ChevronDown className={cn(
                'h-3.5 w-3.5 transition-transform',
                isUnitDropdownOpen && 'rotate-180'
              )} />
            )}
          </button>

          {/* Unit Dropdown */}
          {isUnitDropdownOpen && hasMultipleUnits && (
            <div className="absolute top-full left-0 mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500">Pilih Satuan</p>
              </div>
              {item.availableUnits.map((unit) => {
                const isSelected = unit.id === item.produkSatuanId;
                const unitPrice = getPriceForUnit(unit);
                
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => handleSelectUnit(unit)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium uppercase',
                        isSelected ? 'text-primary' : 'text-gray-900'
                      )}>
                        {unit.namaSatuan}
                      </span>
                      {unit.konversi > 1 && (
                        <span className="text-xs text-gray-400">
                          ({unit.konversi} pcs)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'tabular-nums',
                        isSelected ? 'text-primary font-medium' : 'text-gray-600'
                      )}>
                        {formatRupiah(unitPrice)}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.jumlah - 1)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={item.jumlah}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 0) {
                onUpdateQuantity(item.id, value);
              }
            }}
            className="w-12 text-center text-sm font-medium border-x border-gray-200 py-1.5 focus:outline-none tabular-nums"
            min={0}
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.jumlah + 1)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Price */}
        <div className="flex-1 text-right">
          <p className="text-xs text-gray-500">
            @{formatRupiah(item.hargaJual)}
          </p>
          <p className="text-sm font-semibold text-gray-900 tabular-nums">
            {formatRupiah(item.subtotal)}
          </p>
        </div>
      </div>

      {/* Discount (if any) */}
      {item.diskon > 0 && (
        <div className="ml-7 mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onEditDiscount(item)}
            className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded hover:bg-green-100 transition-colors"
          >
            Diskon: -{formatRupiah(item.diskon)}
          </button>
          <span className="text-xs text-gray-400 line-through tabular-nums">
            {formatRupiah(subtotalBeforeDiscount)}
          </span>
        </div>
      )}
    </div>
  );
}

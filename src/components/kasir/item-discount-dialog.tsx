'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Percent, DollarSign } from 'lucide-react';
import { cn, formatRupiah, parseRupiah } from '@/lib/utils';

type DiscountType = 'nominal' | 'percent';

export interface ItemDiscountData {
  type: DiscountType;
  value: number; // Nominal dalam Rupiah atau persentase
  calculatedDiscount: number; // Hasil hitung diskon dalam Rupiah
}

interface ItemDiscountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ItemDiscountData) => void;
  itemName: string;
  itemPrice: number; // Harga satuan
  itemQuantity: number;
  currentDiscount: number; // Diskon saat ini
}

export function ItemDiscountDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  itemPrice,
  itemQuantity,
  currentDiscount,
}: ItemDiscountDialogProps) {
  const [discountType, setDiscountType] = useState<DiscountType>('nominal');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const subtotalBeforeDiscount = itemPrice * itemQuantity;

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Reset state
      setDiscountType('nominal');
      setError('');
      
      // Set current discount value if exists
      if (currentDiscount > 0) {
        setDiscountValue(currentDiscount.toString());
        setDiscountType('nominal');
      } else {
        setDiscountValue('');
      }
      
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, currentDiscount]);

  // Calculate discount based on type
  const calculateDiscount = (): number => {
    const value = discountType === 'nominal' 
      ? parseRupiah(discountValue) 
      : parseFloat(discountValue) || 0;
    
    if (value <= 0) return 0;
    
    if (discountType === 'nominal') {
      return Math.min(value, subtotalBeforeDiscount); // Tidak boleh melebihi subtotal
    } else {
      // Persentase
      const percentValue = Math.min(value, 100); // Maksimal 100%
      return Math.round((percentValue / 100) * subtotalBeforeDiscount);
    }
  };

  const calculatedDiscount = calculateDiscount();
  const subtotalAfterDiscount = subtotalBeforeDiscount - calculatedDiscount;

  const validate = (): boolean => {
    const value = discountType === 'nominal' 
      ? parseRupiah(discountValue) 
      : parseFloat(discountValue) || 0;

    if (discountValue && value < 0) {
      setError('Diskon tidak boleh negatif');
      return false;
    }

    if (discountType === 'percent' && value > 100) {
      setError('Persentase maksimal 100%');
      return false;
    }

    if (discountType === 'nominal' && value > subtotalBeforeDiscount) {
      setError('Diskon tidak boleh melebihi subtotal');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const value = discountType === 'nominal' 
      ? parseRupiah(discountValue) 
      : parseFloat(discountValue) || 0;

    onConfirm({
      type: discountType,
      value,
      calculatedDiscount,
    });
  };

  const handleRemoveDiscount = () => {
    onConfirm({
      type: 'nominal',
      value: 0,
      calculatedDiscount: 0,
    });
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Diskon Item</h2>
            <p className="text-sm text-gray-500 truncate max-w-[200px]">{itemName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Info */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Harga satuan</span>
              <span className="font-medium tabular-nums">{formatRupiah(itemPrice)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Jumlah</span>
              <span className="font-medium tabular-nums">{itemQuantity}</span>
            </div>
            <div className="flex justify-between mt-1 pt-1 border-t border-gray-200">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium tabular-nums">{formatRupiah(subtotalBeforeDiscount)}</span>
            </div>
          </div>

          {/* Discount Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Diskon
            </label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('nominal');
                  setDiscountValue('');
                  setError('');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors',
                  discountType === 'nominal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <DollarSign className="h-4 w-4" />
                Nominal (Rp)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType('percent');
                  setDiscountValue('');
                  setError('');
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors',
                  discountType === 'percent'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Percent className="h-4 w-4" />
                Persen (%)
              </button>
            </div>
          </div>

          {/* Discount Value Input */}
          <div>
            <label htmlFor="discount-value" className="block text-sm font-medium text-gray-700 mb-1.5">
              {discountType === 'nominal' ? 'Nominal Diskon' : 'Persentase Diskon'}
            </label>
            <div className="relative">
              {discountType === 'nominal' ? (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
              ) : (
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              <input
                ref={inputRef}
                id="discount-value"
                type="text"
                value={discountType === 'nominal' && discountValue 
                  ? formatRupiah(parseRupiah(discountValue), { showSymbol: false }) 
                  : discountValue
                }
                onChange={(e) => {
                  if (discountType === 'nominal') {
                    const value = e.target.value.replace(/\D/g, '');
                    setDiscountValue(value);
                  } else {
                    // Allow decimal for percentage
                    const value = e.target.value.replace(/[^\d.]/g, '');
                    setDiscountValue(value);
                  }
                  setError('');
                }}
                placeholder={discountType === 'nominal' ? '0' : '0'}
                className={cn(
                  'w-full py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums',
                  discountType === 'nominal' ? 'pl-9 pr-3' : 'pl-3 pr-9',
                  error ? 'border-red-500' : 'border-gray-300'
                )}
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Preview */}
          {calculatedDiscount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Diskon</span>
                <span className="font-medium text-green-700 tabular-nums">
                  -{formatRupiah(calculatedDiscount)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1 pt-1 border-t border-green-200">
                <span className="text-green-800 font-medium">Subtotal setelah diskon</span>
                <span className="font-bold text-green-800 tabular-nums">
                  {formatRupiah(subtotalAfterDiscount)}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          {currentDiscount > 0 && (
            <button
              type="button"
              onClick={handleRemoveDiscount}
              className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Hapus Diskon
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors',
              currentDiscount > 0 ? '' : 'flex-1'
            )}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Terapkan Diskon
          </button>
        </div>
      </div>
    </div>
  );
}

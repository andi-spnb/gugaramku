'use client';

import { Trash2, Tag } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';

interface CartSummaryProps {
  subtotal: number;
  diskon: number;
  total: number;
  itemCount: number;
  onClearCart: () => void;
  onCheckout: () => void;
  onEditTotalDiscount: () => void;
}

export function CartSummary({
  subtotal,
  diskon,
  total,
  itemCount,
  onClearCart,
  onCheckout,
  onEditTotalDiscount,
}: CartSummaryProps) {
  const isCartEmpty = itemCount === 0;

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Summary */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900 tabular-nums">
            {formatRupiah(subtotal)}
          </span>
        </div>
        
        {/* Diskon Total Row - Always show with button */}
        <div className="flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={onEditTotalDiscount}
            disabled={isCartEmpty}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              diskon > 0
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-600 hover:text-primary',
              isCartEmpty && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>{diskon > 0 ? 'Diskon Total' : 'Tambah Diskon'}</span>
          </button>
          {diskon > 0 ? (
            <span className="font-medium text-green-600 tabular-nums">
              -{formatRupiah(diskon)}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">Klik untuk tambah</span>
          )}
        </div>
        
        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold text-primary tabular-nums">
              {formatRupiah(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        <button
          type="button"
          onClick={onClearCart}
          disabled={isCartEmpty}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Kosongkan</span>
        </button>
        
        <button
          type="button"
          onClick={onCheckout}
          disabled={isCartEmpty}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Bayar</span>
          <span className="font-bold tabular-nums">{formatRupiah(total)}</span>
        </button>
      </div>
    </div>
  );
}

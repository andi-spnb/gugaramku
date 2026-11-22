'use client';

import { Trash2, Tag, Clock, CreditCard } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';

interface CartSummaryProps {
  subtotal: number;
  diskon: number;
  total: number;
  itemCount: number;
  onClearCart: () => void;
  onCheckout: () => void;
  onEditTotalDiscount: () => void;
  onHold?: () => void;
  heldCount?: number;
  onShowHeld?: () => void;
}

export function CartSummary({
  subtotal,
  diskon,
  total,
  itemCount,
  onClearCart,
  onCheckout,
  onEditTotalDiscount,
  onHold,
  heldCount = 0,
  onShowHeld,
}: CartSummaryProps) {
  const isCartEmpty = itemCount === 0;

  return (
    <div className="border-t-2 border-gray-200 bg-white">
      {/* Held transactions link (selalu tampil agar kasir tahu ada yang tertahan) */}
      {onShowHeld && (
        <button
          type="button"
          onClick={onShowHeld}
          className={cn(
            'flex w-full items-center justify-between gap-2 border-b px-4 py-2 text-xs font-medium transition-colors',
            heldCount > 0
              ? 'border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
          )}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {heldCount > 0 ? `${heldCount} transaksi tertahan` : 'Tidak ada transaksi tertahan'}
          </span>
          <span className="underline">{heldCount > 0 ? 'Lihat' : 'Kelola'}</span>
        </button>
      )}

      {/* Summary */}
      <div className="space-y-2 px-4 pb-2 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900 tabular-nums">{formatRupiah(subtotal)}</span>
        </div>

        {/* Diskon Total Row */}
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onEditTotalDiscount}
            disabled={isCartEmpty}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              diskon > 0 ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-primary',
              isCartEmpty && 'cursor-not-allowed opacity-50'
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>{diskon > 0 ? 'Diskon Total' : 'Tambah Diskon'}</span>
          </button>
          {diskon > 0 ? (
            <span className="font-semibold text-green-600 tabular-nums">-{formatRupiah(diskon)}</span>
          ) : (
            <span className="text-xs text-gray-400">Klik untuk tambah</span>
          )}
        </div>
      </div>

      {/* Total: besar supaya terbaca dari jarak kasir */}
      <div className="mx-4 mb-3 flex items-end justify-between rounded-xl bg-primary/5 px-4 py-2.5">
        <span className="text-sm font-semibold text-gray-700">TOTAL</span>
        <span className="text-2xl font-extrabold leading-none text-primary tabular-nums">
          {formatRupiah(total)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={onClearCart}
          disabled={isCartEmpty}
          className="flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          title="Kosongkan keranjang"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {onHold && (
          <button
            type="button"
            onClick={onHold}
            disabled={isCartEmpty}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="Tahan transaksi untuk dilanjutkan nanti"
          >
            <Clock className="h-4 w-4" />
            <span>Hold</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCheckout}
          disabled={isCartEmpty}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          <span>Bayar</span>
          <span className="tabular-nums">{formatRupiah(total)}</span>
        </button>
      </div>
    </div>
  );
}

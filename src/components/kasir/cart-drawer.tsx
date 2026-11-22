'use client';

import { useEffect, useRef } from 'react';
import { X, ShoppingCart, Clock, CloudOff, RefreshCw, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Cart, type PriceLevelOption } from './cart';
import { CartSummary } from './cart-summary';
import type { CartItem, CartItemUnit } from '@/types';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  tingkatHarga: number;
  priceLevelName: string;
  priceLevelColor: string;
  subtotal: number;
  diskon: number;
  total: number;
  getMaxQty: (item: CartItem) => number | undefined;
  pendingOfflineCount: number;
  isRetryingPending: boolean;
  heldCount: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeUnit: (itemId: string, newUnit: CartItemUnit) => void;
  onEditDiscount: (item: CartItem) => void;
  onChangeItemPriceLevel: (itemId: string, tingkat: number) => void;
  priceLevels: PriceLevelOption[];
  onClearCart: () => void;
  onCheckout: () => void;
  onEditTotalDiscount: () => void;
  onHold: () => void;
  onShowHeld: () => void;
  onRetryPending: () => void;
}

/**
 * Keranjang.
 *
 * Di desktop (lg ke atas) keranjang TIDAK overlay: ia mengisi panel kanan sehingga
 * kasir bisa melihat produk dan keranjang berdampingan (tampilan "split").
 * Di ponsel/tablet keranjang menjadi lapisan penuh yang bergeser dari kanan.
 */
export function CartDrawer({
  open,
  onClose,
  items,
  tingkatHarga,
  priceLevelName,
  priceLevelColor,
  subtotal,
  diskon,
  total,
  getMaxQty,
  pendingOfflineCount,
  isRetryingPending,
  heldCount,
  onUpdateQuantity,
  onRemoveItem,
  onChangeUnit,
  onEditDiscount,
  onChangeItemPriceLevel,
  priceLevels,
  onClearCart,
  onCheckout,
  onEditTotalDiscount,
  onHold,
  onShowHeld,
  onRetryPending,
}: CartDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fokuskan tombol tutup saat panel dibuka (aksesibilitas keyboard, hanya mobile)
  useEffect(() => {
    if (!open) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    const id = requestAnimationFrame(() =>
      closeButtonRef.current?.focus({ preventScroll: true })
    );
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Escape menutup panel (hanya relevan untuk overlay mobile)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop: hanya di mobile/tablet karena desktop memakai split view */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: overlay geser di mobile, panel statis di desktop */}
      <aside
        aria-label="Keranjang belanja"
        aria-hidden={!open}
        className={cn(
          'flex flex-col border-gray-200 bg-white',
          // Mobile: overlay penuh dari kanan + slide
          'fixed inset-y-0 right-0 z-50 shadow-2xl transition-transform duration-300 ease-out',
          'w-full sm:w-[24rem] sm:max-w-[94vw]',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
          // Desktop: bukan overlay, melainkan kolom tetap di dalam halaman
          'lg:pointer-events-auto lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:rounded-xl lg:border lg:shadow-sm',
          'lg:transition-[width,opacity] lg:duration-300 lg:ease-out',
          // Desktop saat tertutup: lebar 0 agar daftar produk tampil penuh
          open
            ? 'lg:w-[26rem] lg:opacity-100'
            : 'lg:w-0 lg:overflow-hidden lg:border-transparent lg:opacity-0 lg:shadow-none'
        )}
      >
        {/* Header */}
        <div className="relative shrink-0 rounded-t-xl border-b border-gray-200 bg-white px-4 py-3 pr-14 lg:pr-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-gray-900">Keranjang</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary tabular-nums">
              {items.length}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: priceLevelColor }} />
              Harga: <span className="font-semibold">{priceLevelName}</span>
            </span>
            {heldCount > 0 && (
              <button
                type="button"
                onClick={onShowHeld}
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
              >
                <Clock className="h-3.5 w-3.5" />
                {heldCount} tertahan
              </button>
            )}
          </div>

          {/* Tutup: kembali ke daftar produk (mobile) / sembunyikan panel (desktop) */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 lg:right-2"
            aria-label="Kembali ke daftar produk"
          >
            <X className="h-5 w-5 lg:hidden" />
            <ArrowLeft className="hidden h-5 w-5 lg:block" />
          </button>
        </div>

        {/* Antrean transaksi offline */}
        {pendingOfflineCount > 0 && (
          <div className="mx-3 mt-2 flex shrink-0 items-start justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
            <div className="flex items-start gap-2 text-sm text-amber-900">
              <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">{pendingOfflineCount} transaksi offline</p>
                <p className="text-xs text-amber-700">Belum terkirim ke server</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRetryPending}
              disabled={isRetryingPending}
              className="mt-0.5 flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {isRetryingPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Kirim ulang
            </button>
          </div>
        )}

        {/* Item list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Keranjang masih kosong</p>
                <p className="mt-1 text-xs text-gray-500">
                  Pilih produk di daftar untuk mulai transaksi.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Lihat produk
              </button>
            </div>
          ) : (
            <Cart
              items={items}
              tingkatHarga={tingkatHarga}
              priceLevels={priceLevels}
              getMaxQty={getMaxQty}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              onChangeUnit={onChangeUnit}
              onEditDiscount={onEditDiscount}
              onChangeItemPriceLevel={onChangeItemPriceLevel}
            />
          )}
        </div>

        {/* Tambah produk lagi (khusus mobile: kembali ke daftar) */}
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center justify-center gap-1.5 border-t border-gray-100 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 lg:hidden"
          >
            <Plus className="h-4 w-4" />
            Tambah produk
          </button>
        )}

        {/* Summary sticky di bawah */}
        <div className="shrink-0">
          <CartSummary
            subtotal={subtotal}
            diskon={diskon}
            total={total}
            itemCount={items.length}
            onClearCart={onClearCart}
            onCheckout={onCheckout}
            onEditTotalDiscount={onEditTotalDiscount}
            onHold={onHold}
            heldCount={heldCount}
            onShowHeld={onShowHeld}
          />
        </div>
      </aside>
    </>
  );
}

interface CartTriggerButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
  /** Tampilkan label teks "Keranjang" (default true) */
  showLabel?: boolean;
}

/** Tombol pembuka keranjang di toolbar kasir. */
export function CartTriggerButton({ itemCount, total, onClick }: CartTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
      aria-label={`Buka keranjang, ${itemCount} item`}
    >
      <ShoppingCart className="h-4 w-4" />
      <span>Keranjang</span>
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums">
        {itemCount}
      </span>
      <span className="hidden text-xs font-bold tabular-nums sm:inline">
        {new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(total)}
      </span>
    </button>
  );
}

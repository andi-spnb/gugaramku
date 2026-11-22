'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Minus, Plus, Package } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import { getPriceByLevel } from '@/lib/constants/price-levels';
import type { ProdukWithDetails, ProdukSatuan } from '@/types';

interface UnitSelectionDialogProps {
  produk: ProdukWithDetails | null;
  tingkatHarga: number;
  cabangId?: string;
  /** Qty dasar yang sudah ada di keranjang untuk produk ini */
  qtyInCartBase: number;
  onClose: () => void;
  onConfirm: (satuan: ProdukSatuan, jumlah: number) => void;
}

export function UnitSelectionDialog({
  produk,
  tingkatHarga,
  cabangId,
  qtyInCartBase,
  onClose,
  onConfirm,
}: UnitSelectionDialogProps) {
  const [selectedSatuanId, setSelectedSatuanId] = useState<string>('');
  const [jumlah, setJumlah] = useState(1);

  const satuans = useMemo(() => produk?.produkSatuan || [], [produk]);

  // Reset saat produk berubah: pilih satuan default, jumlah 1
  useEffect(() => {
    if (produk) {
      const def = satuans.find((s) => s.isDefault) || satuans[0];
      setSelectedSatuanId(def?.id || '');
      setJumlah(1);
    }
  }, [produk, satuans]);

  const stockRow = produk
    ? cabangId
      ? produk.stok?.find((s) => s.cabangId === cabangId)
      : produk.stok?.[0]
    : undefined;
  const stokDasar = stockRow ? Number(stockRow.jumlah) : undefined;

  const selectedSatuan = satuans.find((s) => s.id === selectedSatuanId) || satuans[0];
  const konversi = selectedSatuan ? Number(selectedSatuan.konversi) || 1 : 1;
  const stokSatuan =
    stokDasar === undefined ? undefined : Math.max(0, Math.floor(stokDasar / konversi));
  const sisaStokSatuan =
    stokSatuan === undefined
      ? undefined
      : Math.max(0, stokSatuan - Math.floor(qtyInCartBase / konversi));
  const maxQty = sisaStokSatuan === undefined ? undefined : Math.max(1, sisaStokSatuan);

  const harga = selectedSatuan ? getPriceByLevel(selectedSatuan, tingkatHarga) : 0;
  const total = harga * jumlah;

  if (!produk) return null;

  const handleConfirm = () => {
    if (!selectedSatuan) return;
    const qty = Math.max(1, jumlah);
    if (sisaStokSatuan !== undefined && qty > sisaStokSatuan) {
      setJumlah(maxQty ?? 1);
      return;
    }
    onConfirm(selectedSatuan, qty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900">{produk.nama}</h2>
            <p className="text-xs text-gray-400">
              {produk.barcode ? <span className="font-mono">{produk.barcode}</span> : 'Tanpa barcode'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 px-5 py-4">
          {/* Pilih satuan */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Pilih Satuan</label>
            {satuans.length === 0 ? (
              <p className="text-sm text-gray-400">Produk ini belum memiliki satuan.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {satuans.map((s) => {
                  const conv = Number(s.konversi) || 1;
                  const stok =
                    stokDasar === undefined ? undefined : Math.floor(stokDasar / conv);
                  const sisa =
                    stok === undefined ? undefined : Math.max(0, stok - Math.floor(qtyInCartBase / conv));
                  const habis = sisa !== undefined && sisa <= 0;
                  const isSelected = selectedSatuan?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={habis}
                      onClick={() => {
                        setSelectedSatuanId(s.id);
                        setJumlah(1);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                        habis
                          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                          : isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase text-gray-900">
                          {s.namaSatuan}
                          {s.isDefault && (
                            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium normal-case text-gray-500">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {conv} {produk.satuanDasar || 'satuan dasar'} per {s.namaSatuan}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-primary">
                          {formatRupiah(getPriceByLevel(s, tingkatHarga))}
                        </p>
                        {sisa !== undefined && (
                          <p
                            className={cn(
                              'text-[11px] font-medium tabular-nums',
                              habis ? 'text-red-600' : sisa <= 5 ? 'text-amber-600' : 'text-green-700'
                            )}
                          >
                            {habis ? 'Stok habis' : `Stok: ${sisa}`}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Jumlah */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Jumlah</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJumlah((q) => Math.max(1, q - 1))}
                disabled={jumlah <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={jumlah}
                onChange={(e) => {
                  const v = Math.floor(Number(e.target.value)) || 1;
                  setJumlah(maxQty === undefined ? Math.max(1, v) : Math.min(maxQty, Math.max(1, v)));
                }}
                className="h-10 w-full rounded-lg border border-gray-300 text-center text-sm font-semibold tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() =>
                  setJumlah((q) => (maxQty === undefined ? q + 1 : Math.min(maxQty, q + 1)))
                }
                disabled={maxQty !== undefined && jumlah >= maxQty}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {sisaStokSatuan !== undefined && (
              <p className={cn('mt-1.5 text-xs', sisaStokSatuan <= 0 ? 'text-red-600' : 'text-gray-500')}>
                {sisaStokSatuan > 0
                  ? `Tersedia ${sisaStokSatuan} ${selectedSatuan?.namaSatuan} di stok`
                  : 'Stok tidak tersedia untuk satuan ini'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold tabular-nums text-gray-900">{formatRupiah(total)}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedSatuan || sisaStokSatuan === 0 || jumlah < 1}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Package className="h-4 w-4" />
              Tambahkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

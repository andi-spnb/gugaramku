'use client';

import { useState } from 'react';
import { X, PlayCircle, Trash2, Loader2, Clock, Package, AlertTriangle } from 'lucide-react';
import type { TransaksiWithDetails } from '@/types';
import { formatRupiah } from '@/lib/utils';

interface HoldListDialogProps {
  open: boolean;
  onClose: () => void;
  heldTransactions: TransaksiWithDetails[];
  isLoading: boolean;
  onResume: (transaksi: TransaksiWithDetails) => void;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export function HoldListDialog({
  open,
  onClose,
  heldTransactions,
  isLoading,
  onResume,
  onDelete,
  isDeleting = false,
}: HoldListDialogProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!open) return null;

  const formatWaktu = (date: Date) =>
    new Date(date).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex w-full max-w-lg max-h-[85vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Transaksi Tertahan</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {heldTransactions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="mt-2 text-sm">Memuat...</p>
            </div>
          ) : heldTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="h-10 w-10" />
              <p className="mt-3 text-sm">Tidak ada transaksi tertahan</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {heldTransactions.map((trx) => (
                <li
                  key={trx.id}
                  className="rounded-lg border border-gray-200 p-3 hover:border-primary/40 transition-colors"
                >
                  {confirmDeleteId === trx.id ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Hapus transaksi tertahan ini? Tindakan tidak bisa dibatalkan.</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(trx.id)}
                          disabled={isDeleting}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {trx.nomor}
                          </p>
                          <span className="text-xs text-gray-400">
                            {formatWaktu(trx.tanggal)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {trx.detailTransaksi.length} item ·{' '}
                          {trx.detailTransaksi
                            .slice(0, 2)
                            .map((d) => d.namaBarang)
                            .join(', ')}
                          {trx.detailTransaksi.length > 2 && '...'}
                        </p>
                        {trx.catatan && (
                          <p className="mt-0.5 text-xs italic text-gray-400">
                            &ldquo;{trx.catatan}&rdquo;
                          </p>
                        )}
                        <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                          {formatRupiah(trx.total)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => onResume(trx)}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Lanjutkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(trx.id)}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

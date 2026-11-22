'use client';

import { useRef, useEffect } from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export interface ReceiptStoreSettings {
  namaToko: string;
  alamat?: string | null;
  telepon?: string | null;
  footerStruk?: string | null;
  printerSize?: string;
}

export interface ReceiptItem {
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaJual: number;
  diskon: number;
  subtotal: number;
}

export interface ReceiptData {
  nomor: string;
  tanggal: Date;
  items: ReceiptItem[];
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  jumlahBayar: number;
  kembalian: number;
  kasirNama?: string | null;
}

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
  settings: ReceiptStoreSettings | null;
}

const METODE_LABEL: Record<string, string> = {
  TUNAI: 'Tunai',
  QRIS: 'QRIS',
  TRANSFER: 'Transfer',
  HUTANG: 'Hutang',
  SPLIT: 'Split',
};

export function ReceiptDialog({ open, onClose, data, settings }: ReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open || !data) return null;

  const printerSize = settings?.printerSize === '80mm' ? '80mm' : '58mm';
  const paperWidth = printerSize === '80mm' ? '76mm' : '48mm'; // area cetak efektif

  const handlePrint = () => {
    // Cetak hanya area struk lewat iframe tersembunyi.
    // window.print() biasa mencetak seluruh halaman (termasuk dashboard di belakang dialog).
    const area = printRef.current;
    if (!area) return;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      window.print();
      return;
    }

    const width = printerSize === '80mm' ? '80mm' : '58mm';
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Struk</title>${styles}
      <style>
        @page { size: ${width} auto; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body { width: ${width}; padding: 2mm; font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.2; }
      </style>
      </head><body>${area.outerHTML}</body></html>`);
    doc.close();

    const cleanup = () => setTimeout(() => iframe.remove(), 500);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      cleanup();
    };
    // Fallback bila onload iframe tidak terpicu
    setTimeout(cleanup, 10000);
  };

  const formatTanggal = (date: Date) =>
    new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header (hidden on print) */}
        <div className="print:hidden flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Transaksi Berhasil</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt preview */}
        <div
          ref={printRef}
          className="receipt-print-area mx-auto my-4 overflow-y-auto bg-white p-4 font-mono text-xs text-gray-900"
          style={{ width: paperWidth }}
        >
          {/* Header toko */}
          <div className="text-center">
            <p className="text-sm font-bold uppercase">{settings?.namaToko || 'TK.HAMZAH'}</p>
            {settings?.alamat && <p className="mt-0.5">{settings.alamat}</p>}
            {settings?.telepon && <p>{settings.telepon}</p>}
          </div>

          <div className="my-2 border-t border-dashed border-gray-400" />

          {/* Info transaksi */}
          <div className="space-y-0.5">
            <p>No: {data.nomor}</p>
            <p>Tanggal: {formatTanggal(data.tanggal)}</p>
            {data.kasirNama && <p>Kasir: {data.kasirNama}</p>}
          </div>

          <div className="my-2 border-t border-dashed border-gray-400" />

          {/* Items */}
          <div className="space-y-1.5">
            {data.items.map((item, idx) => (
              <div key={idx}>
                <p className="font-medium">{item.namaBarang}</p>
                <div className="flex justify-between tabular-nums">
                  <span>
                    {item.jumlah} {item.satuan} x {formatRupiah(item.hargaJual)}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                {item.diskon > 0 && (
                  <div className="flex justify-between text-gray-600 tabular-nums">
                    <span>Diskon</span>
                    <span>-{formatRupiah(item.diskon)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="my-2 border-t border-dashed border-gray-400" />

          {/* Totals */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRupiah(data.subtotal)}</span>
            </div>
            {data.diskon > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRupiah(data.diskon)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatRupiah(data.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>{METODE_LABEL[data.metodeBayar] || data.metodeBayar}</span>
              <span className="tabular-nums">{formatRupiah(data.jumlahBayar)}</span>
            </div>
            {data.metodeBayar === 'TUNAI' && (
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span className="tabular-nums">{formatRupiah(data.kembalian)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          {settings?.footerStruk && (
            <>
              <div className="my-2 border-t border-dashed border-gray-400" />
              <p className="whitespace-pre-line text-center">{settings.footerStruk}</p>
            </>
          )}
        </div>

        {/* Actions (hidden on print) */}
        <div className="print:hidden flex gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}

export { ReceiptDialog as default };

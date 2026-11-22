'use client';

import { useState, useEffect } from 'react';
import { X, Banknote, QrCode, CreditCard, Loader2, ImageOff, Building2 } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';

export interface PaymentSettings {
  qrisImage: string | null;
  rekeningBank: Array<{
    id?: string;
    bank?: string;
    noRekening?: string;
    // kompatibilitas data lama
    namaBank?: string;
    nomorRekening?: string;
    atasNama?: string;
  }>;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (data: { metodeBayar: string; jumlahBayar: number }) => void;
  settings?: PaymentSettings | null;
}

// Nominal cepat sebagai tambahan total (uang pas + pembulatan umum)
const QUICK_ADDITIONS = [0, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

function bankNameOf(r: PaymentSettings['rekeningBank'][number]): string {
  return (r.bank || r.namaBank || 'Bank').toString();
}
function bankNumber(r: PaymentSettings['rekeningBank'][number]): string {
  return (r.noRekening || r.nomorRekening || '-').toString();
}

export function PaymentDialog({ open, onClose, total, onConfirm, settings }: PaymentDialogProps) {
  const [metodeBayar, setMetodeBayar] = useState<'TUNAI' | 'QRIS' | 'TRANSFER'>('TUNAI');
  const [jumlahBayar, setJumlahBayar] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // jumlahBayar disimpan sebagai digit murni (string), agar input "3500" valid untuk total 3.500
  const jumlahBayarNum = parseInt(jumlahBayar || '0', 10) || 0;
  const kembalian = jumlahBayarNum - total;
  const isValid = metodeBayar === 'TUNAI' ? jumlahBayarNum >= total : true;

  useEffect(() => {
    if (open) {
      setJumlahBayar(total > 0 ? String(total) : '');
      setMetodeBayar('TUNAI');
    }
  }, [open, total]);

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsProcessing(true);
    try {
      onConfirm({
        metodeBayar,
        jumlahBayar: metodeBayar === 'TUNAI' ? jumlahBayarNum : total,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Nominal cepat = total dibulatkan ke atas + nominal tertentu (perilaku kasir nyata)
  const handleQuickAmount = (addition: number) => {
    setJumlahBayar(String(total + addition));
  };

  const handleKeypad = (key: string) => {
    setJumlahBayar((prev) => {
      if (key === 'C') return '';
      if (key === '⌫') return prev.slice(0, -1);
      const next = (prev + key).replace(/^0+(?=\d)/, '');
      return next.slice(0, 12); // batasi panjang
    });
  };

  if (!open) return null;

  const rekeningList = (settings?.rekeningBank || []).filter(
    (r) => bankNumber(r) && bankNumber(r) !== '-'
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Pembayaran</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6 scrollbar-thin">
          {/* Total */}
          <div className="text-center">
            <p className="mb-1 text-sm text-gray-500">Total Pembayaran</p>
            <p className="text-3xl font-extrabold text-primary tabular-nums">{formatRupiah(total)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'TUNAI', label: 'Tunai', Icon: Banknote },
                { key: 'QRIS', label: 'QRIS', Icon: QrCode },
                { key: 'TRANSFER', label: 'Transfer', Icon: CreditCard },
              ] as const).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetodeBayar(key)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                    metodeBayar === key
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tunai */}
          {metodeBayar === 'TUNAI' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Jumlah Uang Diterima
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={jumlahBayar ? formatRupiah(jumlahBayarNum, { showSymbol: false }) : ''}
                  onChange={(e) => setJumlahBayar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValid && !isProcessing) handleSubmit();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-bold tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Nominal cepat (total + tambahan) */}
              <div>
                <p className="mb-2 text-sm text-gray-500">Nominal Cepat</p>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_ADDITIONS.map((add) => (
                    <button
                      key={add}
                      type="button"
                      onClick={() => handleQuickAmount(add)}
                      className={cn(
                        'rounded-lg px-2 py-2 text-sm font-medium tabular-nums transition-colors',
                        add === 0
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {add === 0 ? 'Uang Pas' : `+${formatRupiah(add, { showSymbol: false })}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keypad (tanpa mouse keyboard) */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypad(key)}
                    className={cn(
                      'rounded-lg py-3 text-lg font-semibold transition-colors active:bg-gray-300',
                      key === 'C' || key === '⌫'
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Kembalian */}
              <div className={cn('rounded-lg p-4', kembalian >= 0 ? 'bg-green-50' : 'bg-red-50')}>
                <p className="mb-1 text-sm text-gray-600">Kembalian</p>
                <p
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    kembalian >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatRupiah(Math.abs(kembalian))}
                </p>
                {kembalian < 0 && (
                  <p className="mt-1 text-sm text-red-500">
                    Pembayaran kurang {formatRupiah(Math.abs(kembalian))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QRIS */}
          {metodeBayar === 'QRIS' && (
            <div className="py-2 text-center">
              {settings?.qrisImage ? (
                <div className="mx-auto mb-4 w-64 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.qrisImage}
                    alt="QRIS Toko"
                    className="mx-auto block h-auto w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mx-auto mb-4 flex h-56 w-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-amber-600">
                  <ImageOff className="h-10 w-10" />
                  <p className="mt-2 px-3 text-xs font-medium">QRIS belum diatur</p>
                </div>
              )}
              <p className="text-sm font-semibold text-gray-800">
                Total: <span className="text-primary tabular-nums">{formatRupiah(total)}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {settings?.qrisImage
                  ? 'Minta pelanggan scan QR di atas, lalu konfirmasi setelah pembayaran berhasil.'
                  : 'Atur gambar QRIS di menu Pengaturan > Pembayaran agar tampil di sini.'}
              </p>
            </div>
          )}

          {/* Transfer */}
          {metodeBayar === 'TRANSFER' && (
            <div className="space-y-3">
              {rekeningList.length > 0 ? (
                rekeningList.map((rek, idx) => (
                  <div key={rek.id || idx} className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                    <Building2 className="h-6 w-6 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">{bankNameOf(rek)}</p>
                      <p className="text-lg font-bold tracking-wide text-gray-900 tabular-nums">
                        {bankNumber(rek)}
                      </p>
                      {rek.atasNama && (
                        <p className="text-xs text-gray-500">a.n. {rek.atasNama}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
                  Belum ada rekening bank. Atur di menu Pengaturan &gt; Pembayaran.
                </div>
              )}
              <p className="text-center text-sm font-semibold text-gray-800">
                Total: <span className="text-primary tabular-nums">{formatRupiah(total)}</span>
              </p>
              <p className="text-center text-sm text-gray-500">
                Konfirmasi setelah transfer selesai.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : metodeBayar === 'TUNAI' ? (
              'Proses Pembayaran'
            ) : (
              'Konfirmasi Pembayaran'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

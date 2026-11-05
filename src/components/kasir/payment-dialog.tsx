'use client';

import { useState } from 'react';
import { X, Banknote, QrCode, CreditCard, Loader2 } from 'lucide-react';
import { cn, formatRupiah, parseRupiah } from '@/lib/utils';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (data: { metodeBayar: string; jumlahBayar: number }) => void;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export function PaymentDialog({ open, onClose, total, onConfirm }: PaymentDialogProps) {
  const [metodeBayar, setMetodeBayar] = useState<'TUNAI' | 'QRIS' | 'TRANSFER'>('TUNAI');
  const [jumlahBayar, setJumlahBayar] = useState<string>(total.toString());
  const [isProcessing, setIsProcessing] = useState(false);

  const jumlahBayarNum = parseRupiah(jumlahBayar) || 0;
  const kembalian = jumlahBayarNum - total;
  const isValid = metodeBayar === 'TUNAI' ? jumlahBayarNum >= total : true;

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsProcessing(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing
      onConfirm({
        metodeBayar,
        jumlahBayar: metodeBayar === 'TUNAI' ? jumlahBayarNum : total,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setJumlahBayar(amount.toString());
  };

  const handleUangPas = () => {
    setJumlahBayar(total.toString());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pembayaran</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-bold text-primary tabular-nums">
              {formatRupiah(total)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMetodeBayar('TUNAI')}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                  metodeBayar === 'TUNAI'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-sm font-medium">Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodeBayar('QRIS')}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                  metodeBayar === 'QRIS'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <QrCode className="h-6 w-6" />
                <span className="text-sm font-medium">QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodeBayar('TRANSFER')}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                  metodeBayar === 'TRANSFER'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm font-medium">Transfer</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {metodeBayar === 'TUNAI' && (
            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Jumlah Uang Diterima
                </label>
                <input
                  type="text"
                  value={formatRupiah(jumlahBayarNum, { showSymbol: false })}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setJumlahBayar(value);
                  }}
                  className="w-full px-4 py-3 text-lg font-semibold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums"
                  placeholder="0"
                />
              </div>

              {/* Quick Amounts */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Nominal Cepat</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickAmount(amount)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors tabular-nums"
                    >
                      {formatRupiah(amount, { showSymbol: false })}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleUangPas}
                  className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Uang Pas
                </button>
              </div>

              {/* Change */}
              <div className={cn(
                'p-4 rounded-lg',
                kembalian >= 0 ? 'bg-green-50' : 'bg-red-50'
              )}>
                <p className="text-sm text-gray-600 mb-1">Kembalian</p>
                <p className={cn(
                  'text-2xl font-bold tabular-nums',
                  kembalian >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatRupiah(Math.abs(kembalian))}
                </p>
                {kembalian < 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Pembayaran kurang {formatRupiah(Math.abs(kembalian))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QRIS Payment */}
          {metodeBayar === 'QRIS' && (
            <div className="text-center py-4">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Scan QR code di atas untuk membayar
              </p>
            </div>
          )}

          {/* Transfer Payment */}
          {metodeBayar === 'TRANSFER' && (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Bank BCA</p>
                <p className="text-lg font-semibold text-gray-900">1234567890</p>
                <p className="text-sm text-gray-600">a.n. GuGaramKu</p>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Konfirmasi pembayaran setelah transfer selesai
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              metodeBayar === 'TUNAI' ? 'Proses Pembayaran' : 'Konfirmasi Pembayaran'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

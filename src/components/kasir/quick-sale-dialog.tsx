'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { cn, formatRupiah, parseRupiah } from '@/lib/utils';
import { UNITS } from '@/lib/constants/units';

export interface QuickSaleItem {
  nama: string;
  satuan: string;
  harga: number;
  jumlah: number;
}

interface QuickSaleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (item: QuickSaleItem) => void;
}

export function QuickSaleDialog({ open, onClose, onConfirm }: QuickSaleDialogProps) {
  const [nama, setNama] = useState('');
  const [satuan, setSatuan] = useState('pcs');
  const [harga, setHarga] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const namaInputRef = useRef<HTMLInputElement>(null);

  // Focus nama input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => namaInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setNama('');
      setSatuan('pcs');
      setHarga('');
      setJumlah('1');
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nama.trim()) {
      newErrors.nama = 'Nama barang wajib diisi';
    }

    const hargaNum = parseRupiah(harga);
    if (!harga || hargaNum <= 0) {
      newErrors.harga = 'Harga harus lebih dari 0';
    }

    const jumlahNum = parseInt(jumlah, 10);
    if (!jumlah || isNaN(jumlahNum) || jumlahNum <= 0) {
      newErrors.jumlah = 'Jumlah harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    onConfirm({
      nama: nama.trim(),
      satuan,
      harga: parseRupiah(harga),
      jumlah: parseInt(jumlah, 10),
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

  const hargaNum = parseRupiah(harga) || 0;
  const jumlahNum = parseInt(jumlah, 10) || 0;
  const subtotal = hargaNum * jumlahNum;

  // Filter common units for quick sale
  const commonUnits = UNITS.filter(u => 
    ['pcs', 'bks', 'kg', 'ltr', 'pak', 'dos', 'set'].includes(u.kode)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Sale</h2>
              <p className="text-sm text-gray-500">Jual barang tidak terdaftar</p>
            </div>
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
          {/* Nama Barang */}
          <div>
            <label htmlFor="qs-nama" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              ref={namaInputRef}
              id="qs-nama"
              type="text"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                if (errors.nama) setErrors((prev) => ({ ...prev, nama: '' }));
              }}
              placeholder="Contoh: Barang Titipan"
              className={cn(
                'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.nama ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.nama && (
              <p className="mt-1 text-sm text-red-600">{errors.nama}</p>
            )}
          </div>

          {/* Satuan */}
          <div>
            <label htmlFor="qs-satuan" className="block text-sm font-medium text-gray-700 mb-1.5">
              Satuan
            </label>
            <select
              id="qs-satuan"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              {commonUnits.map((unit) => (
                <option key={unit.kode} value={unit.kode}>
                  {unit.nama} - {unit.namaLengkap}
                </option>
              ))}
            </select>
          </div>

          {/* Harga & Jumlah */}
          <div className="grid grid-cols-2 gap-4">
            {/* Harga */}
            <div>
              <label htmlFor="qs-harga" className="block text-sm font-medium text-gray-700 mb-1.5">
                Harga <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                <input
                  id="qs-harga"
                  type="text"
                  value={harga ? formatRupiah(parseRupiah(harga), { showSymbol: false }) : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setHarga(value);
                    if (errors.harga) setErrors((prev) => ({ ...prev, harga: '' }));
                  }}
                  placeholder="0"
                  className={cn(
                    'w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums',
                    errors.harga ? 'border-red-500' : 'border-gray-300'
                  )}
                />
              </div>
              {errors.harga && (
                <p className="mt-1 text-sm text-red-600">{errors.harga}</p>
              )}
            </div>

            {/* Jumlah */}
            <div>
              <label htmlFor="qs-jumlah" className="block text-sm font-medium text-gray-700 mb-1.5">
                Jumlah <span className="text-red-500">*</span>
              </label>
              <input
                id="qs-jumlah"
                type="number"
                value={jumlah}
                onChange={(e) => {
                  setJumlah(e.target.value);
                  if (errors.jumlah) setErrors((prev) => ({ ...prev, jumlah: '' }));
                }}
                min={1}
                className={cn(
                  'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums',
                  errors.jumlah ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.jumlah && (
                <p className="mt-1 text-sm text-red-600">{errors.jumlah}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          {nama && hargaNum > 0 && jumlahNum > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{nama}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {jumlahNum} {satuan.toUpperCase()} × {formatRupiah(hargaNum)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary tabular-nums">
                    {formatRupiah(subtotal)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

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
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}

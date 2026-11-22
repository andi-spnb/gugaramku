'use client';

import { cn } from '@/lib/utils';

interface PriceLevel {
  tingkat: number;
  nama: string;
  warna: string;
}

interface PriceLevelSelectorProps {
  levels: PriceLevel[];
  selected: number;
  onChange: (tingkat: number) => void;
  disabled?: boolean;
}

export function PriceLevelSelector({
  levels,
  selected,
  onChange,
  disabled = false,
}: PriceLevelSelectorProps) {
  // Catatan: shortcut F1-F4 DILEPAS dari komponen ini.
  // F2 sebelumnya dipakai dua kali (fokus pencarian + ganti ke harga Grosir) sehingga
  // kasir bisa mengubah harga tanpa sadar. Ganti tingkatan harga cukup via klik.
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-700">Tingkatan Harga</h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {levels.map((level) => {
          const isActive = selected === level.tingkat;

          return (
            <button
              key={level.tingkat}
              type="button"
              onClick={() => !disabled && onChange(level.tingkat)}
              disabled={disabled}
              data-level={level.tingkat}
              data-active={isActive}
              className={cn(
                'relative flex h-9 min-w-[84px] flex-col items-center justify-center rounded-lg border-2 px-3 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                isActive
                  ? 'text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              style={
                isActive
                  ? { backgroundColor: level.warna, borderColor: level.warna }
                  : undefined
              }
              aria-pressed={isActive}
            >
              <span className={cn('text-[10px] font-bold', isActive ? 'text-white/80' : 'text-gray-400')}>
                H{level.tingkat}
              </span>
              <span className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-gray-700')}>
                {level.nama}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


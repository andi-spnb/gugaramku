'use client';

import { cn } from '@/lib/utils';
import { useEffect } from 'react';

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
  // Keyboard shortcuts (F1-F4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      const key = e.key.toUpperCase();
      if (key === 'F1') {
        e.preventDefault();
        onChange(1);
      } else if (key === 'F2') {
        e.preventDefault();
        onChange(2);
      } else if (key === 'F3') {
        e.preventDefault();
        onChange(3);
      } else if (key === 'F4') {
        e.preventDefault();
        onChange(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChange, disabled]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Pilih Tingkatan Harga</h3>
        <span className="text-xs text-gray-400">Shortcut: F1-F4</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
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
                'relative flex flex-col items-center justify-center min-w-[100px] h-[60px] px-4 rounded-lg border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={
                isActive
                  ? {
                      backgroundColor: level.warna,
                      borderColor: level.warna,
                    }
                  : undefined
              }
            >
              {/* Level indicator */}
              <span className={cn(
                'text-xs font-bold',
                isActive ? 'text-white/80' : 'text-gray-400'
              )}>
                H{level.tingkat}
              </span>
              
              {/* Level name */}
              <span className={cn(
                'text-sm font-semibold mt-0.5',
                isActive ? 'text-white' : 'text-gray-700'
              )}>
                {level.nama}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm" />
              )}
              
              {/* Keyboard shortcut badge */}
              <span className={cn(
                'absolute top-1 right-1 text-[10px] font-medium px-1 rounded',
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
              )}>
                F{level.tingkat}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

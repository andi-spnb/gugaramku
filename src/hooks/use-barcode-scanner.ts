'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook untuk menangkap input dari alat scanner barcode hardware.
 * Scanner barcode umumnya bekerja sebagai "keyboard wedge":
 * mengetik karakter dengan sangat cepat lalu mengirim Enter.
 *
 * Hook ini mendeteksi burst karakter cepat di level window,
 * sehingga alat scanner bekerja meski fokus tidak di input pencarian.
 */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options?: {
    /** Durasi maksimum antar keystroke agar dianggap satu scan (ms). Default: 100ms */
    maxGapMs?: number;
    /** Jumlah karakter minimum agar dianggap barcode valid. Default: 3 */
    minLength?: number;
    enabled?: boolean;
  }
) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const { maxGapMs = 100, minLength = 3, enabled = true } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // Jika gap terlalu lama, reset buffer (bukan scanner, ketikan manusia)
      if (now - lastKeyTimeRef.current > maxGapMs) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      // Enter = akhir scan
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          const barcode = bufferRef.current;
          bufferRef.current = '';
          e.preventDefault();
          onScan(barcode);
        }
        return;
      }

      // Karakter biasa (single char) = tambah ke buffer
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, maxGapMs, minLength, enabled]);
}

/**
 * Deteksi dukungan BarcodeDetector API (scan via kamera).
 * Tersedia di Chrome/Edge modern.
 */
export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * Nama format barcode yang didukung, aman dipakai lintas browser.
 */
export const BARCODE_FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];

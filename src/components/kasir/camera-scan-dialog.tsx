'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, CameraOff, Loader2, AlertTriangle } from 'lucide-react';
import { isBarcodeDetectorSupported, BARCODE_FORMATS } from '@/hooks/use-barcode-scanner';

interface CameraScanDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

/** BarcodeDetector minimal typing untuk TypeScript */
interface DetectedBarcode {
  rawValue: string;
  format: string;
}

export function CameraScanDialog({ open, onClose, onScan }: CameraScanDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const isScanningRef = useRef(true);

  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState('');

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('starting');
    setErrorMessage('');

    if (!isBarcodeDetectorSupported()) {
      setErrorMessage(
        'Scan kamera tidak didukung browser ini. Gunakan Chrome/Edge terbaru, atau gunakan alat scanner barcode fisik.'
      );
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // @ts-expect-error BarcodeDetector belum ada di lib.dom
      const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
      isScanningRef.current = true;
      setStatus('scanning');

      const tick = async () => {
        if (!isScanningRef.current || !videoRef.current) return;

        try {
          const barcodes: DetectedBarcode[] = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && isScanningRef.current) {
            const barcode = barcodes[0].rawValue;
            isScanningRef.current = false;
            onScan(barcode);
            return;
          }
        } catch {
          // Deteksi gagal pada frame ini, lanjut frame berikutnya
        }

        rafRef.current = requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch (err) {
      setErrorMessage(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Akses kamera ditolak. Izinkan akses kamera di browser.'
          : 'Gagal mengakses kamera.'
      );
      setStatus('error');
    }
  }, [onScan]);

  useEffect(() => {
    if (open) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Scan Barcode</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative aspect-[4/3] bg-black">
          {status !== 'error' && (
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          )}

          {/* Overlay frame */}
          {status === 'scanning' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-40 w-64 rounded-lg border-2 border-white/70">
                <div className="absolute left-1/2 top-0 h-0.5 w-full -translate-x-1/2 animate-pulse bg-red-500" />
              </div>
            </div>
          )}

          {/* Loading */}
          {status === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-2 text-sm">Membuka kamera...</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
              <AlertTriangle className="h-10 w-10 text-amber-400" />
              <p className="mt-3 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 text-center">
          {status === 'scanning' ? (
            <p className="text-sm text-gray-500">
              Arahkan barcode ke dalam kotak. Arahkan kamera ke barcode.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="mx-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              {status === 'error' ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

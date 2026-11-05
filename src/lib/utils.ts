import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan class names dengan tailwind-merge untuk menghindari konflik
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah
 * @param amount - Angka yang akan diformat
 * @param options - Opsi formatting
 */
export function formatRupiah(
  amount: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    showDecimal?: boolean;
  }
): string {
  const { showSymbol = true, showDecimal = false } = options || {};
  
  if (amount === null || amount === undefined) {
    return showSymbol ? 'Rp 0' : '0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showSymbol ? 'Rp 0' : '0';
  }

  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  }).format(numAmount);

  return showSymbol ? `Rp ${formatted}` : formatted;
}

/**
 * Parse string Rupiah ke number
 * @param value - String Rupiah (contoh: "Rp 15.000")
 */
export function parseRupiah(value: string): number {
  if (!value) return 0;
  
  // Hapus "Rp", spasi, dan titik
  const cleaned = value.replace(/[Rp\s.]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format tanggal ke format Indonesia
 * @param date - Date object atau string
 * @param options - Opsi formatting
 */
export function formatTanggal(
  date: Date | string | null | undefined,
  options?: {
    showTime?: boolean;
    showSeconds?: boolean;
    format?: 'short' | 'long' | 'full';
  }
): string {
  if (!date) return '-';
  
  const { showTime = false, showSeconds = false, format = 'short' } = options || {};
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: format === 'short' ? '2-digit' : format === 'long' ? 'short' : 'long',
    year: 'numeric',
  };

  if (showTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    if (showSeconds) {
      dateOptions.second = '2-digit';
    }
  }

  return new Intl.DateTimeFormat('id-ID', dateOptions).format(dateObj);
}

/**
 * Format tanggal ke format YYYY-MM-DD untuk input
 */
export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toISOString().split('T')[0];
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Delay/sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format number with thousand separator
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('id-ID').format(numValue);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

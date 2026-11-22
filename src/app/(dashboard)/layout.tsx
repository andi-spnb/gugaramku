'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'gugaramku:sidebar-collapsed';
const WIDTH_EXPANDED = 'lg:pl-64';
const WIDTH_COLLAPSED = 'lg:pl-[76px]';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Muat preferensi dari localStorage setelah mount (hindari mismatch SSR)
  useEffect(() => {
    try {
      setIsCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // localStorage tidak tersedia: tetap terbuka
    }
    setHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // abaikan
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar (bisa diringkas jadi rail ikon) */}
      <div className="hidden lg:block">
        <Sidebar collapsed={isCollapsed} onToggleCollapsed={toggleCollapsed} />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-[padding] duration-200 ease-out',
          // Sebelum hidrasi, pakai lebar terbuka agar tak ada lompatan
          !hydrated || !isCollapsed ? WIDTH_EXPANDED : WIDTH_COLLAPSED
        )}
      >
        {/* Header */}
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}

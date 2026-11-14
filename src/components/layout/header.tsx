'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-auth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isLoading } = useCurrentUser();
  const [isOnline, setIsOnline] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Status koneksi nyata
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Owner';
      case 'ADMIN_CABANG':
        return 'Admin';
      case 'KASIR':
        return 'Kasir';
      default:
        return role;
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  // Display name and info
  const displayName = user?.name || 'User';
  const displayRole = user?.role ? getRoleLabel(user.role) : '';
  const displayCabang = user?.cabangNama || '';

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-3 border-b border-gray-200 bg-white px-3 shadow-sm sm:gap-x-4 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
        aria-label="Buka menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="hidden h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex min-w-0 flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-5 w-5 text-gray-400" />
          <input
            type="search"
            placeholder="Cari produk, transaksi..."
            className="h-10 w-full max-w-md rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-x-3 sm:gap-x-4 lg:gap-x-6">
          {/* Online/Offline indicator */}
          <div
            className={cn(
              'flex items-center gap-x-2 rounded-full px-3 py-1.5 text-xs font-medium',
              isOnline
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            )}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Notifications */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Lihat notifikasi</span>
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              3
            </span>
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

          {/* User menu */}
          <div className="relative">
            {isLoading ? (
              <div className="flex items-center gap-x-3 p-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-x-3 rounded-lg p-1.5 hover:bg-gray-50"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                data-testid="user-menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">
                    {displayRole}{displayCabang ? ` • ${displayCabang}` : ''}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 lg:block" />
              </button>
            )}

            {/* User dropdown */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="border-b border-gray-100 px-4 py-2 lg:hidden">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    href="/pengaturan/profil"
                    className="flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profil Saya
                  </Link>
                  <Link
                    href="/pengaturan"
                    className="flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Pengaturan
                  </Link>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={handleLogout}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {isLoggingOut ? 'Keluar...' : 'Keluar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

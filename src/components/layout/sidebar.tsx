'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  Wallet,
  RotateCcw,
  Building2,
  ClipboardList,
  History,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useCurrentUser, UserRole } from '@/hooks/use-auth';

/** Lebar sidebar saat terbuka / saat ringkas (hanya ikon). Dipakai layout & header. */
export const SIDEBAR_WIDTH = 256; // w-64
export const SIDEBAR_WIDTH_COLLAPSED = 76; // rail ikon
const STORAGE_KEY = 'gugaramku:sidebar-collapsed';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Omit<NavItem, 'icon' | 'children'>[];
  roles?: UserRole[];
}

const navigation: NavItem[] = [
  {
    title: 'Kasir',
    href: '/kasir',
    icon: ShoppingCart,
    roles: ['OWNER', 'ADMIN_CABANG', 'KASIR'],
  },
  {
    title: 'Produk',
    href: '/produk',
    icon: Package,
    roles: ['OWNER', 'ADMIN_CABANG', 'KASIR'],
    children: [
      { title: 'Daftar Produk', href: '/produk' },
      { title: 'Kategori', href: '/produk/kategori' },
      { title: 'Stok', href: '/produk/stok' },
    ],
  },
  {
    title: 'Pelanggan',
    href: '/pelanggan',
    icon: Users,
    roles: ['OWNER', 'ADMIN_CABANG', 'KASIR'],
    children: [
      { title: 'Daftar Pelanggan', href: '/pelanggan' },
      { title: 'Hutang', href: '/pelanggan/hutang' },
    ],
  },
  {
    title: 'Kas',
    href: '/kas',
    icon: Wallet,
    roles: ['OWNER', 'ADMIN_CABANG'],
  },
  {
    title: 'Retur',
    href: '/retur',
    icon: RotateCcw,
    roles: ['OWNER', 'ADMIN_CABANG', 'KASIR'],
  },
  {
    title: 'Laporan',
    href: '/laporan',
    icon: BarChart3,
    roles: ['OWNER', 'ADMIN_CABANG'],
    children: [
      { title: 'Dashboard', href: '/laporan' },
      { title: 'Penjualan', href: '/laporan/penjualan' },
      { title: 'Laba', href: '/laporan/laba' },
      { title: 'Terlaris', href: '/laporan/terlaris' },
    ],
  },
  {
    title: 'Cabang',
    href: '/cabang',
    icon: Building2,
    roles: ['OWNER'],
  },
  {
    title: 'Log Aktivitas',
    href: '/aktivitas',
    icon: History,
    roles: ['OWNER'],
  },
  {
    title: 'Karyawan',
    href: '/karyawan',
    icon: ClipboardList,
    roles: ['OWNER', 'ADMIN_CABANG'],
  },
  {
    title: 'Pengaturan',
    href: '/pengaturan',
    icon: Settings,
    roles: ['OWNER', 'ADMIN_CABANG'],
  },
];

interface SidebarProps {
  /** Mobile: menutup drawer */
  onClose?: () => void;
  /** Desktop: mode ringkas (hanya ikon) */
  collapsed?: boolean;
  /** Desktop: toggle mode ringkas */
  onToggleCollapsed?: () => void;
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Saat ringkas, klik menu ber-anak membuka flyout sementara
  const [flyoutHref, setFlyoutHref] = useState<string | null>(null);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/kasir') return pathname === '/kasir';
    return pathname.startsWith(href);
  };

  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.href);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleLabel = (role: string) => {
    if (role === 'OWNER') return 'Owner';
    if (role === 'ADMIN_CABANG') return 'Admin';
    if (role === 'KASIR') return 'Kasir';
    return role;
  };

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });

  // Tutup flyout ketika rute berubah atau mode berubah
  useEffect(() => {
    setFlyoutHref(null);
  }, [pathname, collapsed]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col lg:transition-[width] lg:duration-200 lg:ease-out',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        )}
      >
        <div
          className={cn(
            'flex grow flex-col gap-y-4 border-r border-gray-200 bg-white pb-4',
            collapsed
              ? // Saat ringkas, flyout submenu keluar dari sidebar: jangan dipotong
                'overflow-visible px-2'
              : 'overflow-y-auto overflow-x-hidden px-4 scrollbar-thin'
          )}
        >
          {/* Logo + toggle */}
          <div
            className={cn(
              'flex h-16 shrink-0 items-center border-b border-gray-100',
              collapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <Link
              href="/kasir"
              className={cn('flex items-center gap-2', collapsed && 'justify-center')}
              title="TK.HAMZAH"
            >
              <Image
                src="/logo-icon.png"
                alt="TK.HAMZAH"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0"
                priority
              />
              {!collapsed && (
                <span className="text-lg font-bold text-gray-900">TK.HAMZAH</span>
              )}
            </Link>

            {!collapsed && onToggleCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Sembunyikan menu"
                aria-label="Sembunyikan menu samping"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Tombol buka saat ringkas */}
          {collapsed && onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="mx-auto rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Tampilkan menu"
              aria-label="Tampilkan menu samping"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          )}

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {filteredNavigation.map((item) => {
                const active = isActive(item.href) || isChildActive(item);

                // ---------- RINGKAS: hanya ikon + tooltip/flyout ----------
                if (collapsed) {
                  return (
                    <li key={item.href} className="group relative">
                      {item.children ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setFlyoutHref((prev) => (prev === item.href ? null : item.href))
                            }
                            aria-label={item.title}
                            aria-expanded={flyoutHref === item.href}
                            className={cn(
                              'relative flex h-11 w-full items-center justify-center rounded-lg transition-colors',
                              active
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {/* Tooltip */}
                            {flyoutHref !== item.href && (
                              <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block group-focus-within:hidden">
                                {item.title}
                              </span>
                            )}
                          </button>

                          {/* Flyout: terbuka saat hover/fokus atau saat diklik */}
                          <div
                            className={cn(
                              'absolute left-full top-0 z-50 ml-2 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-xl',
                              flyoutHref === item.href
                                ? 'block'
                                : 'hidden group-hover:block group-focus-within:block'
                            )}
                          >
                            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                              {item.title}
                            </p>
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setFlyoutHref(null)}
                                className={cn(
                                  'block px-3 py-2 text-sm transition-colors',
                                  pathname === child.href
                                    ? 'bg-primary/5 font-medium text-primary'
                                    : 'text-gray-600 hover:bg-gray-50'
                                )}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          aria-label={item.title}
                          className={cn(
                            'group relative flex h-11 w-full items-center justify-center rounded-lg transition-colors',
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                }

                // ---------- TERBUKA: label lengkap ----------
                return (
                  <li key={item.href}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.href)}
                          className={cn(
                            'group flex w-full items-center justify-between gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            active
                              ? 'bg-gray-50 text-primary'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <div className="flex items-center gap-x-3">
                            <item.icon
                              className={cn(
                                'h-5 w-5 shrink-0',
                                active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                              )}
                            />
                            {item.title}
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform',
                              expandedItems.includes(item.href) ? 'rotate-180' : ''
                            )}
                          />
                        </button>
                        {expandedItems.includes(item.href) && (
                          <ul className="mt-1 space-y-1 pl-10">
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                                    pathname === child.href
                                      ? 'bg-gray-50 font-medium text-primary'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  )}
                                >
                                  {child.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-gray-50 text-primary'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        {item.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 pt-3">
            {user && (
              <div
                className={cn(
                  'mb-2 rounded-lg bg-gray-50 px-3 py-2',
                  collapsed && 'flex justify-center px-0'
                )}
                title={collapsed ? `${user.name} (${getRoleLabel(user.role)})` : undefined}
              >
                {collapsed ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <>
                    <p className="truncate text-xs font-medium text-gray-700">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {getRoleLabel(user.role)}
                      {user.cabangNama && ` • ${user.cabangNama}`}
                    </p>
                  </>
                )}
              </div>
            )}
            {!collapsed && (
              <p className="text-center text-xs text-gray-400">TK.HAMZAH v0.1.0</p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {onClose && (
        <div className="lg:hidden">
          {/* Overlay backdrop */}
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
              <Link href="/kasir" className="flex items-center gap-2" onClick={onClose}>
                <Image
                  src="/logo-icon.png"
                  alt="TK.HAMZAH"
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0"
                />
                <span className="text-lg font-bold text-gray-900">TK.HAMZAH</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {getRoleLabel(user.role)}
                      {user.cabangNama ? ` • ${user.cabangNama}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-1">
                {filteredNavigation.map((item) => (
                  <li key={item.href}>
                    {item.children ? (
                      <div>
                        <button
                          onClick={() => toggleExpanded(item.href)}
                          className={cn(
                            'flex w-full items-center justify-between gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive(item.href) || isChildActive(item)
                              ? 'bg-primary/10 text-primary'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 shrink-0" />
                            {item.title}
                          </div>
                          {expandedItems.includes(item.href) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {expandedItems.includes(item.href) && (
                          <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  onClick={onClose}
                                  className={cn(
                                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                                    pathname === child.href
                                      ? 'bg-primary/10 font-medium text-primary'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  )}
                                >
                                  {child.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-4">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                Keluar
              </button>
              <p className="mt-3 text-center text-xs text-gray-400">TK.HAMZAH v0.1.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

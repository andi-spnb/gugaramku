'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  X,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useCurrentUser, UserRole } from '@/hooks/use-auth';

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
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/kasir" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                G
              </div>
              <span className="text-xl font-bold text-gray-900">GuGaramKu</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {filteredNavigation.map((item) => (
                <li key={item.href}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(item.href)}
                        className={cn(
                          'group flex w-full items-center justify-between gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive(item.href) || isChildActive(item)
                            ? 'bg-gray-50 text-primary'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <div className="flex items-center gap-x-3">
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive(item.href) || isChildActive(item)
                                ? 'text-primary'
                                : 'text-gray-400 group-hover:text-gray-600'
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
                        isActive(item.href)
                          ? 'bg-gray-50 text-primary'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive(item.href)
                            ? 'text-primary'
                            : 'text-gray-400 group-hover:text-gray-600'
                        )}
                      />
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User info & Version */}
          <div className="border-t border-gray-200 pt-4">
            {user && (
              <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {getRoleLabel(user.role)}
                  {user.cabangNama && ` • ${user.cabangNama}`}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center">GuGaramKu v0.1.0</p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {onClose && (
        <div className="lg:hidden">
        {/* Overlay backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer panel */}
        <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/kasir" className="flex items-center gap-2" onClick={onClose}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
                G
              </div>
              <span className="text-lg font-bold text-gray-900">GuGaramKu</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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
                        <ul className="mt-1 ml-4 space-y-0.5 border-l-2 border-gray-100 pl-3">
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
            <p className="mt-3 text-center text-xs text-gray-400">GuGaramKu v0.1.0</p>
          </div>
        </div>
      </div>
      )}
    </>
  );
}

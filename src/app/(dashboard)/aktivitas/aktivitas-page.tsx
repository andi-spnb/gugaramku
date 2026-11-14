'use client';

import { useState } from 'react';
import {
  History,
  Search,
  Loader2,
  LogIn,
  UserPlus,
  UserCog,
  UserMinus,
  KeyRound,
  Store,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  HandCoins,
  RotateCcw,
  Settings,
  Receipt,
  PauseCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useActivityLogs } from '@/hooks/use-api';
import { formatTanggal } from '@/lib/utils';
import type { LogAktivitas } from '@/types';

const AKSI_OPTIONS = [
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'USER_CREATE', label: 'Tambah Karyawan' },
  { value: 'USER_UPDATE', label: 'Ubah Karyawan' },
  { value: 'USER_DELETE', label: 'Hapus Karyawan' },
  { value: 'PASSWORD_RESET', label: 'Reset Password' },
  { value: 'BRANCH_CREATE', label: 'Tambah Cabang' },
  { value: 'BRANCH_UPDATE', label: 'Ubah Cabang' },
  { value: 'BRANCH_DELETE', label: 'Hapus Cabang' },
  { value: 'STOCK_ADJUSTMENT', label: 'Adjustment Stok' },
  { value: 'KAS_MASUK', label: 'Kas Masuk' },
  { value: 'KAS_KELUAR', label: 'Kas Keluar' },
  { value: 'DEBT_PAY', label: 'Bayar Hutang' },
  { value: 'RETUR_CREATE', label: 'Retur' },
  { value: 'SETTINGS_UPDATE', label: 'Ubah Pengaturan' },
  { value: 'TRANSAKSI_CREATE', label: 'Transaksi' },
  { value: 'TRANSAKSI_HOLD', label: 'Hold Transaksi' },
  { value: 'HOLD_DELETE', label: 'Hapus Hold' },
] as const;

const AKSI_META: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
  LOGIN: { label: 'Login', icon: LogIn, color: 'bg-green-100 text-green-700' },
  LOGOUT: { label: 'Logout', icon: LogIn, color: 'bg-gray-100 text-gray-700' },
  LOGIN_GAGAL: { label: 'Login Gagal', icon: LogIn, color: 'bg-red-100 text-red-700' },
  USER_CREATE: { label: 'Tambah Karyawan', icon: UserPlus, color: 'bg-blue-100 text-blue-700' },
  USER_UPDATE: { label: 'Ubah Karyawan', icon: UserCog, color: 'bg-amber-100 text-amber-700' },
  USER_DELETE: { label: 'Hapus Karyawan', icon: UserMinus, color: 'bg-red-100 text-red-700' },
  PASSWORD_RESET: { label: 'Reset Password', icon: KeyRound, color: 'bg-purple-100 text-purple-700' },
  BRANCH_CREATE: { label: 'Tambah Cabang', icon: Store, color: 'bg-blue-100 text-blue-700' },
  BRANCH_UPDATE: { label: 'Ubah Cabang', icon: Store, color: 'bg-amber-100 text-amber-700' },
  BRANCH_DELETE: { label: 'Hapus Cabang', icon: Store, color: 'bg-red-100 text-red-700' },
  STOCK_ADJUSTMENT: { label: 'Adjustment Stok', icon: Package, color: 'bg-indigo-100 text-indigo-700' },
  KAS_MASUK: { label: 'Kas Masuk', icon: ArrowDownCircle, color: 'bg-green-100 text-green-700' },
  KAS_KELUAR: { label: 'Kas Keluar', icon: ArrowUpCircle, color: 'bg-red-100 text-red-700' },
  DEBT_PAY: { label: 'Bayar Hutang', icon: HandCoins, color: 'bg-teal-100 text-teal-700' },
  RETUR_CREATE: { label: 'Retur', icon: RotateCcw, color: 'bg-orange-100 text-orange-700' },
  SETTINGS_UPDATE: { label: 'Ubah Pengaturan', icon: Settings, color: 'bg-gray-100 text-gray-700' },
  TRANSAKSI_CREATE: { label: 'Transaksi', icon: Receipt, color: 'bg-emerald-100 text-emerald-700' },
  TRANSAKSI_HOLD: { label: 'Hold Transaksi', icon: PauseCircle, color: 'bg-yellow-100 text-yellow-700' },
  HOLD_DELETE: { label: 'Hapus Hold', icon: Trash2, color: 'bg-red-100 text-red-700' },
};

function aksiMeta(aksi: string) {
  return AKSI_META[aksi] || { label: aksi, icon: History, color: 'bg-gray-100 text-gray-700' };
}

export function AktivitasPage() {
  const [page, setPage] = useState(1);
  const [aksiFilter, setAksiFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useActivityLogs({
    page,
    limit: 20,
    aksi: aksiFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = data?.logs || [];
  const meta = data?.meta;

  // Filter pencarian di sisi klien (nama/email user)
  const filtered = search.trim()
    ? logs.filter((log: LogAktivitas) => {
        const q = search.toLowerCase();
        return (
          log.user?.nama?.toLowerCase().includes(q) ||
          log.user?.email?.toLowerCase().includes(q) ||
          log.aksi.toLowerCase().includes(q) ||
          log.tabel.toLowerCase().includes(q)
        );
      })
    : logs;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas</h1>
        <p className="text-sm text-gray-500">
          Rekaman jejak audit seluruh aktivitas penting pengguna di sistem.
        </p>
      </div>

      {/* Filter */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cari</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama, email, aksi..."
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Aksi</label>
            <select
              value={aksiFilter}
              onChange={(e) => {
                setAksiFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Aksi</option>
              {AKSI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">Memuat log...</span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-red-600">
            Gagal memuat log aktivitas. Coba muat ulang halaman.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Belum ada aktivitas yang tercatat.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Waktu</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Pengguna</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Aksi</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tabel</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log: LogAktivitas) => {
                    const m = aksiMeta(log.aksi);
                    const Icon = m.icon;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {formatTanggal(new Date(log.createdAt), { showTime: true })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {log.user?.nama || '-'}
                          </div>
                          <div className="text-xs text-gray-500">{log.user?.email || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${m.color}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {m.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.tabel}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filtered.map((log: LogAktivitas) => {
                const m = aksiMeta(log.aksi);
                const Icon = m.icon;
                return (
                  <div key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${m.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {m.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTanggal(new Date(log.createdAt), { showTime: true })}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-medium text-gray-900">
                      {log.user?.nama || '-'}
                    </div>
                    <div className="text-xs text-gray-500">{log.user?.email || ''}</div>
                    <div className="mt-1 font-mono text-xs text-gray-500">
                      {log.tabel}
                      {log.ipAddress ? ` · ${log.ipAddress}` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {(meta.page - 1) * meta.limit + 1}-
            {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} aktivitas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>
            <span className="text-sm text-gray-600">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
              disabled={page >= meta.totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

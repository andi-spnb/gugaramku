'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Shield,
  ShieldCheck,
  User,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useResetUserPassword,
} from '@/hooks/use-api';
import { toast } from 'sonner';
import type { User as UserType } from '@/lib/api';

const ROLE_OPTIONS = [
  { value: 'OWNER', label: 'Owner', icon: ShieldCheck, color: 'text-purple-600 bg-purple-100' },
  { value: 'ADMIN_CABANG', label: 'Admin Cabang', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  { value: 'KASIR', label: 'Kasir', icon: User, color: 'text-gray-600 bg-gray-100' },
] as const;

type DialogMode = 'create' | 'edit' | 'reset-password' | null;

export function KaryawanPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Form state
  const [formNama, setFormNama] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formRole, setFormRole] = useState<'OWNER' | 'ADMIN_CABANG' | 'KASIR'>('KASIR');
  const [newPassword, setNewPassword] = useState('');

  // Fetch data
  const { data, isLoading, isError } = useUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter !== '' ? statusFilter === 'true' : undefined,
  });

  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resetPasswordMutation = useResetUserPassword();

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || resetPasswordMutation.isPending;

  // Handlers
  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setFormNama('');
    setFormEmail('');
    setFormPassword('');
    setFormPin('');
    setFormRole('KASIR');
    setShowPassword(false);
  };

  const handleOpenEdit = (user: UserType) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setFormNama(user.nama);
    setFormEmail(user.email);
    setFormPin('');
    setFormRole(user.role);
    setMenuOpenId(null);
  };

  const handleOpenResetPassword = (user: UserType) => {
    setDialogMode('reset-password');
    setSelectedUser(user);
    setNewPassword('');
    setShowPassword(false);
    setMenuOpenId(null);
  };

  const handleCloseDialog = () => {
    if (!isPending) {
      setDialogMode(null);
      setSelectedUser(null);
    }
  };

  const handleSubmitCreate = async () => {
    if (!formNama.trim()) {
      toast.error('Nama harus diisi');
      return;
    }
    if (!formEmail.trim()) {
      toast.error('Email harus diisi');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      await createMutation.mutateAsync({
        nama: formNama,
        email: formEmail,
        password: formPassword,
        pin: formPin || undefined,
        role: formRole,
      });
      toast.success('Karyawan berhasil ditambahkan');
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambah karyawan');
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    if (!formNama.trim()) {
      toast.error('Nama harus diisi');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedUser.id,
        nama: formNama,
        email: formEmail,
        pin: formPin || undefined,
        role: formRole,
      });
      toast.success('Karyawan berhasil diperbarui');
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui karyawan');
    }
  };

  const handleToggleActive = async (user: UserType) => {
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive,
      });
      toast.success(user.isActive ? 'Karyawan dinonaktifkan' : 'Karyawan diaktifkan');
      setMenuOpenId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah status');
    }
  };

  const handleDelete = async (user: UserType) => {
    if (user.role === 'OWNER') {
      toast.error('Tidak dapat menghapus akun Owner');
      return;
    }

    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success('Karyawan berhasil dihapus');
      setMenuOpenId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus karyawan');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        id: selectedUser.id,
        newPassword,
      });
      toast.success('Password berhasil direset');
      handleCloseDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mereset password');
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[2];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola karyawan dan akses sistem</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Tambah Karyawan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[150px]"
          >
            <option value="">Semua Role</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white min-w-[150px]"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* User List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Gagal memuat data karyawan</p>
        </div>
      ) : !data?.users.length ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data karyawan</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Karyawan
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Terakhir
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.users.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                const RoleIcon = roleInfo.icon;

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {user.nama.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.nama}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                          <XCircle className="h-4 w-4" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === user.id ? null : user.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenId === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(user)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenResetPassword(user)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <KeyRound className="h-4 w-4" />
                                Reset Password
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(user)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {user.isActive ? (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Nonaktifkan
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Aktifkan
                                  </>
                                )}
                              </button>
                              {user.role !== 'OWNER' && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Hapus
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(dialogMode === 'create' || dialogMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {dialogMode === 'create' ? 'Tambah Karyawan' : 'Edit Karyawan'}
              </h3>
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama lengkap"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Password (only for create) */}
              {dialogMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN (Opsional)
                </label>
                <input
                  type="text"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="4-6 digit"
                  maxLength={6}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">PIN untuk akses cepat kasir</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setFormRole(role.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                          formRole === role.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${formRole === role.value ? 'text-primary' : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${formRole === role.value ? 'text-primary' : 'text-gray-600'}`}>
                          {role.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={dialogMode === 'create' ? handleSubmitCreate : handleSubmitEdit}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {dialogMode === 'create' ? 'Tambah' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {dialogMode === 'reset-password' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseDialog} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              <p className="text-sm text-gray-500 mt-0.5">{selectedUser.nama}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isPending || newPassword.length < 6}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

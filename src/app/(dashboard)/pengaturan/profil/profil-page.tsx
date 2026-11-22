'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Save, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/hooks/use-api';

type Tab = 'profil' | 'keamanan';

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'ADMIN_CABANG':
      return 'Admin Cabang';
    case 'KASIR':
      return 'Kasir';
    default:
      return role;
  }
};

export function ProfilPage() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const { update: updateSession } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (profile) {
      setNama(profile.nama || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!nama.trim()) return toast.error('Nama wajib diisi');
    if (!currentPassword) return toast.error('Password saat ini wajib diisi untuk menyimpan');
    if (newPassword && newPassword.length < 6) return toast.error('Password baru minimal 6 karakter');
    if (newPassword && newPassword !== confirmPassword) return toast.error('Konfirmasi password tidak sesuai');
    if (pin && !/^\d{4,6}$/.test(pin)) return toast.error('PIN harus 4-6 digit angka');

    try {
      const updated = await updateMutation.mutateAsync({
        nama: nama.trim(),
        email: email.trim(),
        currentPassword,
        ...(newPassword ? { newPassword } : {}),
        ...(pin ? { pin } : {}),
      });

      toast.success('Profil berhasil disimpan');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPin('');
      setNama(updated.nama);
      setEmail(updated.email);
      void updateSession({ name: updated.nama, email: updated.email, role: updated.role });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan profil');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof User }> = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'keamanan', label: 'Keamanan', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profil Saya</h1>
        <p className="mt-1 text-sm text-gray-500">Kelola data akun, password, dan PIN Anda</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {activeTab === 'profil' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-gray-400">Email ini dipakai untuk login</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                readOnly
                value={profile ? getRoleLabel(profile.role) : '-'}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cabang</label>
              <input
                type="text"
                readOnly
                value={profile?.cabang?.nama ?? '-'}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi password baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">PIN Kasir</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4-6 digit angka"
                inputMode="numeric"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-gray-400">Kosongkan jika tidak ingin mengubah PIN</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Password saat ini <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Wajib diisi untuk menyimpan perubahan"
            autoComplete="current-password"
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Simpan Perubahan
      </button>
    </div>
  );
}

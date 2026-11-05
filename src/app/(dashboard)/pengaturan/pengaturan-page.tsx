'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Settings,
  Store,
  Printer,
  CreditCard,
  QrCode,
  Loader2,
  Save,
  Plus,
  Trash2,
  Receipt,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/use-api';
import { toast } from 'sonner';
import type { RekeningBank } from '@/lib/api';

type Tab = 'toko' | 'struk' | 'pembayaran';

const BANK_OPTIONS = [
  'BCA',
  'BNI',
  'BRI',
  'Mandiri',
  'BSI',
  'CIMB Niaga',
  'Danamon',
  'Permata',
  'OCBC NISP',
  'Lainnya',
];

export function PengaturanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('toko');

  // Form states
  const [namaToko, setNamaToko] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [footerStruk, setFooterStruk] = useState('');
  const [printerSize, setPrinterSize] = useState<'58mm' | '80mm'>('58mm');
  const [autoLogoutMenit, setAutoLogoutMenit] = useState(30);
  const [rekeningBank, setRekeningBank] = useState<RekeningBank[]>([]);
  const [qrisImage, setQrisImage] = useState<string | null>(null);

  // New rekening form
  const [showAddRekening, setShowAddRekening] = useState(false);
  const [newBank, setNewBank] = useState('BCA');
  const [newNoRekening, setNewNoRekening] = useState('');
  const [newAtasNama, setNewAtasNama] = useState('');

  // Fetch settings
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  // Populate form when data loaded
  useEffect(() => {
    if (settings) {
      setNamaToko(settings.namaToko || '');
      setAlamat(settings.alamat || '');
      setTelepon(settings.telepon || '');
      setEmail(settings.email || '');
      setFooterStruk(settings.footerStruk || '');
      setPrinterSize(settings.printerSize || '58mm');
      setAutoLogoutMenit(settings.autoLogoutMenit || 30);
      setRekeningBank(settings.rekeningBank || []);
      setQrisImage(settings.qrisImage || null);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!namaToko.trim()) {
      toast.error('Nama toko harus diisi');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        namaToko,
        alamat,
        telepon,
        email,
        footerStruk,
        printerSize,
        autoLogoutMenit,
        rekeningBank,
        qrisImage,
      });
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan');
    }
  };

  const handleAddRekening = () => {
    if (!newNoRekening.trim() || !newAtasNama.trim()) {
      toast.error('Lengkapi data rekening');
      return;
    }

    const newRekening: RekeningBank = {
      id: `rek-${Date.now()}`,
      bank: newBank,
      noRekening: newNoRekening,
      atasNama: newAtasNama,
    };

    setRekeningBank([...rekeningBank, newRekening]);
    setNewBank('BCA');
    setNewNoRekening('');
    setNewAtasNama('');
    setShowAddRekening(false);
  };

  const handleDeleteRekening = (id: string) => {
    setRekeningBank(rekeningBank.filter((r) => r.id !== id));
  };

  const tabs = [
    { id: 'toko' as Tab, label: 'Profil Toko', icon: Store },
    { id: 'struk' as Tab, label: 'Struk & Printer', icon: Receipt },
    { id: 'pembayaran' as Tab, label: 'Pembayaran', icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pengaturan toko dan aplikasi</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Pengaturan
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
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

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Profil Toko Tab */}
        {activeTab === 'toko' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Toko */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Toko <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  placeholder="Contoh: Toko Sembako Jaya"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Alamat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Alamat lengkap toko"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Telepon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toko@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Auto Logout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto Logout (menit)
                </label>
                <input
                  type="number"
                  value={autoLogoutMenit}
                  onChange={(e) => setAutoLogoutMenit(parseInt(e.target.value) || 30)}
                  min={5}
                  max={120}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Logout otomatis jika tidak aktif
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Struk & Printer Tab */}
        {activeTab === 'struk' && (
          <div className="p-6 space-y-6">
            {/* Printer Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran Printer Thermal
              </label>
              <div className="flex gap-4">
                {(['58mm', '80mm'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPrinterSize(size)}
                    className={`flex-1 max-w-[150px] py-3 px-4 rounded-lg border-2 transition-colors ${
                      printerSize === size
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Printer className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-medium">{size}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Struk */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pesan di Footer Struk
              </label>
              <textarea
                value={footerStruk}
                onChange={(e) => setFooterStruk(e.target.value)}
                placeholder="Contoh: Terima kasih telah berbelanja. Barang yang sudah dibeli tidak dapat dikembalikan."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Pesan ini akan muncul di bagian bawah struk
              </p>
            </div>

            {/* Struk Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Struk
              </label>
              <div className="bg-gray-100 rounded-lg p-4 max-w-[300px]">
                <div className="bg-white p-4 font-mono text-xs shadow">
                  <div className="text-center mb-3">
                    <p className="font-bold text-sm">{namaToko || 'Nama Toko'}</p>
                    {alamat && <p className="text-[10px]">{alamat}</p>}
                    {telepon && <p className="text-[10px]">{telepon}</p>}
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Produk Contoh</span>
                      <span>10.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produk Lain x2</span>
                      <span>20.000</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="flex justify-between font-bold">
                    <span>TOTAL</span>
                    <span>30.000</span>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <p className="text-center text-[10px] text-gray-500">
                    {footerStruk || 'Terima kasih'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pembayaran Tab */}
        {activeTab === 'pembayaran' && (
          <div className="p-6 space-y-6">
            {/* Rekening Bank */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Rekening Bank
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddRekening(true)}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Rekening
                </button>
              </div>

              {rekeningBank.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Belum ada rekening bank</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rekeningBank.map((rek) => (
                    <div
                      key={rek.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{rek.bank}</p>
                        <p className="text-sm text-gray-600">{rek.noRekening}</p>
                        <p className="text-xs text-gray-400">a.n. {rek.atasNama}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRekening(rek.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Rekening Form */}
              {showAddRekening && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
                  <h4 className="font-medium text-gray-900 mb-3">Tambah Rekening Baru</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Bank</label>
                      <select
                        value={newBank}
                        onChange={(e) => setNewBank(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {BANK_OPTIONS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">No. Rekening</label>
                      <input
                        type="text"
                        value={newNoRekening}
                        onChange={(e) => setNewNoRekening(e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Atas Nama</label>
                      <input
                        type="text"
                        value={newAtasNama}
                        onChange={(e) => setNewAtasNama(e.target.value)}
                        placeholder="Nama pemilik rekening"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddRekening(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddRekening}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QRIS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QRIS
              </label>
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden relative">
                  {qrisImage ? (
                    <Image
                      src={qrisImage}
                      alt="QRIS"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <QrCode className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Upload gambar QRIS untuk ditampilkan saat pembayaran
                  </p>
                  <input
                    type="text"
                    value={qrisImage || ''}
                    onChange={(e) => setQrisImage(e.target.value || null)}
                    placeholder="URL gambar QRIS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Masukkan URL gambar atau upload ke hosting gambar terlebih dahulu
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button Bottom (Mobile) */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}

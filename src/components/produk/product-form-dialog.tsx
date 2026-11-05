'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { useCategories, useCreateProduct, useUpdateProduct, useCreateCategory } from '@/hooks/use-api';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import type { ProdukWithDetails } from '@/types';

interface SatuanForm {
  id: string;
  namaSatuan: string;
  konversi: number;
  harga1: number;
  harga2: number;
  harga3: number;
  harga4: number;
  isDefault: boolean;
}

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: ProdukWithDetails | null;
}

const DEMO_CABANG_ID = 'demo-cabang-001';

export function ProductFormDialog({ open, onClose, onSuccess, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  
  // Form state
  const [barcode, setBarcode] = useState('');
  const [nama, setNama] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [hargaModal, setHargaModal] = useState(0);
  const [satuanDasar, setSatuanDasar] = useState('');
  const [stokAwal, setStokAwal] = useState(0);
  const [stokMinimum, setStokMinimum] = useState(0);
  const [satuan, setSatuan] = useState<SatuanForm[]>([]);
  
  // New category dialog
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Fetch categories
  const { data: kategoris } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const createCategoryMutation = useCreateCategory();

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      setBarcode(product.barcode || '');
      setNama(product.nama);
      setKategoriId(product.kategoriId || '');
      setHargaModal(product.hargaModal);
      setSatuanDasar(product.satuanDasar);
      setStokAwal(product.stok?.[0]?.jumlah || 0);
      setStokMinimum(product.stok?.[0]?.stokMinimum || 0);
      setSatuan(
        product.produkSatuan?.map((s) => ({
          id: s.id,
          namaSatuan: s.namaSatuan,
          konversi: s.konversi,
          harga1: s.harga1,
          harga2: s.harga2,
          harga3: s.harga3,
          harga4: s.harga4,
          isDefault: s.isDefault,
        })) || []
      );
    } else {
      resetForm();
    }
  }, [product, open]);

  const resetForm = () => {
    setBarcode('');
    setNama('');
    setKategoriId('');
    setHargaModal(0);
    setSatuanDasar('');
    setStokAwal(0);
    setStokMinimum(0);
    setSatuan([
      {
        id: `new-${Date.now()}`,
        namaSatuan: '',
        konversi: 1,
        harga1: 0,
        harga2: 0,
        harga3: 0,
        harga4: 0,
        isDefault: true,
      },
    ]);
  };

  const handleAddSatuan = () => {
    setSatuan([
      ...satuan,
      {
        id: `new-${Date.now()}`,
        namaSatuan: '',
        konversi: 1,
        harga1: 0,
        harga2: 0,
        harga3: 0,
        harga4: 0,
        isDefault: false,
      },
    ]);
  };

  const handleRemoveSatuan = (index: number) => {
    if (satuan.length <= 1) {
      toast.error('Minimal harus ada 1 satuan');
      return;
    }
    
    const newSatuan = satuan.filter((_, i) => i !== index);
    
    // If removed satuan was default, set first one as default
    if (satuan[index].isDefault && newSatuan.length > 0) {
      newSatuan[0].isDefault = true;
    }
    
    setSatuan(newSatuan);
  };

  const handleSatuanChange = (index: number, field: keyof SatuanForm, value: string | number | boolean) => {
    const newSatuan = [...satuan];
    
    if (field === 'isDefault' && value === true) {
      // Only one can be default
      newSatuan.forEach((s, i) => {
        s.isDefault = i === index;
      });
    } else {
      // Type-safe assignment
      const item = newSatuan[index];
      switch (field) {
        case 'namaSatuan':
          item.namaSatuan = value as string;
          break;
        case 'konversi':
        case 'harga1':
        case 'harga2':
        case 'harga3':
        case 'harga4':
          item[field] = value as number;
          break;
        case 'isDefault':
          item.isDefault = value as boolean;
          break;
      }
    }
    
    // Auto-set satuanDasar from first satuan with konversi 1
    if (field === 'namaSatuan' || field === 'konversi') {
      const baseSatuan = newSatuan.find((s) => s.konversi === 1);
      if (baseSatuan) {
        setSatuanDasar(baseSatuan.namaSatuan);
      }
    }
    
    setSatuan(newSatuan);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const result = await createCategoryMutation.mutateAsync({ nama: newCategoryName.trim() });
      setKategoriId(result.id);
      setNewCategoryName('');
      setShowNewCategory(false);
      toast.success('Kategori berhasil ditambahkan');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambah kategori');
    }
  };

  const validateForm = (): boolean => {
    if (!nama.trim()) {
      toast.error('Nama produk harus diisi');
      return false;
    }
    
    if (satuan.length === 0) {
      toast.error('Minimal harus ada 1 satuan');
      return false;
    }
    
    for (let i = 0; i < satuan.length; i++) {
      const s = satuan[i];
      if (!s.namaSatuan.trim()) {
        toast.error(`Nama satuan ke-${i + 1} harus diisi`);
        return false;
      }
      if (s.konversi <= 0) {
        toast.error(`Konversi satuan ${s.namaSatuan} harus lebih dari 0`);
        return false;
      }
      if (s.harga1 <= 0) {
        toast.error(`Harga eceran satuan ${s.namaSatuan} harus diisi`);
        return false;
      }
    }
    
    // Check for duplicate satuan names
    const satuanNames = satuan.map((s) => s.namaSatuan.toLowerCase());
    const uniqueNames = new Set(satuanNames);
    if (uniqueNames.size !== satuanNames.length) {
      toast.error('Nama satuan tidak boleh duplikat');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const baseSatuan = satuan.find((s) => s.konversi === 1) || satuan[0];
    
    const data = {
      barcode: barcode.trim() || null,
      nama: nama.trim(),
      kategoriId: kategoriId || null,
      hargaModal,
      satuanDasar: baseSatuan.namaSatuan,
      cabangId: DEMO_CABANG_ID,
      stokAwal,
      stokMinimum,
      satuan: satuan.map((s) => ({
        namaSatuan: s.namaSatuan.toLowerCase(),
        konversi: s.konversi,
        harga1: s.harga1,
        harga2: s.harga2 || s.harga1,
        harga3: s.harga3 || s.harga2 || s.harga1,
        harga4: s.harga4 || s.harga3 || s.harga2 || s.harga1,
        isDefault: s.isDefault,
      })),
    };
    
    try {
      if (isEdit && product) {
        await updateProductMutation.mutateAsync({ id: product.id, ...data });
        toast.success('Produk berhasil diperbarui');
      } else {
        await createProductMutation.mutateAsync(data);
        toast.success('Produk berhasil ditambahkan');
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan produk');
    }
  };

  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl my-8 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan atau ketik barcode"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama produk"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <div className="flex gap-2">
                  <select
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                  >
                    <option value="">Pilih kategori</option>
                    {kategoris?.map((kat) => (
                      <option key={kat.id} value={kat.id}>
                        {kat.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Tambah kategori baru"
                  >
                    <Plus className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Modal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={hargaModal || ''}
                    onChange={(e) => setHargaModal(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Stock (only for new product) */}
            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    value={stokAwal || ''}
                    onChange={(e) => setStokAwal(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    value={stokMinimum || ''}
                    onChange={(e) => setStokMinimum(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Satuan & Harga */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Satuan & Harga <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSatuan}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Satuan
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase">
                  <div className="col-span-2">Satuan</div>
                  <div className="col-span-1">Konversi</div>
                  <div className="col-span-2">H1 Eceran</div>
                  <div className="col-span-2">H2 Grosir</div>
                  <div className="col-span-2">H3 Reseller</div>
                  <div className="col-span-2">H4 Distributor</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-200">
                  {satuan.map((s, index) => (
                    <div key={s.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                      {/* Satuan Name */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={s.namaSatuan}
                            onChange={(e) => handleSatuanChange(index, 'namaSatuan', e.target.value)}
                            placeholder="pcs"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                            <input
                              type="radio"
                              checked={s.isDefault}
                              onChange={() => handleSatuanChange(index, 'isDefault', true)}
                              className="w-3 h-3 text-primary"
                            />
                            Default
                          </label>
                        </div>
                      </div>

                      {/* Konversi */}
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={s.konversi || ''}
                          onChange={(e) => handleSatuanChange(index, 'konversi', Number(e.target.value))}
                          placeholder="1"
                          min="1"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center"
                        />
                      </div>

                      {/* Harga 1 */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={s.harga1 || ''}
                          onChange={(e) => handleSatuanChange(index, 'harga1', Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                        />
                      </div>

                      {/* Harga 2 */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={s.harga2 || ''}
                          onChange={(e) => handleSatuanChange(index, 'harga2', Number(e.target.value))}
                          placeholder={s.harga1 ? String(s.harga1) : '0'}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                        />
                      </div>

                      {/* Harga 3 */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={s.harga3 || ''}
                          onChange={(e) => handleSatuanChange(index, 'harga3', Number(e.target.value))}
                          placeholder={s.harga2 ? String(s.harga2) : s.harga1 ? String(s.harga1) : '0'}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                        />
                      </div>

                      {/* Harga 4 */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={s.harga4 || ''}
                          onChange={(e) => handleSatuanChange(index, 'harga4', Number(e.target.value))}
                          placeholder={s.harga3 ? String(s.harga3) : s.harga2 ? String(s.harga2) : s.harga1 ? String(s.harga1) : '0'}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveSatuan(index)}
                          disabled={satuan.length <= 1}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Satuan dengan konversi 1 akan menjadi satuan dasar. Contoh: 1 dos = 40 pcs, maka konversi dos = 40.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </div>
      </div>

      {/* New Category Dialog */}
      {showNewCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowNewCategory(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Kategori Baru</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewCategory(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50"
              >
                {createCategoryMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

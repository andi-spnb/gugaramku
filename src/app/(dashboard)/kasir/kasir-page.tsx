'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Package, ShoppingCart, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriceLevelSelector } from '@/components/kasir/price-level-selector';
import { ProductSearch } from '@/components/kasir/product-search';
import { UnitSelectionDialog } from '@/components/kasir/unit-selection-dialog';
import { CartDrawer, CartTriggerButton } from '@/components/kasir/cart-drawer';
import { PaymentDialog } from '@/components/kasir/payment-dialog';
import { QuickSaleDialog } from '@/components/kasir/quick-sale-dialog';
import type { QuickSaleItem } from '@/components/kasir/quick-sale-dialog';
import { ItemDiscountDialog } from '@/components/kasir/item-discount-dialog';
import type { ItemDiscountData } from '@/components/kasir/item-discount-dialog';
import { TotalDiscountDialog } from '@/components/kasir/total-discount-dialog';
import type { TotalDiscountData } from '@/components/kasir/total-discount-dialog';
import { HoldListDialog } from '@/components/kasir/hold-list-dialog';
import {
  enqueueTransaction,
  getPendingTransactions,
  removePendingTransaction,
  type PendingTransaction,
} from '@/lib/offline/queue';
import { ReceiptDialog, type ReceiptData } from '@/components/kasir/receipt-dialog';
import { CameraScanDialog } from '@/components/kasir/camera-scan-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import { getPriceByLevel, getPriceLevelConfig } from '@/lib/constants/price-levels';
import {
  useCreateTransaction,
  useHoldTransaction,
  useHeldTransactions,
  useDeleteHeldTransaction,
  useSettings,
  usePriceLevels,
} from '@/hooks/use-api';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { getProductByBarcode } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-auth';
import type { CartItem, CartItemUnit, ProdukWithDetails, ProdukSatuan, MetodeBayar, TransaksiWithDetails } from '@/types';

/** Fallback bila /api/pengaturan-harga belum bisa dimuat. */
const FALLBACK_PRICE_LEVELS = [
  { tingkat: 1, nama: 'Eceran', warna: '#3498db' },
  { tingkat: 2, nama: 'Grosir', warna: '#27ae60' },
  { tingkat: 3, nama: 'Reseller', warna: '#f39c12' },
  { tingkat: 4, nama: 'Distributor', warna: '#9b59b6' },
];

export function KasirPage() {
  // Session user
  const { user } = useCurrentUser();
  const CABANG_ID = user?.cabangId || '';

  // State
  const [tingkatHarga, setTingkatHarga] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [diskonTotal, setDiskonTotal] = useState(0);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isItemDiscountOpen, setIsItemDiscountOpen] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  const [isTotalDiscountOpen, setIsTotalDiscountOpen] = useState(false);

  // Produk yang sedang dipilih: tampilkan dialog satuan sebelum masuk keranjang
  const [productForUnit, setProductForUnit] = useState<ProdukWithDetails | null>(null);

  /**
   * Halaman kasir dibuka dengan daftar produk penuh (tanpa keranjang).
   * Keranjang baru muncul setelah produk pertama masuk, lalu kasir bisa
   * bolak-balik antara daftar produk dan keranjang.
   */
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hasAutoOpenedRef = useRef(false);
  const prevCartCountRef = useRef(0);

  useEffect(() => {
    const count = cartItems.length;
    // Kosong -> ada isi: tampilkan keranjang (sekali per sesi keranjang)
    if (prevCartCountRef.current === 0 && count > 0 && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      setIsCartOpen(true);
    }
    // Keranjang dikosongkan: kembali ke daftar produk penuh
    if (count === 0) {
      hasAutoOpenedRef.current = false;
      setIsCartOpen(false);
    }
    prevCartCountRef.current = count;
  }, [cartItems.length]);

  const [isConfirmChangeLevelOpen, setIsConfirmChangeLevelOpen] = useState(false);
  const [pendingTingkatHarga, setPendingTingkatHarga] = useState<number | null>(null);
  const [isHoldListOpen, setIsHoldListOpen] = useState(false);
  const [pendingOffline, setPendingOffline] = useState<PendingTransaction[]>([]);
  const [isRetryingPending, setIsRetryingPending] = useState(false);

  // Guard anti double-submit: mencegah transaksi ganda bila tombol tertekan 2x / Enter dobel
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    getPendingTransactions().then(setPendingOffline).catch(() => undefined);
  }, []);

  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  // API Mutation
  const createTransactionMutation = useCreateTransaction();
  const holdTransactionMutation = useHoldTransaction();
  const deleteHeldTransactionMutation = useDeleteHeldTransaction();
  const { data: heldTransactions = [], isLoading: isHeldLoading } = useHeldTransactions(CABANG_ID);
  const { data: storeSettings } = useSettings();
  const { data: dbPriceLevels } = usePriceLevels();

  // Tingkatan harga dari DB, fallback ke konstanta bila gagal
  const priceLevels = useMemo(() => {
    if (dbPriceLevels && dbPriceLevels.length > 0) {
      return dbPriceLevels.map((l) => {
        const fallback = getPriceLevelConfig(l.tingkat);
        return {
          tingkat: l.tingkat,
          nama: l.nama,
          warna: l.warna || fallback?.warna || '#3b82f6',
        };
      });
    }
    return FALLBACK_PRICE_LEVELS;
  }, [dbPriceLevels]);

  const activeLevel = priceLevels.find((l) => l.tingkat === tingkatHarga);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - diskonTotal);

  // ============================================================
  // STOK: qty tersedia per item dihitung dari stok cabang / konversi
  // ============================================================
  const getMaxQty = useCallback(
    (item: CartItem): number | undefined => {
      // undefined = tanpa batas (quick sale / stok tidak diketahui)
      if (item.stokTersedia === undefined || item.stokTersedia === null) return undefined;
      if (item.stokTersedia < 0) return undefined;
      const konversi = item.konversi || 1;
      return Math.floor(item.stokTersedia / konversi);
    },
    []
  );

  // Info stok untuk grid produk (total stok + sudah di keranjang)
  const getStockInfo = useCallback(
    (produk: ProdukWithDetails) => {
      const stockRow = CABANG_ID
        ? produk.stok?.find((s) => s.cabangId === CABANG_ID)
        : produk.stok?.[0];
      const totalStok = stockRow ? Number(stockRow.jumlah) : 0;
      const inCart = cartItems
        .filter((i) => i.produkId === produk.id)
        .reduce((sum, i) => sum + i.jumlah * (i.konversi || 1), 0);
      return { total: totalStok, inCart };
    },
    [CABANG_ID, cartItems]
  );

  // ============================================================
  // DISKON: selalu dijaga agar tidak melebihi subtotal
  // ============================================================
  // Saat item berubah, diskon total bisa jadi melebihi subtotal baru.
  useEffect(() => {
    if (diskonTotal > subtotal) {
      setDiskonTotal(subtotal);
    }
  }, [subtotal, diskonTotal]);

  // Handle price level change: hanya set DEFAULT untuk produk yang ditambahkan
  // berikutnya. Item yang sudah di keranjang mempertahankan levelnya masing-masing
  // (bisa beda-beda dalam satu transaksi, diubah lewat dropdown di tiap item).
  const handlePriceLevelChange = useCallback(
    (newLevel: number) => {
      setTingkatHarga(newLevel);
    },
    []
  );

  // Ganti tingkat harga untuk SATU item di keranjang
  const handleItemPriceLevelChange = useCallback((itemId: string, tingkat: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) return item;
        const unit = item.availableUnits?.find((u) => u.id === item.produkSatuanId);
        const newHarga = unit ? getPriceByLevel(unit, tingkat) : item.hargaJual;
        const maxDiskon = item.jumlah * newHarga;
        const newDiskon = Math.min(item.diskon, maxDiskon);
        return {
          ...item,
          tingkatHarga: tingkat,
          hargaJual: newHarga,
          diskon: newDiskon,
          subtotal: maxDiskon - newDiskon,
        };
      })
    );
  }, []);

  // Helper: harga item berdasarkan tingkat dari daftar satuan asli produk
  const getPriceFromItem = useCallback((item: CartItem, level: number): number => {
    const unit = item.availableUnits?.find((u) => u.id === item.produkSatuanId);
    if (!unit) return item.hargaJual; // quick sale: harga tetap
    return getPriceByLevel(unit, level);
  }, []);

  // Confirm price level change
  const confirmPriceLevelChange = useCallback(() => {
    if (pendingTingkatHarga === null) return;

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const newHarga = getPriceFromItem(item, pendingTingkatHarga);
        // Diskon per item juga dibatasi agar tidak melebihi harga baru x qty
        const maxDiskon = item.jumlah * newHarga;
        const newDiskon = Math.min(item.diskon, maxDiskon);
        return {
          ...item,
          hargaJual: newHarga,
          diskon: newDiskon,
          subtotal: maxDiskon - newDiskon,
        };
      })
    );

    const levelName = priceLevels.find((l) => l.tingkat === pendingTingkatHarga)?.nama;
    setTingkatHarga(pendingTingkatHarga);
    setPendingTingkatHarga(null);
    setIsConfirmChangeLevelOpen(false);

    toast.success(`Tingkat harga diubah ke ${levelName}`, { duration: 1500 });
  }, [pendingTingkatHarga, getPriceFromItem, priceLevels]);

  // Add product to cart (dengan validasi stok)
  const handleAddProduct = useCallback(
    (produk: ProdukWithDetails, satuan: ProdukSatuan, jumlah: number = 1) => {
      const hargaJual = getPriceByLevel(satuan, tingkatHarga);
      const konversi = Number(satuan.konversi) || 1;

      const stockRow = CABANG_ID
        ? produk.stok?.find((s) => s.cabangId === CABANG_ID)
        : produk.stok?.[0];
      const stokTersedia = stockRow ? Number(stockRow.jumlah) : undefined;

      // Total qty (dalam satuan dasar) yang sudah ada di keranjang untuk produk ini
      const qtyInCartBase = cartItems
        .filter((item) => item.produkId === produk.id)
        .reduce((sum, item) => sum + item.jumlah * (item.konversi || 1), 0);

      const neededBase = jumlah * konversi;

      if (stokTersedia !== undefined && qtyInCartBase + neededBase > stokTersedia) {
        const sisaBase = Math.max(0, stokTersedia - qtyInCartBase);
        const sisaSatuan = Math.floor(sisaBase / konversi);
        if (sisaSatuan <= 0) {
          toast.error(`Stok ${produk.nama} tidak cukup. Sisa ${sisaBase} ${produk.satuanDasar}.`, {
            duration: 2500,
          });
          return;
        }
        toast.warning(
          `Stok ${produk.nama} hanya sisa ${sisaSatuan} ${satuan.namaSatuan}. Jumlah disesuaikan.`,
          { duration: 2500 }
        );
        jumlah = sisaSatuan;
      }

      const existingIndex = cartItems.findIndex(
        (item) => item.produkId === produk.id && item.produkSatuanId === satuan.id
      );

      const availableUnits: CartItemUnit[] = (produk.produkSatuan || []).map((s) => ({
        id: s.id,
        namaSatuan: s.namaSatuan,
        konversi: Number(s.konversi),
        harga1: Number(s.harga1),
        harga2: Number(s.harga2),
        harga3: Number(s.harga3),
        harga4: Number(s.harga4),
      }));

      if (existingIndex > -1) {
        setCartItems((prevItems) =>
          prevItems.map((item, index) => {
            if (index !== existingIndex) return item;
            const newJumlah = item.jumlah + jumlah;
            return {
              ...item,
              jumlah: newJumlah,
              subtotal: newJumlah * item.hargaJual - item.diskon,
            };
          })
        );
      } else {
        const newItem: CartItem = {
          id: generateUUID(),
          produkId: produk.id,
          produkSatuanId: satuan.id,
          nama: produk.nama,
          barcode: produk.barcode,
          satuan: satuan.namaSatuan,
          konversi,
          jumlah,
          hargaModal: Number(produk.hargaModal),
          hargaJual,
          diskon: 0,
          subtotal: jumlah * hargaJual,
          // undefined = stok tidak diketahui (tanpa batas); angka = batas qty dasar
          stokTersedia,
          availableUnits,
          tingkatHarga,
        };
        setCartItems((prevItems) => [...prevItems, newItem]);
      }

      toast.success(`${produk.nama} ditambahkan`, { duration: 1200 });
    },
    [cartItems, tingkatHarga, CABANG_ID]
  );

  // Handle barcode scanned (dari alat scanner fisik atau kamera)
  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      const kode = barcode.trim();
      if (!kode) return;

      try {
        const response = await getProductByBarcode(kode);
        const produk = response.data;

        if (!produk) {
          toast.error(`Produk dengan barcode "${kode}" tidak ditemukan`, { duration: 2500 });
          return;
        }

        const defaultSatuan =
          produk.produkSatuan?.find((s) => s.isDefault) || produk.produkSatuan?.[0];

        if (!defaultSatuan) {
          toast.error(`Produk "${produk.nama}" belum memiliki satuan/harga`);
          return;
        }

        handleAddProduct(produk, defaultSatuan, 1);
      } catch {
        toast.error('Gagal mencari produk berdasarkan barcode');
      }
    },
    [handleAddProduct]
  );

  // Global listener untuk alat scanner barcode fisik (keyboard wedge)
  useBarcodeScanner(handleBarcodeScanned, { enabled: !isCameraScanOpen });

  // Remove item from cart
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const idx = cartItems.findIndex((i) => i.id === itemId);
      if (idx === -1) return;
      const removed = cartItems[idx];
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      // Toleran error: tawarkan Undo selama beberapa detik
      toast.info(`${removed.nama} dihapus dari keranjang`, {
        duration: 4000,
        action: {
          label: 'Undo',
          onClick: () => {
            setCartItems((prev) => {
              if (prev.some((i) => i.id === itemId)) return prev;
              const next = [...prev];
              next.splice(Math.min(idx, next.length), 0, removed);
              return next;
            });
          },
        },
      });
    },
    [cartItems]
  );

  // Update cart item quantity (validasi stok)
  const handleUpdateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        handleRemoveItem(itemId);
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== itemId) return item;
          const maxQty = getMaxQty(item);
          if (maxQty !== undefined && newQuantity > maxQty) {
            toast.warning(`Maksimal ${maxQty} ${item.satuan} untuk ${item.nama}`, { duration: 2000 });
            newQuantity = maxQty;
          }
          const maxSubtotal = newQuantity * item.hargaJual;
          const newDiskon = Math.min(item.diskon, maxSubtotal);
          return {
            ...item,
            jumlah: newQuantity,
            diskon: newDiskon,
            subtotal: maxSubtotal - newDiskon,
          };
        })
      );
    },
    [handleRemoveItem, getMaxQty]
  );

  // Change item unit
  const handleChangeUnit = useCallback(
    (itemId: string, newUnit: CartItemUnit) => {
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== itemId) return item;

          const newHarga = getPriceByLevel(newUnit, tingkatHarga);

          // Batasi qty dengan stok jika diketahui (stok dalam satuan dasar / konversi baru)
          let newJumlah = item.jumlah;
          if (item.stokTersedia !== undefined && item.stokTersedia >= 0) {
            const maxQty = Math.floor(item.stokTersedia / (newUnit.konversi || 1));
            if (maxQty <= 0) {
              toast.error(`Stok tidak cukup untuk satuan ${newUnit.namaSatuan}`, { duration: 2000 });
              return item;
            }
            if (newJumlah > maxQty) {
              toast.warning(`Jumlah disesuaikan ke ${maxQty} ${newUnit.namaSatuan}`, { duration: 2000 });
              newJumlah = maxQty;
            }
          }

          const maxSubtotal = newJumlah * newHarga;
          const newDiskon = Math.min(item.diskon, maxSubtotal);

          return {
            ...item,
            produkSatuanId: newUnit.id,
            satuan: newUnit.namaSatuan,
            konversi: newUnit.konversi,
            hargaJual: newHarga,
            jumlah: newJumlah,
            diskon: newDiskon,
            subtotal: maxSubtotal - newDiskon,
          };
        })
      );
    },
    [tingkatHarga]
  );

  // Clear cart (konfirmasi bila ada isi berharga)
  const doClearCart = useCallback(() => {
    setCartItems([]);
    setDiskonTotal(0);
    toast.info('Keranjang dikosongkan', { duration: 1500 });
  }, []);

  const handleClearCart = useCallback(() => {
    if (cartItems.length === 0) return;
    if (cartItems.length > 2 || cartItems.some((i) => i.diskon > 0) || diskonTotal > 0) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    doClearCart();
  }, [cartItems, diskonTotal, doClearCart]);

  // Handle Quick Sale
  const handleQuickSale = useCallback((item: QuickSaleItem) => {
    const newItem: CartItem = {
      id: generateUUID(),
      produkId: `qs-${generateUUID()}`,
      produkSatuanId: `qs-${generateUUID()}`,
      nama: item.nama,
      barcode: null,
      satuan: item.satuan,
      konversi: 1,
      jumlah: item.jumlah,
      hargaModal: 0,
      hargaJual: item.harga,
      diskon: 0,
      subtotal: item.jumlah * item.harga,
      stokTersedia: -1, // -1 = quick sale, tanpa cek stok
      availableUnits: [],
    };

    setCartItems((prevItems) => [...prevItems, newItem]);
    setIsQuickSaleOpen(false);
    toast.success(`${item.nama} ditambahkan`, { duration: 1200 });
  }, []);

  // Open item discount dialog
  const handleEditDiscount = useCallback((item: CartItem) => {
    setSelectedItemForDiscount(item);
    setIsItemDiscountOpen(true);
  }, []);

  // Apply item discount
  const handleApplyItemDiscount = useCallback(
    (discountData: ItemDiscountData) => {
      if (!selectedItemForDiscount) return;

      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== selectedItemForDiscount.id) return item;
          const subtotalBeforeDiscount = item.hargaJual * item.jumlah;
          const newDiskon = Math.min(discountData.calculatedDiscount, subtotalBeforeDiscount);
          return {
            ...item,
            diskon: newDiskon,
            subtotal: subtotalBeforeDiscount - newDiskon,
          };
        })
      );

      const nama = selectedItemForDiscount.nama;
      setIsItemDiscountOpen(false);
      setSelectedItemForDiscount(null);

      toast.success(
        discountData.calculatedDiscount > 0 ? `Diskon diterapkan pada ${nama}` : `Diskon dihapus dari ${nama}`,
        { duration: 1500 }
      );
    },
    [selectedItemForDiscount]
  );

  // Apply total discount (dibatasi subtotal agar total tidak negatif)
  const handleApplyTotalDiscount = useCallback(
    (discountData: TotalDiscountData) => {
      const capped = Math.min(discountData.calculatedDiscount, subtotal);
      let finalDiscount = capped;
      // Jangan sampai diskon total + diskon item melebihi subtotal
      const maxTotalDiscount = subtotal;
      if (finalDiscount > maxTotalDiscount) finalDiscount = maxTotalDiscount;

      setDiskonTotal(finalDiscount);
      setIsTotalDiscountOpen(false);

      if (finalDiscount < discountData.calculatedDiscount) {
        toast.warning('Diskon total dibatasi sesuai subtotal', { duration: 2000 });
      } else if (discountData.calculatedDiscount > 0) {
        toast.success('Diskon total diterapkan', { duration: 1500 });
      } else {
        toast.info('Diskon total dihapus', { duration: 1500 });
      }
    },
    [subtotal]
  );

  // Process payment (dengan guard anti transaksi ganda)
  const handlePayment = useCallback(
    async (paymentData: { metodeBayar: string; jumlahBayar: number }) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const transactionData = {
        tingkatHarga,
        metodeBayar: paymentData.metodeBayar as MetodeBayar,
        jumlahBayar: paymentData.jumlahBayar,
        diskonTotal,
        items: cartItems.map((item) => ({
          produkId: item.produkId.startsWith('qs-') ? null : item.produkId,
          produkSatuanId: item.produkSatuanId.startsWith('qs-') ? null : item.produkSatuanId,
          namaBarang: item.nama,
          barcode: item.barcode,
          jumlah: item.jumlah,
          satuan: item.satuan,
          konversi: item.konversi,
          hargaModal: item.hargaModal,
          hargaJual: item.hargaJual,
          diskon: item.diskon,
          isQuickSale: item.produkId.startsWith('qs-'),
        })),
      };

      // Snapshot untuk struk (cart dikosongkan setelah sukses)
      const receiptSnapshot = cartItems.map((item) => ({
        namaBarang: item.nama,
        jumlah: item.jumlah,
        satuan: item.satuan,
        hargaJual: item.hargaJual,
        diskon: item.diskon,
        subtotal: item.subtotal,
      }));
      const paymentTotal = total;
      const paymentSubtotal = subtotal;
      const paymentDiskon = diskonTotal;

      try {
        const result = await createTransactionMutation.mutateAsync(transactionData);

        setLastReceipt({
          nomor: result.nomor,
          tanggal: new Date(),
          items: receiptSnapshot,
          subtotal: paymentSubtotal,
          diskon: paymentDiskon,
          total: paymentTotal,
          metodeBayar: paymentData.metodeBayar,
          jumlahBayar: paymentData.jumlahBayar,
          kembalian: Math.max(0, paymentData.jumlahBayar - paymentTotal),
          kasirNama: user?.name || null,
        });
        setIsReceiptOpen(true);

        toast.success(`Transaksi ${result.nomor} berhasil`, { duration: 2000 });

        setCartItems([]);
        setDiskonTotal(0);
        setIsPaymentOpen(false);
      } catch (error) {
        console.error('Transaction API error:', error);
        try {
          await enqueueTransaction({
            payload: transactionData,
            itemCount: cartItems.length,
            total: paymentTotal,
          });
          const queue = await getPendingTransactions();
          setPendingOffline(queue);
          toast.error(
            `Gagal menyimpan transaksi. Tersimpan offline (${queue.length} menunggu). Kirim ulang saat koneksi pulih.`,
            { duration: 3500 }
          );
          setCartItems([]);
          setDiskonTotal(0);
        } catch (offlineError) {
          console.error('Offline queue error:', offlineError);
          toast.error(
            'Gagal menyimpan transaksi. Keranjang tetap ada, coba bayar ulang atau periksa koneksi.',
            { duration: 3500 }
          );
        }
        setIsPaymentOpen(false);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [
      tingkatHarga,
      cartItems,
      diskonTotal,
      subtotal,
      total,
      createTransactionMutation,
      user,
    ]
  );

  // Coba kirim ulang semua transaksi offline
  const handleRetryPending = useCallback(async () => {
    if (pendingOffline.length === 0 || isRetryingPending) return;
    setIsRetryingPending(true);

    try {
      let berhasil = 0;
      for (const pending of pendingOffline) {
        try {
          await createTransactionMutation.mutateAsync(
            pending.payload as unknown as Parameters<typeof createTransactionMutation.mutateAsync>[0]
          );
          await removePendingTransaction(pending.id!);
          berhasil += 1;
        } catch (error) {
          console.error('Retry gagal untuk transaksi offline:', error);
          break;
        }
      }
      const queue = await getPendingTransactions();
      setPendingOffline(queue);

      if (berhasil > 0) {
        toast.success(`${berhasil} transaksi offline berhasil dikirim.`);
      } else {
        toast.error('Masih gagal mengirim transaksi offline. Coba lagi nanti.');
      }
    } finally {
      setIsRetryingPending(false);
    }
  }, [pendingOffline, isRetryingPending, createTransactionMutation]);

  // Hold transaction (simpan sementara)
  const handleHoldTransaction = useCallback(async () => {
    if (cartItems.length === 0) return;

    try {
      await holdTransactionMutation.mutateAsync({
        tingkatHarga,
        diskonTotal,
        items: cartItems.map((item) => ({
          produkId: item.produkId.startsWith('qs-') ? null : item.produkId,
          produkSatuanId: item.produkSatuanId.startsWith('qs-') ? null : item.produkSatuanId,
          namaBarang: item.nama,
          barcode: item.barcode,
          jumlah: item.jumlah,
          satuan: item.satuan,
          konversi: item.konversi,
          hargaModal: item.hargaModal,
          hargaJual: item.hargaJual,
          diskon: item.diskon,
          isQuickSale: item.produkId.startsWith('qs-'),
        })),
      });

      toast.success('Transaksi ditahan. Bisa dilanjutkan nanti.');
      setCartItems([]);
      setDiskonTotal(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menahan transaksi');
    }
  }, [cartItems, tingkatHarga, diskonTotal, holdTransactionMutation]);

  // Shortcut keyboard kasir: F8 = bayar/checkout, F9 = hold transaksi.
  // (F10 tutup shift belum ada fiturnya; F1-F4 dilepas karena konflik browser.)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0 && !isPaymentOpen && !isConfirmDiscardOpen) {
          setIsPaymentOpen(true);
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        void handleHoldTransaction();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cartItems.length, isPaymentOpen, isConfirmDiscardOpen, handleHoldTransaction]);

  // Resume held transaction
  const handleResumeTransaction = useCallback(
    (trx: TransaksiWithDetails) => {
      const restoredItems: CartItem[] = trx.detailTransaksi.map((d) => {
        // Satuan lain tidak ikut tersimpan di transaksi tertahan, jadi satuan utama
        // tetap bisa dipakai tapi dropdown satuan dinonaktifkan (1 satuan).
        const unit: CartItemUnit | null =
          d.produkSatuanId && d.produkId
            ? {
                id: d.produkSatuanId,
                namaSatuan: d.satuan,
                konversi: Number(d.konversi),
                harga1: Number(d.hargaJual),
                harga2: Number(d.hargaJual),
                harga3: Number(d.hargaJual),
                harga4: Number(d.hargaJual),
              }
            : null;
        return {
          id: generateUUID(),
          produkId: d.produkId || `qs-${generateUUID()}`,
          produkSatuanId: d.produkSatuanId || `qs-${generateUUID()}`,
          nama: d.namaBarang,
          barcode: d.barcode,
          satuan: d.satuan,
          konversi: Number(d.konversi),
          jumlah: Number(d.jumlah),
          hargaModal: Number(d.hargaModal),
          hargaJual: Number(d.hargaJual),
          diskon: Number(d.diskon),
          subtotal: Number(d.subtotal),
          stokTersedia: -1, // stok diketahui ulang saat transaksi baru dibuat di server
          availableUnits: unit ? [unit] : [],
        };
      });

      setCartItems(restoredItems);
      setTingkatHarga(trx.tingkatHarga);
      setDiskonTotal(Number(trx.diskon));
      setIsHoldListOpen(false);
      setIsCartOpen(true);

      deleteHeldTransactionMutation.mutateAsync(trx.id).catch(() => {
        // Kalau gagal hapus, tetap lanjut; akan dibersihkan manual
      });

      toast.success(`Transaksi ${trx.nomor} dilanjutkan`);
    },
    [deleteHeldTransactionMutation]
  );

  // Delete held transaction
  const handleDeleteHeld = useCallback(
    async (id: string) => {
      try {
        await deleteHeldTransactionMutation.mutateAsync(id);
        toast.success('Transaksi tertahan dihapus');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal menghapus');
      }
    },
    [deleteHeldTransactionMutation]
  );

  // Tampilan keranjang berganti di antara daftar produk dan keranjang (split view)
  const showCart = isCartOpen;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col">
      {/* Toolbar atas: tingkat harga + akses keranjang */}
      <div className="mb-2 flex shrink-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <PriceLevelSelector
            levels={priceLevels}
            selected={tingkatHarga}
            onChange={handlePriceLevelChange}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm md:flex">
            <Store className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-700">{user?.cabangNama || 'Cabang'}</span>
          </div>
          {!showCart && (
            <CartTriggerButton
              itemCount={cartItems.length}
              total={total}
              onClick={() => setIsCartOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Dialog pilih satuan & jumlah sebelum masuk keranjang */}
      <UnitSelectionDialog
        produk={productForUnit}
        tingkatHarga={tingkatHarga}
        cabangId={CABANG_ID}
        qtyInCartBase={
          productForUnit
            ? cartItems
                .filter((i) => i.produkId === productForUnit.id)
                .reduce((sum, i) => sum + i.jumlah * (i.konversi || 1), 0)
            : 0
        }
        onClose={() => setProductForUnit(null)}
        onConfirm={(satuan, jumlah) => {
          if (productForUnit) {
            handleAddProduct(productForUnit, satuan, jumlah);
          }
          setProductForUnit(null);
        }}
      />

      {/* Area kerja: daftar produk + keranjang */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <ProductSearch
            onSelectProduct={handleAddProduct}
            onOpenProduct={setProductForUnit}
            onQuickSale={() => setIsQuickSaleOpen(true)}
            tingkatHarga={tingkatHarga}
            onCameraScan={() => setIsCameraScanOpen(true)}
            cabangId={CABANG_ID}
            getStockInfo={getStockInfo}
          />
        </div>

        {/* Keranjang: panel kanan di desktop, overlay geser di mobile */}
        <CartDrawer
          open={showCart}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          tingkatHarga={tingkatHarga}
          priceLevelName={activeLevel?.nama || 'Eceran'}
          priceLevelColor={activeLevel?.warna || '#3498db'}
          subtotal={subtotal}
          diskon={diskonTotal}
          total={total}
          getMaxQty={getMaxQty}
          pendingOfflineCount={pendingOffline.length}
          isRetryingPending={isRetryingPending}
          heldCount={heldTransactions.length}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onChangeUnit={handleChangeUnit}
          onEditDiscount={handleEditDiscount}
          onChangeItemPriceLevel={handleItemPriceLevelChange}
          priceLevels={priceLevels}
          onClearCart={handleClearCart}
          onCheckout={() => {
            if (cartItems.length === 0) return;
            setIsPaymentOpen(true);
          }}
          onEditTotalDiscount={() => setIsTotalDiscountOpen(true)}
          onHold={handleHoldTransaction}
          onShowHeld={() => setIsHoldListOpen(true)}
          onRetryPending={handleRetryPending}
        />
      </div>

      {/* Bar bawah mobile: buka keranjang saat tertutup dan sudah ada item */}
      {!showCart && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 text-white"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4" />
              Keranjang ({cartItems.length})
            </span>
            <span className="text-sm font-bold tabular-nums">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)}
            </span>
          </button>
        </div>
      )}

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={total}
        onConfirm={handlePayment}
        settings={storeSettings ?? null}
      />

      {/* Quick Sale Dialog */}
      <QuickSaleDialog
        open={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onConfirm={handleQuickSale}
      />

      {/* Item Discount Dialog */}
      <ItemDiscountDialog
        open={isItemDiscountOpen}
        onClose={() => {
          setIsItemDiscountOpen(false);
          setSelectedItemForDiscount(null);
        }}
        onConfirm={handleApplyItemDiscount}
        itemName={selectedItemForDiscount?.nama || ''}
        itemPrice={selectedItemForDiscount?.hargaJual || 0}
        itemQuantity={selectedItemForDiscount?.jumlah || 0}
        currentDiscount={selectedItemForDiscount?.diskon || 0}
      />

      {/* Total Discount Dialog */}
      <TotalDiscountDialog
        open={isTotalDiscountOpen}
        onClose={() => setIsTotalDiscountOpen(false)}
        onConfirm={handleApplyTotalDiscount}
        subtotal={subtotal}
        currentDiscount={diskonTotal}
      />

      {/* Confirm Price Level Change Dialog */}
      <ConfirmDialog
        open={isConfirmChangeLevelOpen}
        onClose={() => {
          setIsConfirmChangeLevelOpen(false);
          setPendingTingkatHarga(null);
        }}
        onConfirm={confirmPriceLevelChange}
        title="Ganti Tingkatan Harga?"
        description={`Anda akan mengubah tingkatan harga dari ${activeLevel?.nama} ke ${
          priceLevels.find((l) => l.tingkat === pendingTingkatHarga)?.nama
        }. Harga semua item di keranjang akan berubah.`}
        confirmText="Ya, Ganti Harga"
        cancelText="Batal"
        variant="warning"
      />

      {/* Confirm hapus keranjang */}
      <ConfirmDialog
        open={isConfirmDiscardOpen}
        onClose={() => setIsConfirmDiscardOpen(false)}
        onConfirm={() => {
          doClearCart();
          setIsConfirmDiscardOpen(false);
        }}
        title="Kosongkan Keranjang?"
        description={`${cartItems.length} item akan dihapus dari keranjang. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Ya, Kosongkan"
        cancelText="Batal"
        variant="danger"
      />

      {/* Hold List Dialog */}
      <HoldListDialog
        open={isHoldListOpen}
        onClose={() => setIsHoldListOpen(false)}
        heldTransactions={heldTransactions}
        isLoading={isHeldLoading}
        onResume={handleResumeTransaction}
        onDelete={handleDeleteHeld}
        isDeleting={deleteHeldTransactionMutation.isPending}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setLastReceipt(null);
        }}
        data={lastReceipt}
        settings={storeSettings ?? null}
      />

      {/* Camera Scan Dialog */}
      <CameraScanDialog
        open={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onScan={(barcode) => {
          setIsCameraScanOpen(false);
          void handleBarcodeScanned(barcode);
        }}
      />
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriceLevelSelector } from '@/components/kasir/price-level-selector';
import { ProductSearch } from '@/components/kasir/product-search';
import { Cart } from '@/components/kasir/cart';
import { CartSummary } from '@/components/kasir/cart-summary';
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
import { getPriceByLevel } from '@/lib/constants/price-levels';
import { useCreateTransaction, useHoldTransaction, useHeldTransactions, useDeleteHeldTransaction, useSettings } from '@/hooks/use-api';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { getProductByBarcode } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-auth';
import type { CartItem, CartItemUnit, ProdukWithDetails, ProdukSatuan, MetodeBayar, TransaksiWithDetails } from '@/types';

// Data dummy untuk demo
const DUMMY_PRICE_LEVELS = [
  { tingkat: 1, nama: 'Eceran', warna: '#3498db' },
  { tingkat: 2, nama: 'Grosir', warna: '#27ae60' },
  { tingkat: 3, nama: 'Reseller', warna: '#f39c12' },
  { tingkat: 4, nama: 'Distributor', warna: '#9b59b6' },
];

// cabangId & kasirId kini diambil dari session user (bukan hardcode demo)

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
  // Mobile view state: 'products' or 'cart'
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const [isConfirmChangeLevelOpen, setIsConfirmChangeLevelOpen] = useState(false);
  const [pendingTingkatHarga, setPendingTingkatHarga] = useState<number | null>(null);
  const [isHoldListOpen, setIsHoldListOpen] = useState(false);
  const [pendingOffline, setPendingOffline] = useState<PendingTransaction[]>([]);
  const [isRetryingPending, setIsRetryingPending] = useState(false);

  // Muat antrean offline saat halaman dibuka
  useEffect(() => {
    getPendingTransactions().then(setPendingOffline).catch(() => undefined);
  }, []);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState(false);

  // API Mutation
  const createTransactionMutation = useCreateTransaction();
  const holdTransactionMutation = useHoldTransaction();
  const deleteHeldTransactionMutation = useDeleteHeldTransaction();
  const { data: heldTransactions = [] } = useHeldTransactions(CABANG_ID);
  const { data: settings } = useSettings();

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - diskonTotal;

  // Handle price level change
  const handlePriceLevelChange = useCallback((newLevel: number) => {
    if (cartItems.length > 0 && newLevel !== tingkatHarga) {
      // Jika keranjang ada isi, tampilkan konfirmasi
      setPendingTingkatHarga(newLevel);
      setIsConfirmChangeLevelOpen(true);
    } else {
      setTingkatHarga(newLevel);
    }
  }, [cartItems.length, tingkatHarga]);

  // Confirm price level change
  const confirmPriceLevelChange = useCallback(() => {
    if (pendingTingkatHarga === null) return;

    // Update semua item di keranjang dengan harga baru
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        // Dapatkan harga baru berdasarkan tingkat
        const newHarga = getPriceFromItem(item, pendingTingkatHarga);
        const newSubtotal = item.jumlah * newHarga - item.diskon;
        
        return {
          ...item,
          hargaJual: newHarga,
          subtotal: newSubtotal,
        };
      })
    );

    setTingkatHarga(pendingTingkatHarga);
    setPendingTingkatHarga(null);
    setIsConfirmChangeLevelOpen(false);
    
    toast.success(`Tingkat harga diubah ke ${DUMMY_PRICE_LEVELS.find(l => l.tingkat === pendingTingkatHarga)?.nama}`);
  }, [pendingTingkatHarga]);

  // Helper: harga item berdasarkan tingkat dari daftar satuan asli produk
  const getPriceFromItem = (item: CartItem, level: number): number => {
    const unit = item.availableUnits?.find((u) => u.id === item.produkSatuanId);
    if (!unit) return item.hargaJual; // quick sale: harga tetap
    return getPriceByLevel(unit, level);
  };

  // Add product to cart
  const handleAddProduct = useCallback((
    produk: ProdukWithDetails,
    satuan: ProdukSatuan,
    jumlah: number = 1
  ) => {
    const hargaJual = getPriceByLevel(satuan, tingkatHarga);
    
    // Cek apakah produk dengan satuan yang sama sudah ada di keranjang
    const existingIndex = cartItems.findIndex(
      (item) => item.produkId === produk.id && item.produkSatuanId === satuan.id
    );

    // Siapkan daftar satuan yang tersedia
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
      // Update quantity
      setCartItems((prevItems) =>
        prevItems.map((item, index) => {
          if (index === existingIndex) {
            const newJumlah = item.jumlah + jumlah;
            return {
              ...item,
              jumlah: newJumlah,
              subtotal: newJumlah * item.hargaJual - item.diskon,
            };
          }
          return item;
        })
      );
    } else {
      // Add new item
      const newItem: CartItem = {
        id: generateUUID(),
        produkId: produk.id,
        produkSatuanId: satuan.id,
        nama: produk.nama,
        barcode: produk.barcode,
        satuan: satuan.namaSatuan,
        konversi: Number(satuan.konversi),
        jumlah,
        hargaModal: Number(produk.hargaModal),
        hargaJual,
        diskon: 0,
        subtotal: jumlah * hargaJual,
        stokTersedia: 100, // TODO: Get actual stock
        availableUnits,
      };

      setCartItems((prevItems) => [...prevItems, newItem]);
    }

    toast.success(`${produk.nama} ditambahkan ke keranjang`);
  }, [cartItems, tingkatHarga]);

  // Handle barcode scanned (dari alat scanner fisik atau kamera)
  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    const kode = barcode.trim();
    if (!kode) return;

    try {
      const response = await getProductByBarcode(kode);
      const produk = response.data;

      if (!produk) {
        toast.error(`Produk dengan barcode "${kode}" tidak ditemukan`);
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
  }, [handleAddProduct]);

  // Global listener untuk alat scanner barcode fisik (keyboard wedge)
  useBarcodeScanner(handleBarcodeScanned, { enabled: !isCameraScanOpen });

  // Remove item from cart
  const handleRemoveItem = useCallback((itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    toast.info('Item dihapus dari keranjang');
  }, []);

  // Update cart item quantity
  const handleUpdateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            jumlah: newQuantity,
            subtotal: newQuantity * item.hargaJual - item.diskon,
          };
        }
        return item;
      })
    );
  }, [handleRemoveItem]);

  // Change item unit
  const handleChangeUnit = useCallback((itemId: string, newUnit: CartItemUnit) => {
    // Dapatkan harga baru berdasarkan tingkat harga saat ini
    const getPrice = (unit: CartItemUnit): number => {
      switch (tingkatHarga) {
        case 1: return unit.harga1;
        case 2: return unit.harga2;
        case 3: return unit.harga3;
        case 4: return unit.harga4;
        default: return unit.harga1;
      }
    };

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          const newHarga = getPrice(newUnit);
          const newSubtotal = item.jumlah * newHarga - item.diskon;
          
          return {
            ...item,
            produkSatuanId: newUnit.id,
            satuan: newUnit.namaSatuan,
            konversi: newUnit.konversi,
            hargaJual: newHarga,
            subtotal: newSubtotal,
          };
        }
        return item;
      })
    );

    toast.success(`Satuan diubah ke ${newUnit.namaSatuan.toUpperCase()}`);
  }, [tingkatHarga]);

  // Clear cart
  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setDiskonTotal(0);
    toast.info('Keranjang dikosongkan');
  }, []);

  // Handle Quick Sale
  const handleQuickSale = useCallback((item: QuickSaleItem) => {
    const newItem: CartItem = {
      id: generateUUID(),
      produkId: `qs-${generateUUID()}`, // ID khusus untuk quick sale
      produkSatuanId: `qs-${generateUUID()}`,
      nama: item.nama,
      barcode: null,
      satuan: item.satuan,
      konversi: 1,
      jumlah: item.jumlah,
      hargaModal: 0, // Quick sale tidak ada harga modal
      hargaJual: item.harga,
      diskon: 0,
      subtotal: item.jumlah * item.harga,
      stokTersedia: 999, // Quick sale tidak cek stok
      availableUnits: [], // Quick sale tidak punya satuan lain
    };

    setCartItems((prevItems) => [...prevItems, newItem]);
    setIsQuickSaleOpen(false);
    toast.success(`${item.nama} ditambahkan ke keranjang`);
  }, []);

  // Open item discount dialog
  const handleEditDiscount = useCallback((item: CartItem) => {
    setSelectedItemForDiscount(item);
    setIsItemDiscountOpen(true);
  }, []);

  // Apply item discount
  const handleApplyItemDiscount = useCallback((discountData: ItemDiscountData) => {
    if (!selectedItemForDiscount) return;

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === selectedItemForDiscount.id) {
          const subtotalBeforeDiscount = item.hargaJual * item.jumlah;
          const newDiskon = discountData.calculatedDiscount;
          const newSubtotal = subtotalBeforeDiscount - newDiskon;

          return {
            ...item,
            diskon: newDiskon,
            subtotal: newSubtotal,
          };
        }
        return item;
      })
    );

    setIsItemDiscountOpen(false);
    setSelectedItemForDiscount(null);

    if (discountData.calculatedDiscount > 0) {
      toast.success(`Diskon diterapkan pada ${selectedItemForDiscount.nama}`);
    } else {
      toast.info(`Diskon dihapus dari ${selectedItemForDiscount.nama}`);
    }
  }, [selectedItemForDiscount]);

  // Apply total discount
  const handleApplyTotalDiscount = useCallback((discountData: TotalDiscountData) => {
    setDiskonTotal(discountData.calculatedDiscount);
    setIsTotalDiscountOpen(false);

    if (discountData.calculatedDiscount > 0) {
      toast.success('Diskon total diterapkan');
    } else {
      toast.info('Diskon total dihapus');
    }
  }, []);

  // Process payment
  const handlePayment = useCallback(async (paymentData: {
    metodeBayar: string;
    jumlahBayar: number;
  }) => {
    // Prepare transaction data (identitas dari session; server memvalidasi ulang)
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

    try {
      // Try to save via API
      const result = await createTransactionMutation.mutateAsync(transactionData);

      // Siapkan data struk
      setLastReceipt({
        nomor: result.nomor,
        tanggal: new Date(),
        items: cartItems.map((item) => ({
          namaBarang: item.nama,
          jumlah: item.jumlah,
          satuan: item.satuan,
          hargaJual: item.hargaJual,
          diskon: item.diskon,
          subtotal: item.subtotal,
        })),
        subtotal,
        diskon: diskonTotal,
        total,
        metodeBayar: paymentData.metodeBayar,
        jumlahBayar: paymentData.jumlahBayar,
        kembalian: Math.max(0, paymentData.jumlahBayar - total),
        kasirNama: user?.name || null,
      });
      setIsReceiptOpen(true);

      toast.success(`Transaksi ${result.nomor} berhasil!`);

      // Reset cart
      setCartItems([]);
      setDiskonTotal(0);
      setIsPaymentOpen(false);
    } catch (error) {
      // API gagal: simpan ke antrean offline (IndexedDB) agar data tidak hilang.
      // Kasir bisa mengirim ulang lewat tombol "Kirim ulang" bila koneksi pulih.
      console.error('Transaction API error:', error);
      try {
        await enqueueTransaction({
          payload: transactionData,
          itemCount: cartItems.length,
          total,
        });
        const queue = await getPendingTransactions();
        setPendingOffline(queue);
        toast.error(
          `Gagal menyimpan transaksi. Tersimpan offline (${queue.length} menunggu kirim). Kirim ulang saat koneksi pulih.`
        );
        // Kosongkan keranjang karena data sudah aman di antrean offline
        setCartItems([]);
        setDiskonTotal(0);
      } catch (offlineError) {
        console.error('Offline queue error:', offlineError);
        toast.error(
          'Gagal menyimpan transaksi. Keranjang tetap ada, coba bayar ulang atau periksa koneksi.'
        );
      }
      setIsPaymentOpen(false);
    }
  }, [tingkatHarga, cartItems, diskonTotal, subtotal, total, createTransactionMutation, user]);

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
          // Berhenti: koneksi/server kemungkinan masih bermasalah
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

  // Resume held transaction: load items back into cart
  const handleResumeTransaction = useCallback((trx: TransaksiWithDetails) => {
    const restoredItems: CartItem[] = trx.detailTransaksi.map((d) => ({
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
      stokTersedia: 999,
      availableUnits: [],
    }));

    setCartItems(restoredItems);
    setTingkatHarga(trx.tingkatHarga);
    setDiskonTotal(Number(trx.diskon));
    setIsHoldListOpen(false);

    // Hapus record hold setelah dilanjutkan (akan dibuat transaksi baru saat bayar)
    deleteHeldTransactionMutation
      .mutateAsync(trx.id)
      .catch(() => {
        // Kalau gagal hapus, tetap lanjut; akan dibersihkan manual
      });

    toast.success(`Transaksi ${trx.nomor} dilanjutkan`);
  }, [deleteHeldTransactionMutation]);

  // Delete held transaction
  const handleDeleteHeld = useCallback(async (id: string) => {
    try {
      await deleteHeldTransactionMutation.mutateAsync(id);
      toast.success('Transaksi tertahan dihapus');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus');
    }
  }, [deleteHeldTransactionMutation]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-14 lg:pb-0">
      {/* Price Level Selector */}
      <div className="mb-4">
        <PriceLevelSelector
          levels={DUMMY_PRICE_LEVELS}
          selected={tingkatHarga}
          onChange={handlePriceLevelChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setMobileView('products')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium border-r border-gray-200',
              mobileView === 'products' ? 'bg-primary/10 text-primary' : 'text-gray-500'
            )}
          >
            <Package />
            Produk
          </button>
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium',
              mobileView === 'cart' ? 'bg-primary/10 text-primary' : 'text-gray-500'
            )}
          >
            <ShoppingCart />
            Keranjang ({cartItems.length})
          </button>
        </div>

        {/* Left Side - Product Search & Selection */}
        <div className={cn('flex-1 flex flex-col min-w-0', mobileView === 'products' ? 'hidden lg:flex' : 'flex')}>
          <ProductSearch 
            onSelectProduct={handleAddProduct}
            onQuickSale={() => setIsQuickSaleOpen(true)}
            tingkatHarga={tingkatHarga}
            onCameraScan={() => setIsCameraScanOpen(true)}
          />
        </div>

        {/* Right Side - Cart */}
        <div className={cn('w-full lg:w-[400px] lg:flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden',
          mobileView === 'cart' ? 'flex' : 'hidden')}>
          {/* Cart Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Keranjang</h2>
              <span className="text-sm text-gray-500">
                {cartItems.length} item
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: DUMMY_PRICE_LEVELS.find(l => l.tingkat === tingkatHarga)?.warna }}
              />
              <span className="text-sm text-gray-600">
                Harga: {DUMMY_PRICE_LEVELS.find(l => l.tingkat === tingkatHarga)?.nama}
              </span>
            </div>
          </div>

          {/* Antrean transaksi offline (IndexedDB) */}
          {pendingOffline.length > 0 && (
            <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
              <div className="text-sm text-amber-900">
                <span className="font-semibold">{pendingOffline.length} transaksi</span> offline
              </div>
              <button
                onClick={handleRetryPending}
                disabled={isRetryingPending}
                className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isRetryingPending ? 'Mengirim...' : 'Kirim ulang'}
              </button>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            <Cart
              items={cartItems}
              tingkatHarga={tingkatHarga}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onChangeUnit={handleChangeUnit}
              onEditDiscount={handleEditDiscount}
            />
          </div>

          {/* Cart Summary & Actions */}
          <CartSummary
            subtotal={subtotal}
            diskon={diskonTotal}
            total={total}
            itemCount={cartItems.length}
            onClearCart={handleClearCart}
            onCheckout={() => setIsPaymentOpen(true)}
            onEditTotalDiscount={() => setIsTotalDiscountOpen(true)}
            onHold={handleHoldTransaction}
            heldCount={heldTransactions.length}
            onShowHeld={() => setIsHoldListOpen(true)}
          />
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={total}
        onConfirm={handlePayment}
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
        description={`Anda akan mengubah tingkatan harga dari ${DUMMY_PRICE_LEVELS.find(l => l.tingkat === tingkatHarga)?.nama} ke ${DUMMY_PRICE_LEVELS.find(l => l.tingkat === pendingTingkatHarga)?.nama}. Harga semua item di keranjang akan berubah.`}
        confirmText="Ya, Ganti Harga"
        cancelText="Batal"
        variant="warning"
      />

      {/* Hold List Dialog */}
      <HoldListDialog
        open={isHoldListOpen}
        onClose={() => setIsHoldListOpen(false)}
        heldTransactions={heldTransactions}
        isLoading={false}
        onResume={handleResumeTransaction}
        onDelete={handleDeleteHeld}
        isDeleting={deleteHeldTransactionMutation.isPending}
      />

      {/* Receipt Dialog (struk setelah pembayaran) */}
      <ReceiptDialog
        open={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setLastReceipt(null);
        }}
        data={lastReceipt}
        settings={settings ?? null}
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

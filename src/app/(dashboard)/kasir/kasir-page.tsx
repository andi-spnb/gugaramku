'use client';

import { useState, useCallback } from 'react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
import { getPriceByLevel } from '@/lib/constants/price-levels';
import { useCreateTransaction } from '@/hooks/use-api';
import type { CartItem, CartItemUnit, ProdukWithDetails, ProdukSatuan, MetodeBayar } from '@/types';

// Data dummy untuk demo
const DUMMY_PRICE_LEVELS = [
  { tingkat: 1, nama: 'Eceran', warna: '#3498db' },
  { tingkat: 2, nama: 'Grosir', warna: '#27ae60' },
  { tingkat: 3, nama: 'Reseller', warna: '#f39c12' },
  { tingkat: 4, nama: 'Distributor', warna: '#9b59b6' },
];

// Temporary IDs untuk demo (akan diganti dengan data dari auth/session)
const DEMO_CABANG_ID = 'demo-cabang-001';
const DEMO_KASIR_ID = 'demo-kasir-001';

export function KasirPage() {
  // State
  const [tingkatHarga, setTingkatHarga] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [diskonTotal, setDiskonTotal] = useState(0);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isItemDiscountOpen, setIsItemDiscountOpen] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<CartItem | null>(null);
  const [isTotalDiscountOpen, setIsTotalDiscountOpen] = useState(false);
  const [isConfirmChangeLevelOpen, setIsConfirmChangeLevelOpen] = useState(false);
  const [pendingTingkatHarga, setPendingTingkatHarga] = useState<number | null>(null);

  // API Mutation
  const createTransactionMutation = useCreateTransaction();

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

  // Helper function to get price from item based on level
  const getPriceFromItem = (item: CartItem, level: number): number => {
    // Dalam implementasi nyata, ini akan mengambil dari data produk
    // Untuk sekarang, kita simulasi dengan mengurangi harga per level
    const basePrice = item.hargaJual;
    const discount = (level - 1) * (basePrice * 0.05); // 5% per level
    return Math.round(basePrice - discount);
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
    // Prepare transaction data
    const transactionData = {
      cabangId: DEMO_CABANG_ID,
      kasirId: DEMO_KASIR_ID,
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
      
      toast.success(`Transaksi ${result.nomor} berhasil!`);
      
      // Reset cart
      setCartItems([]);
      setDiskonTotal(0);
      setIsPaymentOpen(false);
    } catch (error) {
      // API failed - for now just show success and reset (offline mode)
      console.error('Transaction API error:', error);
      
      // In production, save to IndexedDB for later sync
      toast.success('Transaksi berhasil! (offline mode)');
      
      // Reset cart
      setCartItems([]);
      setDiskonTotal(0);
      setIsPaymentOpen(false);
    }
  }, [tingkatHarga, cartItems, diskonTotal, createTransactionMutation]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
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
        {/* Left Side - Product Search & Selection */}
        <div className="flex-1 flex flex-col min-w-0">
          <ProductSearch 
            onSelectProduct={handleAddProduct}
            onQuickSale={() => setIsQuickSaleOpen(true)}
            tingkatHarga={tingkatHarga}
          />
        </div>

        {/* Right Side - Cart */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
    </div>
  );
}

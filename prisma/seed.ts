import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash passwords
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  // 1. Create Cabang (Branch)
  const cabang = await prisma.cabang.upsert({
    where: { kode: 'PST' },
    update: {},
    create: {
      id: 'demo-cabang-001',
      kode: 'PST',
      nama: 'Toko Pusat',
      alamat: 'Jl. Raya Utama No. 123, Sinjai',
      telepon: '081234567890',
      isActive: true,
    },
  });
  console.log('✅ Cabang created:', cabang.nama);

  // 2. Create Users with hashed passwords
  // Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@gugaramku.com' },
    update: { password: ownerPassword },
    create: {
      id: 'demo-owner-001',
      cabangId: cabang.id,
      nama: 'Owner Demo',
      email: 'owner@gugaramku.com',
      password: ownerPassword,
      pin: '1111',
      role: 'OWNER',
      isActive: true,
    },
  });
  console.log('✅ User created:', owner.nama);

  // Admin Cabang
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gugaramku.com' },
    update: { password: adminPassword },
    create: {
      id: 'demo-admin-001',
      cabangId: cabang.id,
      nama: 'Admin Cabang Demo',
      email: 'admin@gugaramku.com',
      password: adminPassword,
      pin: '2222',
      role: 'ADMIN_CABANG',
      isActive: true,
    },
  });
  console.log('✅ User created:', admin.nama);

  // Kasir
  const kasir = await prisma.user.upsert({
    where: { email: 'kasir@gugaramku.com' },
    update: { password: kasirPassword },
    create: {
      id: 'demo-kasir-001',
      cabangId: cabang.id,
      nama: 'Kasir Demo',
      email: 'kasir@gugaramku.com',
      password: kasirPassword,
      pin: '1234',
      role: 'KASIR',
      isActive: true,
    },
  });
  console.log('✅ User created:', kasir.nama);

  // 3. Create Kategori (Categories)
  const kategoris = [
    { nama: 'Mie Instan', deskripsi: 'Berbagai mie instan', urutan: 1 },
    { nama: 'Sembako', deskripsi: 'Beras, gula, minyak, dll', urutan: 2 },
    { nama: 'Minuman', deskripsi: 'Kopi, teh, minuman kemasan', urutan: 3 },
    { nama: 'Rokok', deskripsi: 'Rokok dan tembakau', urutan: 4 },
    { nama: 'Snack', deskripsi: 'Makanan ringan', urutan: 5 },
    { nama: 'Sabun & Deterjen', deskripsi: 'Perlengkapan kebersihan', urutan: 6 },
    { nama: 'Bumbu Dapur', deskripsi: 'Bumbu masak dan penyedap', urutan: 7 },
  ];

  for (const kat of kategoris) {
    await prisma.kategori.upsert({
      where: { nama: kat.nama },
      update: {},
      create: kat,
    });
  }
  console.log('✅ Kategori created:', kategoris.length);

  // Get kategori IDs
  const kategoriMap = await prisma.kategori.findMany();
  const getKategoriId = (nama: string) => kategoriMap.find((k) => k.nama === nama)?.id;

  // 4. Create Produk (Products) with Satuan and Harga
  const produks = [
    {
      barcode: '8991234567890',
      nama: 'Indomie Goreng',
      kategoriId: getKategoriId('Mie Instan'),
      hargaModal: 2800,
      satuanDasar: 'bks',
      satuan: [
        { nama: 'bks', konversi: 1, h1: 3500, h2: 3300, h3: 3200, h4: 3100, isDefault: true },
        { nama: 'dos', konversi: 40, h1: 135000, h2: 130000, h3: 125000, h4: 120000 },
      ],
      stok: 500,
    },
    {
      barcode: '8991234567891',
      nama: 'Indomie Kuah Soto',
      kategoriId: getKategoriId('Mie Instan'),
      hargaModal: 2700,
      satuanDasar: 'bks',
      satuan: [
        { nama: 'bks', konversi: 1, h1: 3400, h2: 3200, h3: 3100, h4: 3000, isDefault: true },
        { nama: 'dos', konversi: 40, h1: 130000, h2: 125000, h3: 120000, h4: 115000 },
      ],
      stok: 400,
    },
    {
      barcode: '8992345678901',
      nama: 'Gula Pasir 1kg',
      kategoriId: getKategoriId('Sembako'),
      hargaModal: 12000,
      satuanDasar: 'pcs',
      satuan: [
        { nama: 'pcs', konversi: 1, h1: 15000, h2: 14000, h3: 13500, h4: 13000, isDefault: true },
        { nama: 'krg', konversi: 25, h1: 360000, h2: 340000, h3: 330000, h4: 320000 },
      ],
      stok: 100,
    },
    {
      barcode: '8992345678902',
      nama: 'Beras Premium 5kg',
      kategoriId: getKategoriId('Sembako'),
      hargaModal: 60000,
      satuanDasar: 'sak',
      satuan: [
        { nama: 'sak', konversi: 1, h1: 72000, h2: 70000, h3: 68000, h4: 65000, isDefault: true },
      ],
      stok: 50,
    },
    {
      barcode: '8993456789012',
      nama: 'Kopi ABC Sachet',
      kategoriId: getKategoriId('Minuman'),
      hargaModal: 1000,
      satuanDasar: 'sct',
      satuan: [
        { nama: 'sct', konversi: 1, h1: 1500, h2: 1400, h3: 1300, h4: 1200, isDefault: true },
        { nama: 'rncg', konversi: 10, h1: 14000, h2: 13000, h3: 12500, h4: 12000 },
        { nama: 'dos', konversi: 120, h1: 160000, h2: 150000, h3: 145000, h4: 140000 },
      ],
      stok: 1000,
    },
    {
      barcode: '8993456789013',
      nama: 'Teh Pucuk Harum 350ml',
      kategoriId: getKategoriId('Minuman'),
      hargaModal: 2500,
      satuanDasar: 'btl',
      satuan: [
        { nama: 'btl', konversi: 1, h1: 4000, h2: 3800, h3: 3600, h4: 3500, isDefault: true },
        { nama: 'krt', konversi: 24, h1: 90000, h2: 86000, h3: 82000, h4: 80000 },
      ],
      stok: 200,
    },
    {
      barcode: '8994567890123',
      nama: 'Sampoerna Mild 16',
      kategoriId: getKategoriId('Rokok'),
      hargaModal: 25000,
      satuanDasar: 'bks',
      satuan: [
        { nama: 'bks', konversi: 1, h1: 28000, h2: 27500, h3: 27000, h4: 26500, isDefault: true },
        { nama: 'slp', konversi: 10, h1: 275000, h2: 270000, h3: 265000, h4: 260000 },
      ],
      stok: 100,
    },
    {
      barcode: '8994567890124',
      nama: 'Gudang Garam Filter 12',
      kategoriId: getKategoriId('Rokok'),
      hargaModal: 18000,
      satuanDasar: 'bks',
      satuan: [
        { nama: 'bks', konversi: 1, h1: 22000, h2: 21500, h3: 21000, h4: 20500, isDefault: true },
        { nama: 'slp', konversi: 10, h1: 215000, h2: 210000, h3: 205000, h4: 200000 },
      ],
      stok: 80,
    },
    {
      barcode: '8995678901234',
      nama: 'Chitato Original 68g',
      kategoriId: getKategoriId('Snack'),
      hargaModal: 8000,
      satuanDasar: 'bks',
      satuan: [
        { nama: 'bks', konversi: 1, h1: 11000, h2: 10500, h3: 10000, h4: 9500, isDefault: true },
        { nama: 'krt', konversi: 20, h1: 210000, h2: 200000, h3: 190000, h4: 180000 },
      ],
      stok: 60,
    },
    {
      barcode: '8995678901235',
      nama: 'Tango Wafer Coklat',
      kategoriId: getKategoriId('Snack'),
      hargaModal: 1500,
      satuanDasar: 'pcs',
      satuan: [
        { nama: 'pcs', konversi: 1, h1: 2000, h2: 1800, h3: 1700, h4: 1600, isDefault: true },
        { nama: 'pak', konversi: 10, h1: 18000, h2: 17000, h3: 16000, h4: 15000 },
      ],
      stok: 150,
    },
    {
      barcode: '8996789012345',
      nama: 'Rinso Anti Noda 800g',
      kategoriId: getKategoriId('Sabun & Deterjen'),
      hargaModal: 15000,
      satuanDasar: 'pcs',
      satuan: [
        { nama: 'pcs', konversi: 1, h1: 19000, h2: 18000, h3: 17500, h4: 17000, isDefault: true },
        { nama: 'lsn', konversi: 12, h1: 220000, h2: 210000, h3: 205000, h4: 200000 },
      ],
      stok: 40,
    },
    {
      barcode: '8996789012346',
      nama: 'Sabun Lifebuoy 80g',
      kategoriId: getKategoriId('Sabun & Deterjen'),
      hargaModal: 3000,
      satuanDasar: 'pcs',
      satuan: [
        { nama: 'pcs', konversi: 1, h1: 4500, h2: 4200, h3: 4000, h4: 3800, isDefault: true },
        { nama: 'lsn', konversi: 12, h1: 50000, h2: 48000, h3: 46000, h4: 44000 },
      ],
      stok: 100,
    },
    {
      barcode: '8997890123456',
      nama: 'Royco Ayam 8g',
      kategoriId: getKategoriId('Bumbu Dapur'),
      hargaModal: 500,
      satuanDasar: 'sct',
      satuan: [
        { nama: 'sct', konversi: 1, h1: 1000, h2: 900, h3: 850, h4: 800, isDefault: true },
        { nama: 'rncg', konversi: 12, h1: 11000, h2: 10000, h3: 9500, h4: 9000 },
        { nama: 'dos', konversi: 240, h1: 210000, h2: 200000, h3: 195000, h4: 190000 },
      ],
      stok: 500,
    },
    {
      barcode: '8997890123457',
      nama: 'Minyak Goreng Bimoli 1L',
      kategoriId: getKategoriId('Sembako'),
      hargaModal: 16000,
      satuanDasar: 'pcs',
      satuan: [
        { nama: 'pcs', konversi: 1, h1: 20000, h2: 19000, h3: 18500, h4: 18000, isDefault: true },
        { nama: 'krt', konversi: 12, h1: 230000, h2: 220000, h3: 215000, h4: 210000 },
      ],
      stok: 60,
    },
    {
      barcode: '8997890123458',
      nama: 'Garam Dapur 250g',
      kategoriId: getKategoriId('Bumbu Dapur'),
      hargaModal: 2000,
      satuanDasar: 'bks',
      satuan: [
        { nama: 'bks', konversi: 1, h1: 3000, h2: 2800, h3: 2700, h4: 2500, isDefault: true },
        { nama: 'pak', konversi: 20, h1: 55000, h2: 52000, h3: 50000, h4: 48000 },
      ],
      stok: 200,
    },
  ];

  for (const prod of produks) {
    // Create or update product
    const produk = await prisma.produk.upsert({
      where: { barcode: prod.barcode },
      update: {
        nama: prod.nama,
        hargaModal: prod.hargaModal,
      },
      create: {
        barcode: prod.barcode,
        nama: prod.nama,
        kategoriId: prod.kategoriId,
        hargaModal: prod.hargaModal,
        satuanDasar: prod.satuanDasar,
        isActive: true,
      },
    });

    // Delete existing satuan first (for clean update)
    await prisma.produkSatuan.deleteMany({
      where: { produkId: produk.id },
    });

    // Create satuan for product
    for (let i = 0; i < prod.satuan.length; i++) {
      const s = prod.satuan[i];
      await prisma.produkSatuan.create({
        data: {
          produkId: produk.id,
          namaSatuan: s.nama,
          konversi: s.konversi,
          harga1: s.h1,
          harga2: s.h2,
          harga3: s.h3,
          harga4: s.h4,
          isDefault: s.isDefault || false,
          urutan: i + 1,
        },
      });
    }

    // Create or update stock
    await prisma.stok.upsert({
      where: {
        produkId_cabangId: {
          produkId: produk.id,
          cabangId: cabang.id,
        },
      },
      update: {
        jumlah: prod.stok,
      },
      create: {
        produkId: produk.id,
        cabangId: cabang.id,
        jumlah: prod.stok,
        stokMinimum: 10,
      },
    });
  }
  console.log('✅ Produk created:', produks.length);

  // 5. Create Kas (Cash register)
  await prisma.kas.upsert({
    where: { cabangId: cabang.id },
    update: {},
    create: {
      cabangId: cabang.id,
      saldo: 500000, // Modal awal 500rb
    },
  });
  console.log('✅ Kas created');

  // 6. Create Pengaturan Harga
  const pengaturanHarga = [
    { tingkat: 1, nama: 'Eceran', warna: '#3498db', deskripsi: 'Harga jual eceran untuk pembeli umum' },
    { tingkat: 2, nama: 'Grosir', warna: '#27ae60', deskripsi: 'Harga grosir untuk pembelian dalam jumlah banyak' },
    { tingkat: 3, nama: 'Reseller', warna: '#f39c12', deskripsi: 'Harga khusus untuk reseller terdaftar' },
    { tingkat: 4, nama: 'Distributor', warna: '#9b59b6', deskripsi: 'Harga distributor untuk partner besar' },
  ];

  for (const ph of pengaturanHarga) {
    await prisma.pengaturanHarga.upsert({
      where: { tingkat: ph.tingkat },
      update: ph,
      create: ph,
    });
  }
  console.log('✅ Pengaturan Harga created');

  // 7. Create Pengaturan Toko
  await prisma.pengaturanToko.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      namaToko: 'GuGaramKu Store',
      alamat: 'Jl. Raya Utama No. 123, Sinjai',
      telepon: '081234567890',
      footerStruk: 'Terima kasih telah berbelanja!\nBarang yang sudah dibeli tidak dapat ditukar.',
      printerSize: '58mm',
      autoLogoutMenit: 30,
    },
  });
  console.log('✅ Pengaturan Toko created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Owner:');
  console.log('     Email: owner@gugaramku.com');
  console.log('     Password: owner123 | PIN: 1111');
  console.log('   Admin Cabang:');
  console.log('     Email: admin@gugaramku.com');
  console.log('     Password: admin123 | PIN: 2222');
  console.log('   Kasir:');
  console.log('     Email: kasir@gugaramku.com');
  console.log('     Password: kasir123 | PIN: 1234');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

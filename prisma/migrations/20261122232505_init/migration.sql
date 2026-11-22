-- CreateTable
CREATE TABLE "cabang" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "telepon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cabang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "cabang_id" TEXT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "pin" TEXT,
    "role" TEXT NOT NULL DEFAULT 'KASIR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk" (
    "id" TEXT NOT NULL,
    "barcode" TEXT,
    "nama" TEXT NOT NULL,
    "kategori_id" TEXT,
    "harga_modal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "satuan_dasar" TEXT NOT NULL,
    "gambar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_satuan" (
    "id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "nama_satuan" TEXT NOT NULL,
    "konversi" DECIMAL(14,3) NOT NULL DEFAULT 1,
    "harga_1" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "harga_2" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "harga_3" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "harga_4" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produk_satuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok" (
    "id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "jumlah" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "stok_minimum" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_mutasi" (
    "id" TEXT NOT NULL,
    "produk_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "jumlah" DECIMAL(14,3) NOT NULL,
    "jumlah_sebelum" DECIMAL(14,3) NOT NULL,
    "jumlah_sesudah" DECIMAL(14,3) NOT NULL,
    "tipe" TEXT NOT NULL,
    "referensi_tipe" TEXT,
    "referensi_id" TEXT,
    "keterangan" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stok_mutasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pelanggan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT,
    "alamat" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'RETAIL',
    "max_hutang" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_belanja" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pelanggan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "kasir_id" TEXT NOT NULL,
    "pelanggan_id" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "tingkat_harga" INTEGER NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "diskon" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "metode_bayar" TEXT NOT NULL,
    "jumlah_bayar" DECIMAL(14,2) NOT NULL,
    "kembalian" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SELESAI',
    "status_sync" TEXT NOT NULL DEFAULT 'SYNCED',
    "device_id" TEXT,
    "client_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_transaksi" (
    "id" TEXT NOT NULL,
    "transaksi_id" TEXT NOT NULL,
    "produk_id" TEXT,
    "produk_satuan_id" TEXT,
    "nama_barang" TEXT NOT NULL,
    "barcode" TEXT,
    "jumlah" DECIMAL(14,3) NOT NULL,
    "satuan" TEXT NOT NULL,
    "konversi" DECIMAL(14,3) NOT NULL,
    "harga_modal" DECIMAL(14,2) NOT NULL,
    "harga_jual" DECIMAL(14,2) NOT NULL,
    "tingkat_harga" INTEGER NOT NULL,
    "diskon" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "laba" DECIMAL(14,2) NOT NULL,
    "is_quick_sale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detail_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hutang" (
    "id" TEXT NOT NULL,
    "transaksi_id" TEXT NOT NULL,
    "pelanggan_id" TEXT NOT NULL,
    "jumlah" DECIMAL(14,2) NOT NULL,
    "sisa" DECIMAL(14,2) NOT NULL,
    "jatuh_tempo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hutang_pembayaran" (
    "id" TEXT NOT NULL,
    "hutang_id" TEXT NOT NULL,
    "jumlah" DECIMAL(14,2) NOT NULL,
    "metode" TEXT NOT NULL,
    "catatan" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hutang_pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kas" (
    "id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "saldo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kas_mutasi" (
    "id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "nominal" DECIMAL(14,2) NOT NULL,
    "saldo_sebelum" DECIMAL(14,2) NOT NULL,
    "saldo_sesudah" DECIMAL(14,2) NOT NULL,
    "keterangan" TEXT,
    "referensi_tipe" TEXT,
    "referensi_id" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kas_mutasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift" (
    "id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "kasir_id" TEXT NOT NULL,
    "modal_awal" DECIMAL(14,2) NOT NULL,
    "total_penjualan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_transaksi" INTEGER NOT NULL DEFAULT 0,
    "kas_akhir_sistem" DECIMAL(14,2),
    "kas_akhir_aktual" DECIMAL(14,2),
    "selisih" DECIMAL(14,2),
    "catatan" TEXT,
    "waktu_buka" TIMESTAMP(3) NOT NULL,
    "waktu_tutup" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'BUKA',

    CONSTRAINT "shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retur" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "transaksi_asal_id" TEXT NOT NULL,
    "cabang_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "total_refund" DECIMAL(14,2) NOT NULL,
    "metode_refund" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retur_detail" (
    "id" TEXT NOT NULL,
    "retur_id" TEXT NOT NULL,
    "detail_transaksi_id" TEXT NOT NULL,
    "jumlah" DECIMAL(14,3) NOT NULL,
    "nilai_refund" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retur_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan_harga" (
    "id" TEXT NOT NULL,
    "tingkat" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "warna" TEXT NOT NULL,
    "deskripsi" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_harga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengaturan_toko" (
    "id" TEXT NOT NULL,
    "nama_toko" TEXT NOT NULL,
    "alamat" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "footer_struk" TEXT,
    "printer_size" TEXT NOT NULL DEFAULT '58mm',
    "auto_logout_menit" INTEGER NOT NULL DEFAULT 30,
    "qris_image" TEXT,
    "rekening_bank" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengaturan_toko_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_aktivitas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "tabel" TEXT NOT NULL,
    "record_id" TEXT,
    "data_lama" TEXT,
    "data_baru" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_aktivitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cabang_kode_key" ON "cabang"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_cabang_id_idx" ON "user"("cabang_id");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "kategori_nama_key" ON "kategori"("nama");

-- CreateIndex
CREATE INDEX "kategori_urutan_idx" ON "kategori"("urutan");

-- CreateIndex
CREATE UNIQUE INDEX "produk_barcode_key" ON "produk"("barcode");

-- CreateIndex
CREATE INDEX "produk_barcode_idx" ON "produk"("barcode");

-- CreateIndex
CREATE INDEX "produk_nama_idx" ON "produk"("nama");

-- CreateIndex
CREATE INDEX "produk_kategori_id_idx" ON "produk"("kategori_id");

-- CreateIndex
CREATE INDEX "produk_is_active_idx" ON "produk"("is_active");

-- CreateIndex
CREATE INDEX "produk_satuan_produk_id_idx" ON "produk_satuan"("produk_id");

-- CreateIndex
CREATE UNIQUE INDEX "produk_satuan_produk_id_nama_satuan_key" ON "produk_satuan"("produk_id", "nama_satuan");

-- CreateIndex
CREATE INDEX "stok_cabang_id_idx" ON "stok"("cabang_id");

-- CreateIndex
CREATE UNIQUE INDEX "stok_produk_id_cabang_id_key" ON "stok"("produk_id", "cabang_id");

-- CreateIndex
CREATE INDEX "stok_mutasi_produk_id_idx" ON "stok_mutasi"("produk_id");

-- CreateIndex
CREATE INDEX "stok_mutasi_cabang_id_idx" ON "stok_mutasi"("cabang_id");

-- CreateIndex
CREATE INDEX "stok_mutasi_created_at_idx" ON "stok_mutasi"("created_at");

-- CreateIndex
CREATE INDEX "stok_mutasi_referensi_tipe_referensi_id_idx" ON "stok_mutasi"("referensi_tipe", "referensi_id");

-- CreateIndex
CREATE INDEX "pelanggan_nama_idx" ON "pelanggan"("nama");

-- CreateIndex
CREATE INDEX "pelanggan_telepon_idx" ON "pelanggan"("telepon");

-- CreateIndex
CREATE INDEX "pelanggan_kategori_idx" ON "pelanggan"("kategori");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_nomor_key" ON "transaksi"("nomor");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_client_ref_key" ON "transaksi"("client_ref");

-- CreateIndex
CREATE INDEX "transaksi_nomor_idx" ON "transaksi"("nomor");

-- CreateIndex
CREATE INDEX "transaksi_cabang_id_idx" ON "transaksi"("cabang_id");

-- CreateIndex
CREATE INDEX "transaksi_kasir_id_idx" ON "transaksi"("kasir_id");

-- CreateIndex
CREATE INDEX "transaksi_pelanggan_id_idx" ON "transaksi"("pelanggan_id");

-- CreateIndex
CREATE INDEX "transaksi_tanggal_idx" ON "transaksi"("tanggal");

-- CreateIndex
CREATE INDEX "transaksi_status_sync_idx" ON "transaksi"("status_sync");

-- CreateIndex
CREATE INDEX "detail_transaksi_transaksi_id_idx" ON "detail_transaksi"("transaksi_id");

-- CreateIndex
CREATE INDEX "detail_transaksi_produk_id_idx" ON "detail_transaksi"("produk_id");

-- CreateIndex
CREATE INDEX "hutang_pelanggan_id_idx" ON "hutang"("pelanggan_id");

-- CreateIndex
CREATE INDEX "hutang_status_idx" ON "hutang"("status");

-- CreateIndex
CREATE INDEX "hutang_jatuh_tempo_idx" ON "hutang"("jatuh_tempo");

-- CreateIndex
CREATE INDEX "hutang_pembayaran_hutang_id_idx" ON "hutang_pembayaran"("hutang_id");

-- CreateIndex
CREATE UNIQUE INDEX "kas_cabang_id_key" ON "kas"("cabang_id");

-- CreateIndex
CREATE INDEX "kas_mutasi_cabang_id_idx" ON "kas_mutasi"("cabang_id");

-- CreateIndex
CREATE INDEX "kas_mutasi_created_at_idx" ON "kas_mutasi"("created_at");

-- CreateIndex
CREATE INDEX "kas_mutasi_kategori_idx" ON "kas_mutasi"("kategori");

-- CreateIndex
CREATE INDEX "shift_cabang_id_idx" ON "shift"("cabang_id");

-- CreateIndex
CREATE INDEX "shift_kasir_id_idx" ON "shift"("kasir_id");

-- CreateIndex
CREATE INDEX "shift_status_idx" ON "shift"("status");

-- CreateIndex
CREATE UNIQUE INDEX "retur_nomor_key" ON "retur"("nomor");

-- CreateIndex
CREATE INDEX "retur_transaksi_asal_id_idx" ON "retur"("transaksi_asal_id");

-- CreateIndex
CREATE INDEX "retur_cabang_id_idx" ON "retur"("cabang_id");

-- CreateIndex
CREATE UNIQUE INDEX "pengaturan_harga_tingkat_key" ON "pengaturan_harga"("tingkat");

-- CreateIndex
CREATE INDEX "log_aktivitas_user_id_idx" ON "log_aktivitas"("user_id");

-- CreateIndex
CREATE INDEX "log_aktivitas_tabel_idx" ON "log_aktivitas"("tabel");

-- CreateIndex
CREATE INDEX "log_aktivitas_created_at_idx" ON "log_aktivitas"("created_at");

-- CreateIndex
CREATE INDEX "log_aktivitas_aksi_idx" ON "log_aktivitas"("aksi");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk" ADD CONSTRAINT "produk_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_satuan" ADD CONSTRAINT "produk_satuan_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok" ADD CONSTRAINT "stok_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok" ADD CONSTRAINT "stok_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_mutasi" ADD CONSTRAINT "stok_mutasi_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_mutasi" ADD CONSTRAINT "stok_mutasi_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_mutasi" ADD CONSTRAINT "stok_mutasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_kasir_id_fkey" FOREIGN KEY ("kasir_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_produk_id_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_produk_satuan_id_fkey" FOREIGN KEY ("produk_satuan_id") REFERENCES "produk_satuan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang" ADD CONSTRAINT "hutang_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang_pembayaran" ADD CONSTRAINT "hutang_pembayaran_hutang_id_fkey" FOREIGN KEY ("hutang_id") REFERENCES "hutang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hutang_pembayaran" ADD CONSTRAINT "hutang_pembayaran_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas" ADD CONSTRAINT "kas_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_mutasi" ADD CONSTRAINT "kas_mutasi_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_mutasi" ADD CONSTRAINT "kas_mutasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift" ADD CONSTRAINT "shift_kasir_id_fkey" FOREIGN KEY ("kasir_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur" ADD CONSTRAINT "retur_transaksi_asal_id_fkey" FOREIGN KEY ("transaksi_asal_id") REFERENCES "transaksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur" ADD CONSTRAINT "retur_cabang_id_fkey" FOREIGN KEY ("cabang_id") REFERENCES "cabang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur" ADD CONSTRAINT "retur_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur_detail" ADD CONSTRAINT "retur_detail_retur_id_fkey" FOREIGN KEY ("retur_id") REFERENCES "retur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retur_detail" ADD CONSTRAINT "retur_detail_detail_transaksi_id_fkey" FOREIGN KEY ("detail_transaksi_id") REFERENCES "detail_transaksi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_aktivitas" ADD CONSTRAINT "log_aktivitas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

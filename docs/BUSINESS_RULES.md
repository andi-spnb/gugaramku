# 📜 BUSINESS RULES — GUGARAMKU

## Aturan Bisnis Aplikasi

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |

---

## 1. Sistem 4 Tingkatan Harga

### 1.1 Definisi

GuGaramKu menggunakan sistem **4 tingkatan harga yang dipilih manual** oleh kasir, bukan otomatis berdasarkan jumlah pembelian.

| Tingkat | Nama Default | Warna | Target Customer |
|---------|--------------|-------|-----------------|
| H1 | Eceran | #3498db (Biru) | Pembeli umum/satuan |
| H2 | Grosir | #27ae60 (Hijau) | Pembeli banyak |
| H3 | Reseller | #f39c12 (Orange) | Toko/penjual lain |
| H4 | Distributor | #9b59b6 (Ungu) | Agen besar |

### 1.2 Aturan Pemilihan Harga

```
RULE PRC-001: Pemilihan Tingkat Harga
─────────────────────────────────────────────────────────────────
KONDISI:
  - Kasir memulai transaksi baru
  
AKSI:
  - Tingkat harga H1 (Eceran) dipilih secara default
  - Kasir dapat mengubah ke H2, H3, atau H4 kapan saja
  - Semua item dalam keranjang menggunakan tingkat harga yang sama
  
VALIDASI:
  - Tingkat harga harus antara 1-4
  - Tidak boleh ada item dengan tingkat harga berbeda dalam satu transaksi
─────────────────────────────────────────────────────────────────
```

### 1.3 Pergantian Tingkat Harga Saat Keranjang Terisi

```
RULE PRC-002: Konfirmasi Pergantian Tingkat Harga
─────────────────────────────────────────────────────────────────
KONDISI:
  - Keranjang sudah berisi item
  - Kasir mencoba mengubah tingkat harga
  
AKSI:
  1. Tampilkan dialog konfirmasi:
     "Ganti tingkatan harga dari [LAMA] ke [BARU]?
      Harga semua item di keranjang akan berubah."
     [Ya, Ganti] [Batal]
  
  2. Jika dikonfirmasi:
     - Ubah tingkat harga transaksi
     - Hitung ulang harga semua item berdasarkan tingkat baru
     - Update subtotal dan total
  
  3. Jika dibatalkan:
     - Tidak ada perubahan
─────────────────────────────────────────────────────────────────
```

### 1.4 Kustomisasi Nama Tingkatan

```
RULE PRC-003: Kustomisasi Nama Tingkatan Harga
─────────────────────────────────────────────────────────────────
SIAPA: Owner saja

AKSI:
  - Owner dapat mengubah nama tingkatan (misal: "Eceran" → "Retail")
  - Perubahan berlaku global untuk semua tampilan
  - Warna tingkatan juga dapat diubah
  
BATASAN:
  - Nama maksimal 50 karakter
  - Warna harus format hex valid (#RRGGBB)
  - Perubahan dicatat di log aktivitas
─────────────────────────────────────────────────────────────────
```

---

## 2. Sistem Multi-Satuan

### 2.1 Definisi Satuan

Setiap produk memiliki:
- **Satuan Dasar**: Satuan terkecil untuk pencatatan stok (bks, pcs, sct, btr)
- **Satuan Turunan**: Satuan lebih besar dengan konversi (pak, dos, bal, slop)

### 2.2 Daftar Satuan Standar

| Kode | Nama | Tipe | Contoh Penggunaan |
|------|------|------|-------------------|
| `bks` | Bungkus | Dasar | Mie instan, snack |
| `pcs` | Pieces | Dasar | Botol, kaleng |
| `sct` | Sachet | Dasar | Kopi, bumbu |
| `btr` | Butir | Dasar | Telur, permen |
| `gtg` | Gantung | Turunan | Snack, kerupuk (10 bks) |
| `pak` | Pak | Turunan | Isi beberapa bks |
| `lsn` | Lusin | Turunan | 12 pcs |
| `rncg` | Renceng | Turunan | 10 sachet |
| `dos` | Dos/Karton | Turunan | Kardus besar |
| `bal` | Bal/Ball | Turunan | Isi banyak |
| `slp` | Slop | Turunan | Rokok (10 bks) |
| `prs` | Press | Turunan | Rokok (20 bks) |
| `kg` | Kilogram | Dasar | Beras, gula |
| `ltr` | Liter | Dasar | Minyak, minuman |

### 2.3 Aturan Konversi

```
RULE UNT-001: Konversi Satuan
─────────────────────────────────────────────────────────────────
DEFINISI:
  - Konversi = berapa satuan dasar dalam 1 satuan turunan
  
CONTOH:
  Produk: Indomie Goreng
  Satuan Dasar: Bks
  
  | Satuan | Konversi | Artinya |
  |--------|----------|---------|
  | Bks    | 1        | 1 Bks = 1 Bks |
  | Dos    | 40       | 1 Dos = 40 Bks |
  
RUMUS:
  Jumlah Satuan Dasar = Jumlah Jual × Konversi
  
CONTOH PERHITUNGAN:
  Jual 2 Dos → 2 × 40 = 80 Bks (yang dikurangi dari stok)
─────────────────────────────────────────────────────────────────
```

### 2.4 Stok Selalu dalam Satuan Dasar

```
RULE UNT-002: Penyimpanan Stok
─────────────────────────────────────────────────────────────────
ATURAN:
  - Stok SELALU disimpan dalam satuan dasar
  - Tidak ada penyimpanan stok terpisah per satuan turunan
  
CONTOH:
  Produk: Indomie Goreng
  Stok tersimpan: 200 Bks (bukan "5 Dos" atau "200 Bks + 0 Dos")
  
TAMPILAN:
  - Dapat ditampilkan dalam satuan lain untuk kemudahan
  - Contoh: 200 Bks = 5 Dos (untuk informasi)
─────────────────────────────────────────────────────────────────
```

### 2.5 Harga Per Satuan Per Tingkat

```
RULE UNT-003: Struktur Harga Multi-Satuan
─────────────────────────────────────────────────────────────────
ATURAN:
  - Setiap satuan memiliki 4 harga (H1, H2, H3, H4)
  - Harga satuan turunan TIDAK harus = (harga dasar × konversi)
  - Owner bebas menentukan harga per satuan
  
CONTOH:
  Produk: Indomie Goreng
  
  | Satuan | Konversi | H1 (Eceran) | H2 (Grosir) | H3 (Reseller) | H4 (Distri) |
  |--------|----------|-------------|-------------|---------------|-------------|
  | Bks    | 1        | Rp 3.500    | Rp 3.300    | Rp 3.200      | Rp 3.100    |
  | Dos    | 40       | Rp 135.000  | Rp 130.000  | Rp 125.000    | Rp 120.000  |
  
  Catatan: 
  - H1 Dos = Rp 135.000 (bukan 40 × 3.500 = 140.000)
  - Ini memberikan insentif beli dalam kemasan besar
─────────────────────────────────────────────────────────────────
```

### 2.6 Validasi Stok Saat Penjualan

```
RULE UNT-004: Validasi Ketersediaan Stok
─────────────────────────────────────────────────────────────────
SAAT: Menambah item ke keranjang atau mengubah jumlah

PROSES:
  1. Hitung kebutuhan dalam satuan dasar:
     kebutuhan = jumlah_jual × konversi
  
  2. Cek stok tersedia:
     JIKA kebutuhan > stok_tersedia:
       - Tampilkan warning:
         "Stok tidak cukup untuk [JUMLAH] [SATUAN]
          Butuh: [KEBUTUHAN] [SATUAN_DASAR]
          Tersedia: [STOK] [SATUAN_DASAR]"
       - Saran: "Jual per [SATUAN_DASAR] saja?"
       - Tolak penambahan ke keranjang
     
     JIKA kebutuhan <= stok_tersedia:
       - Izinkan penambahan
       - Tampilkan sisa stok setelah transaksi

CONTOH:
  Stok: 30 Bks
  Kasir mau jual: 1 Dos (konversi = 40 Bks)
  
  → Warning: "Stok tidak cukup untuk 1 Dos
              Butuh: 40 Bks
              Tersedia: 30 Bks"
─────────────────────────────────────────────────────────────────
```

---

## 3. Proteksi Rugi

### 3.1 Definisi

Sistem mencegah penjualan di bawah harga modal untuk melindungi dari kerugian.

### 3.2 Validasi Harga Input Produk

```
RULE LPR-001: Validasi Harga Saat Input Produk
─────────────────────────────────────────────────────────────────
SAAT: Admin/Owner menyimpan produk atau mengubah harga

UNTUK SETIAP SATUAN:
  1. Hitung harga modal per satuan:
     modal_per_satuan = harga_modal_dasar × konversi
  
  2. Validasi setiap tingkat harga:
     UNTUK tingkat IN [H1, H2, H3, H4]:
       JIKA harga[tingkat] < modal_per_satuan:
         - Tampilkan warning MERAH:
           "⚠️ Harga [TINGKAT] untuk [SATUAN] di bawah modal!
            Harga: Rp [HARGA]
            Modal: Rp [MODAL]
            Rugi: Rp [SELISIH] per [SATUAN]"
         - Izinkan simpan dengan konfirmasi (Owner only)
         - Blokir simpan untuk Admin

CONTOH:
  Harga Modal Dasar: Rp 2.800/Bks
  
  Satuan Dos (konversi 40):
  - Modal per Dos = 2.800 × 40 = Rp 112.000
  - H4 yang diinput: Rp 110.000
  
  → Warning: "Harga Distributor untuk Dos di bawah modal!
              Harga: Rp 110.000
              Modal: Rp 112.000
              Rugi: Rp 2.000 per Dos"
─────────────────────────────────────────────────────────────────
```

### 3.3 Validasi Saat Transaksi

```
RULE LPR-002: Validasi Harga Saat Transaksi
─────────────────────────────────────────────────────────────────
SAAT: Kasir menekan tombol BAYAR

PROSES:
  1. Untuk setiap item di keranjang:
     - Hitung modal item = harga_modal_dasar × jumlah × konversi
     - Hitung nilai jual = harga_jual × jumlah
     
     JIKA nilai_jual < modal_item:
       - Tandai item sebagai "berpotensi rugi"
  
  2. JIKA ada item berpotensi rugi:
     JIKA user adalah KASIR:
       - Tampilkan error:
         "Transaksi tidak dapat diproses.
          Item berikut dijual di bawah modal:
          - [NAMA_ITEM]: Rugi Rp [SELISIH]"
       - BLOKIR transaksi
     
     JIKA user adalah OWNER:
       - Tampilkan warning dengan opsi override:
         "Item berikut dijual di bawah modal:
          - [NAMA_ITEM]: Rugi Rp [SELISIH]
          
          Masukkan PIN untuk melanjutkan:"
         [Input PIN] [Batal]
       
       - JIKA PIN valid:
         - Wajib isi alasan penjualan rugi
         - Lanjutkan transaksi
         - Catat di log sebagai "PENJUALAN_RUGI"
─────────────────────────────────────────────────────────────────
```

### 3.4 Perhitungan Modal untuk Multi-Satuan

```
RULE LPR-003: Perhitungan Modal Multi-Satuan
─────────────────────────────────────────────────────────────────
RUMUS:
  Modal per satuan = Harga Modal Dasar × Konversi

CONTOH:
  Produk: Kopi Sachet
  Harga Modal Dasar: Rp 1.000/Sct
  
  | Satuan | Konversi | Modal per Satuan |
  |--------|----------|------------------|
  | Sct    | 1        | Rp 1.000         |
  | Rncg   | 10       | Rp 10.000        |
  | Dos    | 120      | Rp 120.000       |
  
VALIDASI H4 Renceng:
  - H4 Renceng yang diinput: Rp 9.500
  - Modal Renceng: Rp 10.000
  - Status: RUGI (Rp 500 per Renceng)
─────────────────────────────────────────────────────────────────
```

---

## 4. Perhitungan Transaksi

### 4.1 Perhitungan Item

```
RULE TRX-001: Perhitungan Detail Transaksi
─────────────────────────────────────────────────────────────────
UNTUK SETIAP ITEM:

INPUT:
  - produk_id
  - satuan_id (menentukan konversi)
  - jumlah
  - tingkat_harga (1-4)
  - diskon_item (opsional)

AMBIL DARI DATABASE:
  - harga_jual = harga[tingkat_harga] dari produk_satuan
  - konversi = konversi dari produk_satuan
  - harga_modal = harga_modal dari produk (per satuan dasar)

PERHITUNGAN:
  subtotal_item = (jumlah × harga_jual) - diskon_item
  
  modal_item = jumlah × konversi × harga_modal
  
  laba_item = subtotal_item - modal_item

SIMPAN:
  - Semua nilai di atas disimpan di detail_transaksi
  - harga_modal disimpan untuk historis (meski kasir tidak melihat)
─────────────────────────────────────────────────────────────────
```

### 4.2 Perhitungan Total Transaksi

```
RULE TRX-002: Perhitungan Total Transaksi
─────────────────────────────────────────────────────────────────
PERHITUNGAN:
  subtotal = SUM(subtotal_item) untuk semua item
  
  diskon_total = diskon yang diberikan untuk transaksi
  
  total = subtotal - diskon_total

PEMBAYARAN (Tunai):
  kembalian = jumlah_bayar - total
  
  JIKA kembalian < 0:
    - Tampilkan warning: "Pembayaran kurang"
    - Blokir proses bayar
─────────────────────────────────────────────────────────────────
```

### 4.3 Pengurangan Stok

```
RULE TRX-003: Pengurangan Stok
─────────────────────────────────────────────────────────────────
WAKTU: Setelah transaksi berhasil disimpan

UNTUK SETIAP ITEM:
  pengurangan_stok = jumlah × konversi
  
  UPDATE stok:
    stok_baru = stok_lama - pengurangan_stok
  
  CATAT di stok_mutasi:
    - tipe: KELUAR
    - referensi_tipe: TRANSAKSI
    - referensi_id: transaksi_id
    - jumlah: -pengurangan_stok
    - jumlah_sebelum: stok_lama
    - jumlah_sesudah: stok_baru

CONTOH:
  Jual 2 Dos Indomie (konversi 40)
  pengurangan = 2 × 40 = 80 Bks
  
  Stok sebelum: 200 Bks
  Stok sesudah: 120 Bks
─────────────────────────────────────────────────────────────────
```

---

## 5. Quick Sale

### 5.1 Definisi

Quick Sale adalah fitur untuk menjual barang yang belum terdaftar di database.

### 5.2 Aturan Quick Sale

```
RULE QS-001: Quick Sale
─────────────────────────────────────────────────────────────────
SIAPA: Semua role (Owner, Admin, Kasir)

INPUT YANG DIPERLUKAN:
  - Nama barang (wajib)
  - Harga jual (wajib)
  - Jumlah (wajib, default: 1)
  - Satuan (opsional, default: "pcs")

YANG TIDAK DIPERLUKAN:
  - Barcode
  - Harga modal
  - Stok

PERILAKU:
  - Tidak mempengaruhi stok (tidak ada pengurangan)
  - Tidak masuk perhitungan laba (modal tidak diketahui)
  - Ditandai dengan is_quick_sale = true
  - harga_modal disimpan sebagai 0
  - laba disimpan sebagai 0

TAMPILAN DI LAPORAN:
  - Muncul di laporan penjualan
  - TIDAK muncul di laporan laba (atau ditampilkan terpisah)
  - Label: "Penjualan Tanpa Stok"
─────────────────────────────────────────────────────────────────
```

---

## 6. Hutang/Piutang

### 6.1 Pembuatan Hutang

```
RULE DEB-001: Pencatatan Hutang
─────────────────────────────────────────────────────────────────
KONDISI:
  - Metode bayar = HUTANG
  - Pelanggan WAJIB dipilih (tidak boleh null)

VALIDASI:
  1. Cek pelanggan terdaftar
  2. Cek total hutang existing + hutang baru <= max_hutang
     
     JIKA melebihi batas:
       - Tampilkan warning:
         "Hutang melebihi batas!
          Batas: Rp [MAX_HUTANG]
          Hutang saat ini: Rp [HUTANG_EXISTING]
          Hutang baru: Rp [HUTANG_BARU]
          Total: Rp [TOTAL]"
       - Opsi: [Tetap Lanjutkan (Owner)] [Batal]

PROSES:
  1. Simpan transaksi dengan metode_bayar = HUTANG
  2. Buat record hutang:
     - jumlah = total transaksi
     - sisa = total transaksi
     - status = BELUM_LUNAS
  3. Update total_belanja pelanggan
─────────────────────────────────────────────────────────────────
```

### 6.2 Pembayaran Hutang

```
RULE DEB-002: Pembayaran Hutang
─────────────────────────────────────────────────────────────────
SIAPA: Owner, Admin

INPUT:
  - hutang_id
  - jumlah_bayar
  - metode_bayar

VALIDASI:
  - jumlah_bayar > 0
  - jumlah_bayar <= sisa_hutang

PROSES:
  1. Catat pembayaran di hutang_pembayaran
  2. Update sisa hutang:
     sisa_baru = sisa_lama - jumlah_bayar
  3. JIKA sisa_baru = 0:
     - Update status = LUNAS
  4. JIKA metode = TUNAI:
     - Catat kas masuk

PEMBAYARAN PARSIAL:
  - Diizinkan
  - Sisa hutang diupdate
  - Status tetap BELUM_LUNAS sampai sisa = 0
─────────────────────────────────────────────────────────────────
```

---

## 7. Retur Barang

### 7.1 Proses Retur

```
RULE RTN-001: Retur dari Pembeli
─────────────────────────────────────────────────────────────────
SIAPA: Owner, Admin

PROSES:
  1. Cari transaksi asal (scan struk atau input nomor)
  2. Pilih item yang akan diretur
  3. Input jumlah retur per item (tidak boleh > jumlah beli)
  4. Pilih alasan retur
  5. Pilih metode refund (Tunai / Tukar Barang)

KALKULASI:
  nilai_refund_item = (jumlah_retur / jumlah_beli) × subtotal_item

EFEK PADA STOK:
  penambahan_stok = jumlah_retur × konversi
  
  CATAT di stok_mutasi:
    - tipe: RETUR_MASUK
    - referensi_tipe: RETUR
    - referensi_id: retur_id

EFEK PADA KAS (jika refund tunai):
  - Catat kas keluar
  - Kategori: "Refund Retur"
─────────────────────────────────────────────────────────────────
```

---

## 8. Shift Kasir

### 8.1 Buka Shift

```
RULE SFT-001: Membuka Shift
─────────────────────────────────────────────────────────────────
KONDISI:
  - Kasir login
  - Belum ada shift aktif untuk kasir ini di cabang ini

INPUT:
  - modal_awal (jumlah uang kas awal)

PROSES:
  1. Validasi tidak ada shift aktif
  2. Buat record shift:
     - status = BUKA
     - waktu_buka = now()
     - modal_awal = input
─────────────────────────────────────────────────────────────────
```

### 8.2 Tutup Shift

```
RULE SFT-002: Menutup Shift
─────────────────────────────────────────────────────────────────
INPUT:
  - kas_akhir_aktual (jumlah uang kas saat serah terima)
  - catatan (opsional)

PERHITUNGAN:
  total_penjualan_tunai = SUM(total) dari transaksi tunai selama shift
  
  kas_akhir_sistem = modal_awal + total_penjualan_tunai - kas_keluar
  
  selisih = kas_akhir_aktual - kas_akhir_sistem

PROSES:
  1. Update shift:
     - status = TUTUP
     - waktu_tutup = now()
     - kas_akhir_sistem
     - kas_akhir_aktual
     - selisih
     - catatan

TAMPILAN:
  JIKA selisih > 0:
    - "Kas lebih: Rp [SELISIH]" (hijau)
  JIKA selisih < 0:
    - "Kas kurang: Rp [SELISIH]" (merah)
  JIKA selisih = 0:
    - "Kas sesuai" (hijau)
─────────────────────────────────────────────────────────────────
```

---

## 9. Nomor Transaksi

### 9.1 Format Nomor

```
RULE NUM-001: Format Nomor Transaksi
─────────────────────────────────────────────────────────────────
FORMAT: GGK-[KODE_CABANG]-[TANGGAL]-[URUTAN]

KOMPONEN:
  - GGK: Prefix aplikasi (GuGaramKu)
  - KODE_CABANG: Kode 3 huruf cabang (SJI, MKS, dll)
  - TANGGAL: Format YYYYMMDD
  - URUTAN: 4 digit urutan harian (0001-9999)

CONTOH:
  GGK-SJI-20261102-0001
  GGK-SJI-20261102-0002
  GGK-MKS-20261102-0001

RESET:
  - Urutan reset ke 0001 setiap hari baru
  - Per cabang terpisah
─────────────────────────────────────────────────────────────────
```

---

## 10. Offline Mode

### 10.1 Operasi yang Diizinkan Offline

```
RULE OFF-001: Operasi Offline
─────────────────────────────────────────────────────────────────
DIIZINKAN:
  ✅ Transaksi penjualan (disimpan sebagai PENDING)
  ✅ Melihat produk (dari cache lokal)
  ✅ Melihat stok (dari cache lokal, mungkin tidak akurat)
  ✅ Melihat pelanggan (dari cache lokal)

TIDAK DIIZINKAN:
  ❌ Mengubah harga produk
  ❌ Menambah produk baru (selain Quick Sale)
  ❌ Mengubah stok manual
  ❌ Melihat laporan real-time
  ❌ Manajemen user

ALASAN:
  - Operasi write kritis memerlukan validasi server
  - Mencegah conflict data yang sulit di-resolve
─────────────────────────────────────────────────────────────────
```

### 10.2 Sinkronisasi

```
RULE OFF-002: Sinkronisasi Data
─────────────────────────────────────────────────────────────────
PRIORITAS SYNC (Client → Server):
  1. Transaksi PENDING (tertinggi)
  2. Pembayaran hutang

PRIORITAS SYNC (Server → Client):
  1. Perubahan harga
  2. Produk baru/update
  3. Perubahan stok
  4. Pelanggan baru/update

CONFLICT RESOLUTION:
  - Transaksi: Tidak ada conflict (UUID unique)
  - Stok: Server recalculate berdasarkan delta
  - Harga: Server wins (Owner's changes take precedence)
─────────────────────────────────────────────────────────────────
```

---

## 11. Audit Trail

### 11.1 Aktivitas yang Dicatat

```
RULE AUD-001: Pencatatan Aktivitas
─────────────────────────────────────────────────────────────────
WAJIB DICATAT:
  - Login/Logout user
  - Perubahan harga produk (data lama & baru)
  - Perubahan harga modal
  - Penambahan/perubahan stok manual
  - Pembatalan transaksi
  - Penjualan rugi (dengan override)
  - Perubahan data user
  - Perubahan pengaturan

FORMAT LOG:
  {
    user_id: "...",
    aksi: "UPDATE",
    tabel: "produk_satuan",
    record_id: "...",
    data_lama: { harga_1: 3500 },
    data_baru: { harga_1: 3800 },
    ip_address: "...",
    timestamp: "..."
  }
─────────────────────────────────────────────────────────────────
```

---

## 12. Validasi Umum

### 12.1 Validasi Harga

```
RULE VAL-001: Validasi Input Harga
─────────────────────────────────────────────────────────────────
- Harga harus >= 0
- Harga harus bilangan bulat (tidak ada sen/desimal untuk Rupiah)
- Harga maksimal: 999.999.999.999 (999 miliar)
─────────────────────────────────────────────────────────────────
```

### 12.2 Validasi Stok

```
RULE VAL-002: Validasi Input Stok
─────────────────────────────────────────────────────────────────
- Stok harus >= 0
- Stok bisa desimal untuk satuan berat/volume (kg, ltr)
- Presisi maksimal: 4 desimal
- Stok tidak boleh negatif setelah transaksi
─────────────────────────────────────────────────────────────────
```

### 12.3 Validasi Konversi

```
RULE VAL-003: Validasi Konversi Satuan
─────────────────────────────────────────────────────────────────
- Konversi harus > 0
- Satuan dasar selalu konversi = 1
- Presisi maksimal: 4 desimal (untuk berat/volume)
─────────────────────────────────────────────────────────────────
```

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

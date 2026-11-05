# 📝 REQUIREMENTS — GUGARAMKU

## Dokumen Kebutuhan Sistem

| Item | Detail |
|------|--------|
| **Versi** | 1.0 |
| **Tanggal** | 02 November 2026 |
| **Status** | Draft |

---

## 1. Kebutuhan Fungsional

### 1.1 Modul Autentikasi & Keamanan (AUTH)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| AUTH-01 | Sistem harus mendukung login dengan email dan password | TINGGI | MVP |
| AUTH-02 | Sistem harus mendukung login cepat dengan PIN 4-6 digit untuk kasir | TINGGI | MVP |
| AUTH-03 | Sistem harus menyediakan fitur "Ingat Saya" untuk device terpercaya | SEDANG | MVP |
| AUTH-04 | Sistem harus melakukan auto-logout setelah periode tidak aktif (konfigurabel) | SEDANG | MVP |
| AUTH-05 | Sistem harus menyediakan fitur reset password via email | SEDANG | MVP |
| AUTH-06 | Sistem harus mendukung login dari beberapa device sekaligus | SEDANG | MVP |
| AUTH-07 | Sistem harus mencatat semua aktivitas login/logout | SEDANG | Fase 4 |

### 1.2 Modul Point of Sale / Kasir (POS)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| POS-01 | Kasir harus dapat memilih tingkatan harga (H1-H4) sebelum/saat transaksi | TINGGI | MVP |
| POS-02 | Tombol tingkatan harga harus ditampilkan dengan warna berbeda (H1=Biru, H2=Hijau, H3=Orange, H4=Ungu) | TINGGI | MVP |
| POS-03 | Kasir harus dapat menambah produk via scan barcode (kamera/scanner USB) | TINGGI | MVP |
| POS-04 | Kasir harus dapat mencari produk dengan ketik nama/kode | TINGGI | MVP |
| POS-05 | Kasir harus dapat memilih satuan penjualan (bks, pak, dos, bal, dll) per item | TINGGI | MVP |
| POS-06 | Harga harus otomatis menyesuaikan berdasarkan tingkatan dan satuan yang dipilih | TINGGI | MVP |
| POS-07 | Kasir harus dapat mengubah jumlah item dengan tombol +/- atau input langsung | TINGGI | MVP |
| POS-08 | Kasir harus dapat mengubah satuan item setelah masuk keranjang | TINGGI | MVP |
| POS-09 | Sistem harus menampilkan konfirmasi jika kasir mengganti tingkatan harga saat keranjang terisi | TINGGI | MVP |
| POS-10 | Kasir harus dapat menghapus item dari keranjang (swipe atau tombol hapus) | TINGGI | MVP |
| POS-11 | Kasir harus dapat mengosongkan seluruh keranjang (dengan konfirmasi) | SEDANG | MVP |
| POS-12 | Kasir harus dapat melakukan Quick Sale untuk barang tidak terdaftar | SEDANG | MVP |
| POS-13 | Kasir harus dapat memberikan diskon per item (% atau nominal) | SEDANG | Fase 4 |
| POS-14 | Kasir harus dapat memberikan diskon total transaksi | SEDANG | Fase 4 |
| POS-15 | Kasir harus dapat menahan (hold) transaksi untuk dilanjutkan nanti | SEDANG | MVP |
| POS-16 | Shortcut keyboard harus tersedia: F1-F4 untuk tingkatan harga, F8 untuk bayar | SEDANG | MVP |

### 1.3 Modul Pembayaran (PAY)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| PAY-01 | Sistem harus mendukung pembayaran tunai dengan perhitungan kembalian otomatis | TINGGI | MVP |
| PAY-02 | Sistem harus menyediakan tombol nominal cepat (50rb, 100rb, 200rb, Uang Pas) | TINGGI | MVP |
| PAY-03 | Sistem harus mendukung pembayaran QRIS dengan tampilan QR Code | SEDANG | Fase 2 |
| PAY-04 | Sistem harus mendukung pembayaran transfer bank | SEDANG | Fase 2 |
| PAY-05 | Sistem harus mendukung pembayaran hutang (untuk pelanggan terdaftar) | SEDANG | Fase 4 |
| PAY-06 | Sistem harus mendukung split payment (kombinasi metode) | RENDAH | Fase 4 |

### 1.4 Modul Struk & Nota (RCP)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| RCP-01 | Sistem harus dapat mencetak struk ke printer thermal 58mm dan 80mm | TINGGI | MVP |
| RCP-02 | Sistem harus auto-detect ukuran kertas printer | SEDANG | MVP |
| RCP-03 | Sistem harus menyediakan preview struk sebelum cetak | SEDANG | MVP |
| RCP-04 | Sistem harus dapat mencetak ulang struk dari riwayat transaksi | SEDANG | MVP |
| RCP-05 | Sistem harus dapat mengirim struk digital via WhatsApp | SEDANG | Fase 2 |
| RCP-06 | Owner harus dapat mengkustomisasi header struk (nama toko, alamat, logo) | SEDANG | MVP |
| RCP-07 | Owner harus dapat menambahkan pesan kustom di struk | RENDAH | MVP |

### 1.5 Modul Manajemen Produk (PRD)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| PRD-01 | Admin harus dapat menambah produk baru dengan form step-by-step | TINGGI | MVP |
| PRD-02 | Admin harus dapat scan barcode saat input produk baru | TINGGI | MVP |
| PRD-03 | Sistem harus dapat generate barcode untuk produk tanpa barcode | SEDANG | MVP |
| PRD-04 | Admin harus dapat mengedit data produk (inline edit) | TINGGI | MVP |
| PRD-05 | Admin harus dapat menonaktifkan produk (soft delete) | TINGGI | MVP |
| PRD-06 | Admin harus dapat mengelompokkan produk dalam kategori | SEDANG | MVP |
| PRD-07 | Admin harus dapat menambahkan foto produk (dari kamera) | RENDAH | Fase 2 |
| PRD-08 | Admin harus dapat import data produk dari Excel | SEDANG | Fase 3 |
| PRD-09 | Admin harus dapat export data produk ke Excel | SEDANG | Fase 3 |
| PRD-10 | Admin harus dapat menduplikat produk yang mirip | RENDAH | MVP |

### 1.6 Modul Sistem 4 Tingkat Harga (PRC)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| PRC-01 | Setiap produk harus memiliki 4 tingkatan harga (H1, H2, H3, H4) | TINGGI | MVP |
| PRC-02 | Setiap satuan produk harus memiliki 4 harga masing-masing | TINGGI | MVP |
| PRC-03 | Kasir harus memilih tingkatan harga secara manual (tidak otomatis) | TINGGI | MVP |
| PRC-04 | Owner harus dapat mengubah nama tingkatan harga | SEDANG | MVP |
| PRC-05 | Sistem harus menampilkan preview semua harga saat input produk | SEDANG | MVP |
| PRC-06 | Sistem harus menghitung dan menampilkan margin per tingkatan | SEDANG | MVP |
| PRC-07 | Warna default tingkatan: H1=#3498db, H2=#27ae60, H3=#f39c12, H4=#9b59b6 | SEDANG | MVP |

### 1.7 Modul Multi-Satuan (UNT)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| UNT-01 | Setiap produk harus memiliki satu satuan dasar (terkecil) | TINGGI | MVP |
| UNT-02 | Produk dapat memiliki beberapa satuan turunan dengan konversi | TINGGI | MVP |
| UNT-03 | Stok harus selalu disimpan dalam satuan dasar | TINGGI | MVP |
| UNT-04 | Sistem harus otomatis menghitung pengurangan stok berdasarkan konversi | TINGGI | MVP |
| UNT-05 | Kasir harus dapat memilih satuan saat menjual (dropdown) | TINGGI | MVP |
| UNT-06 | Admin harus dapat menentukan satuan default saat scan | SEDANG | MVP |
| UNT-07 | Sistem harus menampilkan harga per satuan dasar untuk perbandingan | SEDANG | MVP |
| UNT-08 | Daftar satuan standar: bks, pcs, sct, btr, gtg, pak, lsn, rncg, dos, bal, kg, ltr, slp, prs | TINGGI | MVP |

### 1.8 Modul Manajemen Stok (STK)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| STK-01 | Admin harus dapat melihat stok real-time dengan indikator warna | TINGGI | MVP |
| STK-02 | Admin harus dapat menambah stok (barang masuk) dengan input qty + harga beli | TINGGI | MVP |
| STK-03 | Admin harus dapat mengurangi stok (rusak/expired) dengan pilih alasan | TINGGI | MVP |
| STK-04 | Admin harus dapat melakukan stok opname (sesuaikan stok fisik) | SEDANG | Fase 3 |
| STK-05 | Admin harus dapat set stok minimum per produk untuk alert | SEDANG | MVP |
| STK-06 | Sistem harus mencatat semua riwayat perubahan stok | TINGGI | MVP |
| STK-07 | Owner harus menerima notifikasi saat stok mencapai minimum | SEDANG | Fase 3 |

### 1.9 Modul Proteksi Rugi (LPR)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| LPR-01 | Sistem harus memvalidasi harga jual >= harga modal saat input produk | TINGGI | MVP |
| LPR-02 | Sistem harus menampilkan warning jika harga jual < modal | TINGGI | MVP |
| LPR-03 | Sistem harus memvalidasi harga penjualan vs harga modal saat transaksi | TINGGI | MVP |
| LPR-04 | Validasi harus menggunakan konversi ke satuan dasar untuk perbandingan akurat | TINGGI | MVP |
| LPR-05 | Owner dapat override proteksi rugi dengan PIN khusus | SEDANG | MVP |
| LPR-06 | Transaksi rugi harus tercatat dengan alasan wajib | SEDANG | MVP |

### 1.10 Modul Retur Barang (RTN)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| RTN-01 | Admin harus dapat memproses retur dari pembeli | SEDANG | Fase 4 |
| RTN-02 | Admin harus dapat mencari transaksi asal via scan struk atau pencarian | SEDANG | Fase 4 |
| RTN-03 | Admin harus dapat memilih item yang diretur | SEDANG | Fase 4 |
| RTN-04 | Admin harus dapat mencatat alasan retur | SEDANG | Fase 4 |
| RTN-05 | Sistem harus mendukung refund tunai atau tukar barang | SEDANG | Fase 4 |
| RTN-06 | Stok harus otomatis bertambah saat retur diproses | SEDANG | Fase 4 |

### 1.11 Modul Manajemen Pelanggan (CST)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| CST-01 | Admin harus dapat mendaftarkan pelanggan (minimal: nama + no. HP) | SEDANG | Fase 4 |
| CST-02 | Admin harus dapat mencari pelanggan by nama/HP | SEDANG | Fase 4 |
| CST-03 | Sistem harus mencatat riwayat belanja per pelanggan | SEDANG | Fase 4 |
| CST-04 | Admin harus dapat mengelompokkan pelanggan (Retail, Reseller, Distributor) | RENDAH | Fase 4 |
| CST-05 | Sistem harus menghitung total akumulasi belanja pelanggan | RENDAH | Fase 4 |

### 1.12 Modul Hutang/Piutang (DEB)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| DEB-01 | Kasir harus dapat menyimpan transaksi sebagai hutang | SEDANG | Fase 4 |
| DEB-02 | Admin harus dapat set batas maksimal hutang per pelanggan | SEDANG | Fase 4 |
| DEB-03 | Sistem harus menampilkan warning jika hutang melebihi batas | SEDANG | Fase 4 |
| DEB-04 | Admin harus dapat menerima pembayaran hutang (partial/lunas) | SEDANG | Fase 4 |
| DEB-05 | Admin harus dapat melihat daftar piutang belum lunas | SEDANG | Fase 4 |
| DEB-06 | Admin harus dapat set tanggal jatuh tempo hutang | SEDANG | Fase 4 |
| DEB-07 | Admin harus dapat mencetak tagihan hutang | RENDAH | Fase 4 |
| DEB-08 | Sistem harus mengirim reminder hutang jatuh tempo | RENDAH | Fase 4 |

### 1.13 Modul Kas & Keuangan (CSH)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| CSH-01 | Admin harus dapat mencatat kas masuk (selain penjualan) | SEDANG | Fase 4 |
| CSH-02 | Admin harus dapat mencatat kas keluar (pengeluaran) | SEDANG | Fase 4 |
| CSH-03 | Admin harus dapat mengelola kategori kas | SEDANG | Fase 4 |
| CSH-04 | Sistem harus menampilkan saldo kas real-time | SEDANG | Fase 4 |
| CSH-05 | Admin harus dapat melihat mutasi kas dengan filter tanggal | SEDANG | Fase 4 |

### 1.14 Modul Shift Kasir (SFT)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| SFT-01 | Kasir harus dapat membuka shift dengan input modal awal | SEDANG | Fase 4 |
| SFT-02 | Kasir harus dapat menutup shift dengan input kas aktual | SEDANG | Fase 4 |
| SFT-03 | Sistem harus menghitung dan menampilkan selisih kas | SEDANG | Fase 4 |
| SFT-04 | Sistem harus generate laporan shift otomatis | SEDANG | Fase 4 |
| SFT-05 | Kasir harus dapat menambahkan catatan serah terima | RENDAH | Fase 4 |

### 1.15 Modul Laporan & Analitik (RPT)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| RPT-01 | Owner harus dapat melihat dashboard ringkasan bisnis | TINGGI | Fase 3 |
| RPT-02 | Owner harus dapat melihat laporan penjualan detail | TINGGI | Fase 3 |
| RPT-03 | Owner harus dapat melihat laporan laba (harian/mingguan/bulanan/tahunan) | TINGGI | Fase 3 |
| RPT-04 | Owner harus dapat melihat grafik tren penjualan/laba | SEDANG | Fase 3 |
| RPT-05 | Owner harus dapat melihat produk terlaris (Top 10) | SEDANG | Fase 3 |
| RPT-06 | Owner harus dapat melihat produk tidak laku (slow moving) | SEDANG | Fase 3 |
| RPT-07 | Owner harus dapat export laporan ke PDF | SEDANG | Fase 3 |
| RPT-08 | Owner harus dapat export data ke Excel | SEDANG | Fase 3 |
| RPT-09 | Owner harus dapat mengatur jadwal pengiriman laporan via email | RENDAH | Fase 3 |

### 1.16 Modul Notifikasi & Alert (NTF)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| NTF-01 | Sistem harus mengirim alert stok menipis (push notification) | SEDANG | Fase 3 |
| NTF-02 | Sistem harus mengirim alert stok habis | SEDANG | Fase 3 |
| NTF-03 | Sistem harus mengirim reminder hutang jatuh tempo | SEDANG | Fase 4 |
| NTF-04 | Sistem harus mengirim alert transaksi besar (threshold konfigurabel) | RENDAH | Fase 4 |
| NTF-05 | Sistem harus menampilkan warning sync pending | SEDANG | Fase 2 |
| NTF-06 | Sistem harus mengirim notifikasi perubahan harga ke kasir | RENDAH | Fase 2 |

### 1.17 Modul Pengaturan (SET)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| SET-01 | Owner harus dapat mengelola profil toko (nama, alamat, logo, telepon) | TINGGI | MVP |
| SET-02 | Owner harus dapat mengelola info rekening bank | SEDANG | Fase 2 |
| SET-03 | Owner harus dapat upload/input QRIS | SEDANG | Fase 2 |
| SET-04 | Owner harus dapat mengatur printer thermal | TINGGI | MVP |
| SET-05 | Owner harus dapat mengkustomisasi format struk | SEDANG | MVP |
| SET-06 | Pengguna harus dapat memilih tema (light/dark) | RENDAH | Fase 3 |
| SET-07 | Owner harus dapat melakukan backup manual | SEDANG | Fase 3 |
| SET-08 | Owner harus dapat restore data dari backup | SEDANG | Fase 3 |

### 1.18 Modul Manajemen User (USR)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| USR-01 | Owner harus dapat menambah karyawan baru | TINGGI | MVP |
| USR-02 | Owner harus dapat mengatur role karyawan (Admin/Kasir) | TINGGI | MVP |
| USR-03 | Owner harus dapat reset password karyawan | TINGGI | MVP |
| USR-04 | Owner harus dapat menonaktifkan akses karyawan | TINGGI | MVP |
| USR-05 | Owner harus dapat melihat log aktivitas user | SEDANG | Fase 4 |

### 1.19 Modul Offline Mode (OFF)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| OFF-01 | Sistem harus dapat memproses transaksi tanpa internet | TINGGI | Fase 2 |
| OFF-02 | Sistem harus menampilkan indikator status online/offline | TINGGI | Fase 2 |
| OFF-03 | Sistem harus sync otomatis saat online kembali | TINGGI | Fase 2 |
| OFF-04 | Sistem harus menyediakan tombol sync manual | SEDANG | Fase 2 |
| OFF-05 | Sistem harus menampilkan counter transaksi pending sync | SEDANG | Fase 2 |
| OFF-06 | Sistem harus dapat mendeteksi dan menangani data conflict | TINGGI | Fase 2 |
| OFF-07 | Sistem harus menggunakan UUID untuk ID transaksi (mencegah duplikat) | TINGGI | Fase 2 |

### 1.20 Modul Multi-Cabang (BRN)

| ID | Kebutuhan | Prioritas | Fase |
|----|-----------|-----------|------|
| BRN-01 | Owner harus dapat menambah cabang baru | SEDANG | Fase 5 |
| BRN-02 | Owner harus dapat switch antar cabang | SEDANG | Fase 5 |
| BRN-03 | Owner harus dapat melihat laporan gabungan semua cabang | SEDANG | Fase 5 |
| BRN-04 | Owner harus dapat melihat laporan per cabang | SEDANG | Fase 5 |
| BRN-05 | Admin harus dapat melakukan transfer stok antar cabang | SEDANG | Fase 5 |
| BRN-06 | Owner harus dapat mengatur harga berbeda per cabang (opsional) | RENDAH | Fase 5 |

---

## 2. Kebutuhan Non-Fungsional

### 2.1 Performa

| ID | Kebutuhan |
|----|-----------|
| NFR-01 | Halaman kasir harus load dalam < 2 detik |
| NFR-02 | Pencarian produk harus menampilkan hasil dalam < 500ms |
| NFR-03 | Proses transaksi harus selesai dalam < 3 detik |
| NFR-04 | Dashboard harus load dalam < 3 detik |
| NFR-05 | Sistem harus mampu menangani 1000+ produk tanpa degradasi performa |

### 2.2 Keamanan

| ID | Kebutuhan |
|----|-----------|
| NFR-06 | Password harus dienkripsi dengan bcrypt (min. 10 rounds) |
| NFR-07 | PIN harus dienkripsi dan tidak ditampilkan dalam log |
| NFR-08 | Semua API harus menggunakan HTTPS |
| NFR-09 | Token JWT harus memiliki expiry time (default 7 hari) |
| NFR-10 | Data harga modal tidak boleh dikirim ke role Kasir |
| NFR-11 | Semua input harus divalidasi di server-side |
| NFR-12 | Rate limiting harus diterapkan untuk mencegah brute force |

### 2.3 Keandalan

| ID | Kebutuhan |
|----|-----------|
| NFR-13 | Sistem harus memiliki uptime 99.5% |
| NFR-14 | Backup otomatis harus berjalan setiap hari |
| NFR-15 | Transaksi harus atomic (all-or-nothing) |
| NFR-16 | Data historis transaksi tidak boleh diubah/dihapus |

### 2.4 Usabilitas

| ID | Kebutuhan |
|----|-----------|
| NFR-17 | Tugas umum harus dapat diselesaikan dalam ≤3 klik |
| NFR-18 | Error message harus jelas dan memberikan solusi |
| NFR-19 | Loading state harus ditampilkan untuk operasi > 1 detik |
| NFR-20 | Semua form harus memiliki validasi real-time |
| NFR-21 | Aksi destruktif harus memerlukan konfirmasi |

### 2.5 Kompatibilitas

| ID | Kebutuhan |
|----|-----------|
| NFR-22 | Website harus berjalan di Chrome, Firefox, Edge versi terbaru |
| NFR-23 | Website harus responsif untuk desktop (≥1366px) dan tablet (≥768px) |
| NFR-24 | App mobile harus berjalan di Android 7.0+ |
| NFR-25 | Sistem harus mendukung printer thermal 58mm dan 80mm |

---

## 3. Traceability Matrix

Setiap kebutuhan di atas akan dilacak ke:
- Desain database (tabel mana yang mendukung)
- API endpoint (endpoint mana yang mengimplementasikan)
- Komponen UI (halaman/komponen mana)
- Test case (pengujian mana yang memvalidasi)

Matrix lengkap akan diperbarui seiring pengembangan.

---

*Dokumen ini adalah bagian dari dokumentasi proyek GuGaramKu*
*Terakhir diperbarui: 02 November 2026*

# SEDOH KOPI — Modern Editorial QR Menu & Cashier System

Sistem pemesanan QR Code dan operasional kasir untuk warkop modern / café independen dengan identitas visual **Editorial Coffee Culture**, dibangun menggunakan **React + TypeScript + Tailwind CSS**, **Node.js / Vercel Serverless Functions**, dan **Neon PostgreSQL** via **Drizzle ORM**.

---

## ☕ Karakter & Design Direction — Modern Warkop × Editorial Premium

Desain dirancang khusus agar tampil otentik seperti produk digital dari café independen berkarakter, bukan template SaaS generik:

- **Color Tokens**:
  - `Cream Paper`: `#F5EFE5` (Latar utama hangat)
  - `Espresso`: `#34241C` (Warna teks dan brand utama)
  - `Roasted Brown`: `#896A50` (Aksen & ornamen visual)
  - `Oat Milk`: `#E5D8C7` (Badge dan kartu sekunder)
  - `Milk White`: `#FFFCF7` (Permukaan kartu elevated)
  - `Border`: `#D8C9B7` (Garis pemisah halus)
  - `Muted Text`: `#69574A` (Keterangan sekunder)
  - `Herbal Green`: `#42634A` (Status sukses & kesegaran)
- **Tipografi**:
  - *Headline & Editorial*: **DM Serif Display**
  - *Body, Harga, Form & Navigasi*: **DM Sans**
- **Aturan Anti-Template AI**: Tanpa gradien ungu/biru generik, tanpa glassmorphism berlebihan, tanpa emoji sebagai icon UI (menggunakan *Lucide Icons*), layout bernapas dengan ruang kosong yang disengaja.

---

## 📱 Alur Pelanggan (Customer Ordering Flow)

1. **Scan QR Code Unik di Meja**:
   - Memindai QR meja membuka URL `/?table=wrk_tbl_02_c4e17d` (atau `/t/:token`).
   - Sistem secara otomatis memverifikasi keaktifan meja di database dan menyematkan nomor meja di header.
2. **Katalog Menu & Kustomisasi**:
   - Navigasi kategori horizontal responsif (Kopi & Espresso, Non-Kopi, Makanan & Indomie, Camilan).
   - Pencarian real-time dan sorotan menu unggulan barista.
   - Penyesuaian preferensi per item melalui modal (contoh: *Less sugar*, *Tanpa es*, *Pedas sedang*).
3. **Keranjang Belanja Persisten**:
   - Disimpan di `localStorage` agar tidak hilang saat berpindah halaman atau me-refresh layar.
   - Drawer geser dengan kontrol kuantitas dan catatan khusus.
4. **Checkout Aman & Server-Validated**:
   - Total harga **selalu dihitung ulang di sisi server** berdasarkan database (mencegah manipulasi harga dari client).
   - Dilengkapi *Idempotency Key* untuk mencegah checkout ganda.
   - Pilihan metode pembayaran: **Cash** (Tunai di Kasir) atau **QRIS Statis**.
5. **Live Tracking Status Pesanan**:
   - Halaman `/order/:orderNumber` dengan stepper visual 4 tahap:
     1. *Menunggu Konfirmasi*
     2. *Sedang Diracik Barista*
     3. *Siap Diantar ke Meja*
     4. *Selesai*
   - Auto-polling setiap 5 detik agar status terbarui secara instan saat kasir memproses pesanan.
   - Petunjuk pembayaran QRIS statis atau nominal tunai yang harus diserahkan.

---

## 🛡️ Dashboard Kasir & Barista (`/admin`)

- **Autentikasi Aman**: Cookie sesi HttpOnly dengan token JWT terenkripsi (`jose` + `bcryptjs`).
- **Dashboard Ringkasan Operasional**: Metrik omset hari ini, pesanan baru, pesanan sedang diracik, menunggu pembayaran, dan antrean pesanan terkini.
- **Manajemen Pesanan Real-Time**:
  - Auto-polling 5 detik dengan badge counter di navigasi.
  - Tombol verifikasi pembayaran (Cash / QRIS).
  - Validasi alur transisi status ketat di backend (*Menunggu* &rarr; *Diproses* &rarr; *Siap Diantar* &rarr; *Selesai*).
  - Catatan preferensi pelanggan ditonjolkan untuk staf dapur.
- **Kelola Produk & Kategori**:
  - Tambah menu baru, ubah harga, ganti foto, atur produk unggulan.
  - Sakelar ketersediaan instan (*Tersedia / Habis*).
  - Perlindungan integritas: Produk yang memiliki histori pesanan tidak dihapus keras, melainkan dinonaktifkan otomatis agar snapshot riwayat pesanan pelanggan masa lalu tetap utuh.
- **Manajemen Meja & Generator QR Code**:
  - Tambah meja baru dan kelola keterangan lokasi meja.
  - Setiap meja memiliki token acak unik yang sulit ditebak.
  - Kemampuan meregenerasi token jika stiker fisik ingin diganti.
  - **Pratinjau QR Code**, tombol unduh format **PNG** & **SVG**, serta tombol **Cetak Mockup Stand Meja**.
- **Laporan Penjualan**:
  - Perhitungan omset nyata dari database.
  - Analisis pangsa metode bayar (Tunai vs QRIS).
  - Peringkat produk terlaris berdasarkan kuantitas pesanan nyata.

---

## 🗄️ Skema Database (Neon PostgreSQL & Drizzle ORM)

1. `admin_users`: Pengguna kasir dan manager (`admin`, `kasir`).
2. `categories`: Kategori menu dengan urutan tampil dan slug.
3. `products`: Daftar menu, harga dalam integer Rupiah, foto, ketersediaan, status unggulan.
4. `cafe_tables`: Daftar meja warkop, nomor meja unik, `qr_token` acak, status aktif.
5. `orders`: Pesanan utama, `order_number` unik, foreign key `table_id`, `status`, `payment_method`, `payment_status`, `total_amount`, `idempotency_key`.
6. `order_items`: Rincian item dengan **snapshot nama produk** dan **snapshot harga satuan** saat pesanan dibuat.

---

## 🚀 Panduan Menjalankan Proyek

### 1. Prasyarat
- Node.js versi 18+ (disarankan Node 20+)
- Akun Neon PostgreSQL (Connection string sudah terintegrasi)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Migrasi & Seed Data Awal
Jalankan skrip migrasi untuk membuat seluruh tabel dan menyuntikkan data menu, meja, serta akun kasir:
```bash
npx tsx server/db/migrate-and-seed.ts
```

### 4. Jalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser pada:
- **Pelanggan (Meja 02)**: [http://localhost:5174/?table=wrk_tbl_02_c4e17d](http://localhost:5174/?table=wrk_tbl_02_c4e17d)
- **Pelanggan (Pilihan Meja Manual)**: [http://localhost:5174/](http://localhost:5174/)
- **Dashboard Kasir**: [http://localhost:5174/admin/login](http://localhost:5174/admin/login)

### Kredensial Login Kasir:
- **Username**: `admin` | **Password**: `admin123`
- **Username**: `kasir` | **Password**: `kasir123`

### 5. Menjalankan Uji Otomatisasi (E2E Test)
Untuk memvalidasi seluruh alur dari pemesanan pelanggan, perhitungan total backend, tracking status, autentikasi kasir, hingga pelaporan:
```bash
npx tsx server/test-e2e.ts
```

### 6. Build Produksi & Deploy ke Vercel
```bash
npm run build
```
Konfigurasi `vercel.json` sudah disediakan untuk merutekan fungsi serverless API (`/api/*`) dan frontend SPA secara otomatis. Cukup tambahkan environment variable `DATABASE_URL` dan `JWT_SECRET` pada pengaturan proyek di Dashboard Vercel.

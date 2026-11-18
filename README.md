# Lost and Found UNKLAB

Portal web komunitas mahasiswa **Universitas Klabat (UNKLAB)** untuk melaporkan, mencari, mencocokkan (*Smart Matching*), memverifikasi klaim, dan mengembalikan barang yang hilang (*Lost*) maupun ditemukan (*Found*) di lingkungan kampus.

Aplikasi ini dirancang dengan sistem desain **SquareUp Figma Dark Theme** dan terhubung ke **Supabase** (PostgreSQL RPC + Supabase Storage) dengan dukungan peta interaktif **Google Maps / Leaflet**.

---

## ✨ Fitur Utama

1. **Landing Page Publik & Pratinjau Komunitas (`/`)**
   - Menampilkan statistik laporan, panduan 4 langkah pengembalian barang, laporan komunitas terbaru secara *real-time*, dan FAQ interaktif.
2. **Autentikasi Mahasiswa (`/login`)**
   - Mendukung akun demo mahasiswa UNKLAB (`student@unklab.ac.id` / `unklab123`) serta pengelolaan sesi aman.
3. **Dashboard Komunitas & Filter Lanjutan (`/app`)**
   - Pencarian cepat *real-time* (juga tersedia dari bilah navigasi atas di setiap halaman).
   - Filter berdasarkan **Tipe (`Lost` / `Found`)**, **Kategori**, **Lokasi Gedung Kampus UNKLAB**, **Rentang Tanggal (`Hari ini`, `7 hari terakhir`)**, dan **Status Laporan**.
   - **Peta Laporan Aktif Interaktif** yang menampilkan titik pin seluruh barang hilang dan temuan di kampus.
   - **Jejak Aktivitas Komunitas (Activity Feed)** terbaru untuk laporan dan klaim.
4. **Buat & Tinjau Laporan Barang (`/app/reports/new`)**
   - Pintasan langsung `+ Lapor Barang Hilang` (`?type=Lost`) dan `+ Lapor Barang Temuan` (`?type=Found`).
   - Pemilihan lokasi gedung kampus UNKLAB yang tersinkronisasi dengan **Pin Peta Interaktif** serta **validasi batas radius kampus (600 m)**.
   - Unggah foto barang ke **Supabase Storage** (`JPG`, `PNG`, `WebP` maks. 5 MB) disertai modal **Pratinjau Laporan (Review Modal)** sebelum diterbitkan.
5. **Smart Matching Laporan (`/app/matching`)**
   - Pencocokan pintar laporan pasangan (*Lost* ↔ *Found*) berdasarkan kategori, kedekatan titik koordinat kampus, dan kata kunci judul/deskripsi.
   - Menampilkan tingkat relevansi (**Tinggi**, **Sedang**, **Rendah**) beserta alasan kecocokan yang transparan.
6. **Sistem Klaim 4-Tahap, Chat Internal 2-Arah & Opt-In Nomor Telepon (`/app/my-claims` & `/app/claims/:id`)**
   - Tahapan klaim terstruktur: **Diajukan** → **Verifikasi Penemu** → **Serah Terima** → **Sudah Dikembalikan**.
   - Penanganan multi-pengklaim otomatis pada barang yang sama.
   - **Ruang Pesan Internal 2-Arah** antara pengaju klaim dan penemu barang untuk menyepakati lokasi & waktu serah terima di kampus.
   - **Persetujuan Berbagi Nomor Telepon Dua Pihak (Mutual Consent):** Nomor telepon tetap tersembunyi sampai kedua belah pihak mencentang persetujuan.
7. **Laporan Saya, Riwayat Status (Timeline), & Moderasi Komunitas (`/app/my-reports` & `/app/reports/:id`)**
   - Kelola laporan: **Edit Detail & Titik Peta**, **Ubah Status Cepat**, **Tutup / Batalkan Laporan dengan Pencatatan Alasan**, serta **Hapus Laporan**.
   - **Timeline Riwayat Status** yang mencatat setiap perubahan status beserta waktu, pelaku, dan alasannya.
   - **Aduan Penyalahgunaan Komunitas (Tanpa Admin):** Mahasiswa dapat melaporkan kiriman bermasalah, dan laporan otomatis ditutup jika menerima ≥ 3 aduan valid dari mahasiswa berbeda.
   - **Penutupan Otomatis Akhir Semester (90 Hari):** Laporan yang melewati masa aktif 90 hari otomatis ditutup oleh sistem.
8. **Notifikasi & Profil Mahasiswa (`/app/notifications` & `/app/profile`)**
   - Lonceng notifikasi dengan *badge* jumlah belum dibaca untuk klaim baru, perubahan status klaim, pesan ruang klaim, dan kandidat *Smart Matching* berelevansi Tinggi.
   - Pengelolaan nama tampilan dan nomor telepon privat dengan penyimpanan terstandarisasi (`+628...`).

---

## 📋 Prasyarat (Prerequisites)

1. **Node.js** — Versi **20.x LTS** atau lebih baru (`node -v`).
2. **npm** — Versi **10.x** atau lebih baru (`npm -v`).
3. **Browser Modern** — Chrome, Edge, Firefox, atau Safari.

---

## 🚀 Instalasi & Menjalankan Aplikasi

1. **Clone repositori:**
   ```bash
   git clone https://github.com/yoelkosenda/Lost-and-Found.git
   cd Lost-and-Found
   ```

2. **Instal dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables (`.env`):**
   Salin `.env.example` menjadi `.env` dan sesuaikan jika diperlukan:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-javascript-api-key
   ```
   *(Catatan: Jika `VITE_GOOGLE_MAPS_API_KEY` dikosongkan, peta otomatis menggunakan mode interaktif **Leaflet Dark Theme** tanpa memerlukan API key).*

4. **Jalankan aplikasi:**
   ```bash
   npm run dev
   ```
   Buka **`http://localhost:5173`** di browser Anda.

5. **Build untuk produksi:**
   ```bash
   npm run build
   ```

---

## 🔑 Akun Demo Mahasiswa

| Peran | Email Mahasiswa | Password |
| :--- | :--- | :--- |
| Mahasiswa (`student`) | `student@unklab.ac.id` | `unklab123` |

---

## 🗂️ Struktur Direktori Utama

```text
Lost-and-Found/
├── public/figma/            # Aset ikon SVG, logo, dan tekstur gelombang SquareUp Dark Theme
├── src/
│   ├── components/
│   │   ├── claims/          # ClaimAction & ClaimModal
│   │   ├── layout/          # AppNavbar (Global Search + Bell), AppFooter, ToastHost
│   │   ├── maps/            # GoogleMapPin (Google Maps JS SDK + Fallback Leaflet Interaktif)
│   │   ├── notifications/   # NotificationBell
│   │   └── reports/         # ReportEditModal, ReportReviewModal, ReportImagePreview, StatusHistory
│   ├── lib/
│   │   ├── api.js           # Satu-satunya adapter komunikasi RPC & Storage Supabase
│   │   ├── campusLocations.js # Titik koordinat 18 lokasi Kampus UNKLAB & validasi batas radius
│   │   ├── claimStatus.js   # Konfigurasi status klaim 4-tahap
│   │   ├── notifications.js # Helper event & format waktu notifikasi
│   │   ├── supabase.js      # Inisialisasi client Supabase
│   │   └── toast.js         # Sistem notifikasi toast aksesibel
│   ├── pages/               # Halaman tingkat rute (Landing, Login, Dashboard, CreateReport, dll.)
│   ├── styles/global.css    # Stylesheet utama SquareUp Figma Dark Theme
│   ├── App.jsx              # Definisi rute + Code-Splitting + Halaman 404
│   └── router.jsx           # Lightweight History API router (Link & navigate)
└── supabase/migrations/     # Skema SQL, RPC SECURITY DEFINER, Trigger, & Kebijakan Storage
```

# Lost and Found UNKLAB

Portal web komunitas mahasiswa **Universitas Klabat (UNKLAB)** untuk melaporkan, mencari, dan mengembalikan barang yang hilang (*Lost*) maupun ditemukan (*Found*) di lingkungan kampus. Aplikasi ini dilengkapi dengan *Landing Page* publik, halaman autentikasi mahasiswa, serta *Dashboard* utama yang terhubung ke backend Express dan database SQLite lokal.

---

## 📋 Prasyarat (Prerequisites)

Sebelum menjalankan proyek ini di komputer lokal, pastikan perangkat Anda telah memenuhi prasyarat berikut:

1. **Node.js** — Versi **20.x LTS** atau lebih baru (disarankan agar kompatibel dengan modul native `better-sqlite3` dan Vite terbaru).
   - Cek versi: `node -v`
2. **npm** — Versi **10.x** atau lebih baru (terinstal otomatis bersama Node.js).
   - Cek versi: `npm -v`
3. **Git** — Untuk melakukan *clone* repositori dan berpindah *branch*.
   - Cek versi: `git --version`
4. **Browser Modern** — Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari versi terbaru.
5. *(Opsional untuk Windows/macOS/Linux)* Jika `better-sqlite3` memerlukan kompilasi ulang pada arsitektur tertentu, pastikan C++ Build Tools (seperti *Visual Studio Build Tools* di Windows atau *Xcode Command Line Tools* di macOS) tersedia.

---

## 🚀 Instalasi & Menjalankan Aplikasi

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/yoelkosenda/Lost-and-Found.git
   cd Lost-and-Found
   ```

2. **(Opsional) Pilih branch tampilan yang diinginkan:**
   - Branch utama (desain editorial terang):
     ```bash
     git checkout main
     ```
   - Branch desain tema gelap (adaptasi template Figma):
     ```bash
     git checkout feature/figma-dark-design
     ```

3. **Instal seluruh dependensi:**
   ```bash
   npm install
   ```

4. **Jalankan aplikasi (Frontend + Backend sekaligus):**
   ```bash
   npm run dev
   ```
   Perintah `npm run dev` akan menjalankan dua layanan secara bersamaan menggunakan `concurrently`:
   - **Frontend (React + Vite):** `http://localhost:5173`
   - **Backend API (Express + SQLite):** `http://localhost:3001`

   > **Catatan:** Vite telah dikonfigurasi untuk mem-*proxy* seluruh permintaan `/api` ke server Express (`http://localhost:3001`), sehingga Anda cukup membuka **`http://localhost:5173`** di browser.

   Jika ingin menjalankan layanan secara terpisah di dua terminal:
   - Terminal 1 (Backend): `npm run dev:server`
   - Terminal 2 (Frontend): `npm run dev:client`

---

## 📖 Cara Menggunakan Aplikasi

### 1. Menjelajahi Halaman Publik (Landing Page — `/`)
- Buka `http://localhost:5173` di browser Anda.
- Pada halaman beranda, Anda dapat melihat ringkasan statistik komunitas, langkah-langkah cara kerja sistem, serta pratinjau laporan barang hilang/temuan terbaru di kampus UNKLAB.
- Klik tombol **"Masuk"** / **"Masuk Portal"** atau **"Mulai mencari"** untuk menuju halaman login.

### 2. Masuk ke Akun Mahasiswa (Login — `/login`)
- Gunakan akun demo mahasiswa lokal yang sudah disediakan secara otomatis oleh database *seed*:

| Peran | Email Mahasiswa | Password |
| :--- | :--- | :--- |
| Mahasiswa (`student`) | `student@unklab.ac.id` | `unklab123` |

- Anda dapat menekan tombol **"Tampilkan"** pada kolom password untuk memeriksa input password, lalu klik **"Masuk ke dashboard →"**.
- Sistem akan membuat sesi autentikasi berbasis *HTTP-only cookie* (`lf_session`) dan mengalihkan Anda ke halaman `/app`.

### 3. Menggunakan Dashboard Komunitas (`/app`)
Setelah berhasil masuk, Anda dapat mengakses fitur-fitur berikut di *Dashboard*:
- **Ringkasan Statistik:** Melihat jumlah laporan *Barang hilang* (`Lost`), *Barang ditemukan* (`Found`), dan *Total laporan* aktif di komunitas kampus.
- **Pencarian Laporan Real-Time:** Ketik nama barang, kategori, atau lokasi kampus (misalnya: `Dompet`, `AirPods`, `Perpustakaan`, `Student Center`, `Cafeteria`) pada kolom pencarian untuk menyaring daftar laporan secara langsung.
- **Filter Tipe Laporan:** Gunakan menu *dropdown* filter untuk menampilkan:
  - **Semua** — Seluruh laporan barang hilang dan temuan.
  - **Lost** — Hanya barang yang dilaporkan hilang (*Masih dicari*).
  - **Found** — Hanya barang temuan yang diamankan (*Menunggu pemilik*).
- **Memantau Status & Detail Kartu Laporan:** Setiap kartu laporan menampilkan tipe laporan, judul barang, kategori, titik lokasi kampus, tanggal pelaporan, dan label status teks yang jelas.
- **Keluar dari Sesi (Logout):** Klik tombol **"Keluar ↗"** di pojok kanan atas bilah navigasi untuk mengakhiri sesi dan kembali ke halaman beranda (`/`).

---

## 🗄️ Backend, Database & Reset Data Demo

- Backend berada di direktori `server/` menggunakan **Express** dan **SQLite** (`better-sqlite3`).
- Saat server pertama kali dijalankan, file database lokal dibuat otomatis di `server/data/lost-and-found.db` beserta tabel (`users`, `reports`, `claims`) dan data *seed* awal.
- File database lokal (`server/data/lost-and-found.db`) dan `.env` diabaikan oleh Git (`.gitignore`).
- **Cara Reset Data Demo:** Hentikan server (`Ctrl + C`), hapus file `server/data/lost-and-found.db`, lalu jalankan kembali `npm run dev`. Data awal akan dibuat ulang secara otomatis.

### Daftar Endpoint API Awal
| Method | Endpoint | Deskripsi | Autentikasi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Masuk dengan email & password mahasiswa | Publik |
| `POST` | `/api/auth/logout` | Menghapus sesi login (`lf_session`) | Cookie Sesi |
| `GET` | `/api/auth/me` | Mengambil profil mahasiswa yang sedang login | Cookie Sesi |
| `GET` | `/api/reports` | Mengambil daftar seluruh laporan terbaru | Cookie Sesi |

---

## 🛠️ Pemeriksaan Build Produksi

Untuk memastikan kode frontend dapat dikompilasi untuk produksi tanpa error:

```bash
npm run build
npm run preview
```

---

## 📁 Struktur Proyek Utama

```text
Lost-and-Found/
├── public/                 # Aset statis publik
├── server/
│   ├── index.js            # Server Express & endpoint API (/api/*)
│   ├── db.js               # Inisialisasi SQLite, skema tabel, & data seed
│   └── data/               # Lokasi file runtime SQLite (di-ignore Git)
├── src/
│   ├── components/         # Komponen UI modular
│   ├── lib/
│   │   └── api.js          # Adapter tunggal untuk komunikasi HTTP ke API
│   ├── pages/
│   │   ├── LandingPage.jsx # Halaman publik utama (/)
│   │   ├── LoginPage.jsx   # Halaman autentikasi mahasiswa (/login)
│   │   └── DashboardPage.jsx # Halaman utama aplikasi (/app)
│   ├── styles/
│   │   └── global.css      # Styling & sistem desain global
│   ├── App.jsx             # Pengaturan rute utama & sesi pengguna
│   ├── router.jsx          # Custom lightweight History API router
│   └── main.jsx            # Entry point aplikasi React
├── AGENTS.md               # Panduan aturan arsitektur proyek
└── package.json            # Konfigurasi skrip dan dependensi
```

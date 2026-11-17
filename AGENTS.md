# AGENTS.md — Panduan Utama untuk Coding Agent (Lost & Found UNKLAB)

Dokumen ini adalah **sumber aturan mutlak** untuk semua AI Coding Agent (Antigravity, Cursor, Claude Code, GitHub Copilot, Windsurf, dll.) yang bekerja di repositori ini. Semua agent wajib membaca dan mematuhi panduan ini sebelum mengubah atau menambahkan kode.

---

## 1. Ringkasan Proyek & Scope

- **Nama Proyek:** Lost & Found UNKLAB.
- **Tujuan:** Portal web mahasiswa untuk melaporkan, mencari, dan mengembalikan barang hilang/temuan di lingkungan kampus Universitas Klabat.
- **Peran Pengguna (Role):** **HANYA SATU PERAN: MAHASISWA (`student`)**.
  - ❌ **JANGAN** membuat peran Admin, staf, atau dashboard admin terpisah dalam fase ini.
  - ❌ **JANGAN** membuat fitur registrasi umum mandiri atau SSO eksternal (akun demo: `student@unklab.ac.id` / `unklab123`).

---

## 2. Aturan Keras Arsitektur (Hard Constraints)

### A. Routing & Navigasi (Frontend)
- Proyek ini menggunakan **custom lightweight router berbasis History API** di `src/router.jsx` (`navigate`, `Link`) dan penanganan rute di `src/App.jsx`.
- ❌ **DILARANG menginstal atau mengimpor `react-router-dom`**. Pertahankan router yang sudah ada. Daftarkan rute baru di `src/App.jsx`.

### B. Komunikasi HTTP & API Adapter
- ❌ **DILARANG memanggil `fetch()` secara langsung** di dalam komponen React (`src/pages/` atau `src/components/`).
- ✅ **SEMUA panggilan API WAJIB melalui adapter `src/lib/api.js`**.
  - Jika membuat endpoint backend baru, tambahkan method pembungkusnya di objek `export const api = { ... }` pada `src/lib/api.js`.

### C. Backend & Database
- **Server:** Express.js di `server/index.js` (port `3001`, diproxy oleh Vite via `vite.config.js` untuk path `/api`).
- **Database:** SQLite lokal via `better-sqlite3` di `server/db.js` (file runtime di `server/data/lost-and-found.db`).
  - Database di-ignore oleh Git.
  - Skema tabel inti: `users`, `reports`, `claims`.
- **Autentikasi:** Berbasis cookie session HTTP-only `lf_session`. Password disimpan dengan hash `bcryptjs`.
  - ❌ **JANGAN PERNAH** menyimpan atau mengembalikan password dalam bentuk plain text.
  - Endpoint yang membutuhkan identitas mahasiswa wajib menggunakan middleware `authenticate` (mengakses `req.userId`).

### D. Privasi & Keamanan Data
- ❌ **DILARANG** menampilkan nomor telepon pribadi, email pribadi, atau bukti kepemilikan rahasia pada kartu laporan yang bersifat publik.

---

## 3. Sistem Desain & Visual (SquareUp Figma Dark Theme)

Desain mengadaptasi estetika gelap **SquareUp Figma Dark Theme** (lihat detail lengkap di `docs/design-system.md`):
- **Warna Utama (`src/styles/global.css`):**
  - Background halaman: Karbon gelap `--bg-dark` (`#1a1a1a`) dan permukaan kartu `--bg-card` (`#1f1f1f`)
  - Garis batas struktural & kontrol: `--grey-15` (`#262626`), `--grey-20` (`#333333`), `--grey-30` (`#4c4c4d`)
  - Teks: Putih `--white` (`#ffffff`), abu terang `--grey-90` (`#e6e6e6`), dan metadata `--grey-60` (`#98989a`)
  - Aksi utama / CTA primer (`.sq-btn-lime`): Hijau limau elektrik `--green-50` (`#9eff00`), hover `--green-60` (`#b1ff33`), dengan teks gelap `#262626`
  - Aksen status (`.sq-status-badge`): Hijau neon `#9eff00` untuk `Found`, kuning hangat `#ffc470` untuk `Lost`
- **Tipografi:**
  - Judul, navigasi, tombol, statistik, dan kontrol: `Barlow` (`400`, `500`, `600`, `700`)
  - Deskripsi kartu dan kode laporan: `Inter` (`400`, `500`, `600`)
- **Arsitektur Kelas CSS & Aset:**
  - Gunakan prefix `.sq-*` (`.sq-page`, `.sq-navbar`, `.sq-container`, `.sq-section`, `.sq-section-banner`, `.sq-cta-banner`, `.sq-report-card`, `.sq-form-box`, `.sq-input-card`, `.sq-btn`).
  - Gunakan aset SVG dan tekstur gelombang yang tersedia di `public/figma/`.
- **Aturan UX:**
  - Status laporan **WAJIB selalu memiliki label teks** (misal: "Masih dicari", "Menunggu pemilik", "Sudah ditemukan"), **tidak boleh hanya warna**.
  - Semua tombol interaktif wajib memiliki teks atau `aria-label` yang jelas.
  - Desain harus responsif penuh pada breakpoint `1100px`, `800px`, dan `480px`.
  - Hormati preferensi `prefers-reduced-motion`.

---

## 4. Standar Kode & Git Flow

1. **Struktur Folder:**
   - `src/pages/`: Halaman tingkat rute (misal: `CreateReportPage.jsx`, `ReportDetailPage.jsx`, `MyReportsPage.jsx`).
   - `src/components/`: Komponen UI modular yang dapat digunakan ulang.
   - `src/lib/api.js`: Adapter panggilan API.
   - `server/`: Express API dan database helper.
   - `public/figma/`: Aset ikon SVG, logo kubus, dan tekstur banner tema gelap.
2. **Sebelum Membuat Pull Request / Selesai Bekerja:**
   - Jalankan `npm run build` dan pastikan build frontend berhasil 100% tanpa error kompilasi.
   - Pastikan file `server/data/lost-and-found.db`, file `.env`, atau `node_modules` tidak ter-commit ke git.
   - Buat perubahan terfokus sesuai task yang diberikan.

---

## 5. Daftar Spesifikasi Task untuk Anggota Tim

Jika Anda ditugaskan untuk mengerjakan salah satu fitur spesifik, buka dan ikuti panduan detail pada file berikut:
- **Tugas 1 (Buat Laporan Baru):** `docs/tasks/task-1-create-report.md`
- **Tugas 2 (Halaman Detail Laporan):** `docs/tasks/task-2-report-detail.md`
- **Tugas 3 (Laporan Saya & Kelola Status):** `docs/tasks/task-3-my-reports.md`
- **Tugas 4 (Sistem Pengajuan Klaim Barang):** `docs/tasks/task-4-claim-system.md`
- **Tugas 5 (Landing Page Dinamis & Activity Feed):** `docs/tasks/task-5-landing-and-activity.md`

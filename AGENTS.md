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

## 3. Sistem Desain & Visual (Talentflow Inspiration)

Desain mengikuti estetika editorial SaaS (terinspirasi dari template Talentflow Webflow):
- **Warna Utama:**
  - Background halaman: Krem hangat (`#f7f5ef`)
  - Teks & elemen struktural: Hijau hutan tua / ink (`#193529`)
  - Aksi utama / CTA primer: Hijau cerah (`#c9ee5b`) dengan teks `#193529`
  - Aksen status & kartu: Sage, peach (`#fff0e7`), mint (`#e5f2ed`), lavender (`#eee9fb`), soft yellow (`#fff6da`)
- **Tipografi:**
  - Judul / Display Heading: `DM Serif Display`
  - Body text, label, tombol, kontrol: `DM Sans`
- **Aturan UX:**
  - Status laporan **WAJIB selalu memiliki label teks** (misal: "Masih dicari", "Menunggu pemilik", "Sudah ditemukan"), **tidak boleh hanya warna**.
  - Semua tombol interaktif wajib memiliki teks atau `aria-label` yang jelas.
  - Desain harus responsif (ramah tampilan mobile layar < 800px).
  - Hormati preferensi `prefers-reduced-motion`.

---

## 4. Standar Kode & Git Flow

1. **Struktur Folder:**
   - `src/pages/`: Halaman tingkat rute (misal: `CreateReportPage.jsx`, `ReportDetailPage.jsx`, `MyReportsPage.jsx`).
   - `src/components/`: Komponen UI modular yang dapat digunakan ulang.
   - `src/lib/api.js`: Adapter panggilan API.
   - `server/`: Express API dan database helper.
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

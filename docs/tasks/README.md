# Panduan Pembagian Tugas Tim, Alur Git, & Prompt AI (5 Anggota)

Dokumen ini berisi panduan lengkap untuk **5 anggota tim** proyek **Lost & Found UNKLAB**, mulai dari cara membuat branch baru, memberikan prompt ke AI Coding Agent (Antigravity, Cursor, Claude Code, Windsurf, GitHub Copilot), menguji aplikasi, hingga membuat **Pull Request (PR)** ke branch `main`.

---

## 📋 Ringkasan Pembagian Tugas (5 Anggota)

| Anggota | Task | Nama Fitur | Nama Branch Git | File Spesifikasi |
| :--- | :--- | :--- | :--- | :--- |
| **Anggota 1** | Task 1 | Buat Laporan Baru (*Create Report*) | `feature/create-report` | [task-1-create-report.md](task-1-create-report.md) |
| **Anggota 2** | Task 2 | Halaman Detail Laporan (*Report Detail*) | `feature/report-detail` | [task-2-report-detail.md](task-2-report-detail.md) |
| **Anggota 3** | Task 3 | Laporan Saya & Kelola Status (*My Reports*) | `feature/my-reports` | [task-3-my-reports.md](task-3-my-reports.md) |
| **Anggota 4** | Task 4 | Sistem Pengajuan Klaim (*Claim System*) | `feature/claim-system` | [task-4-claim-system.md](task-4-claim-system.md) |
| **Anggota 5** | Task 5 | Landing Page Dinamis & Activity Feed | `feature/landing-and-activity` | [task-5-landing-and-activity.md](task-5-landing-and-activity.md) |

---

## 🚀 Langkah-Langkah Lengkap: Dari Buat Branch Baru Sampai Pull Request

Setiap anggota tim **WAJIB** mengikuti tahapan berikut secara berurutan agar tidak terjadi konflik kode (*merge conflict*):

### Langkah 1: Clone (Jika Belum) atau Tarik Kode Terbaru dari `main`
Buka terminal (PowerShell / Command Prompt / Git Bash) dan jalankan:

```bash
# Jika baru pertama kali mengambil project:
git clone https://github.com/yoelkosenda/Lost-and-Found.git
cd Lost-and-Found

# Jika sudah pernah clone sebelumnya, pastikan berada di branch main terbaru:
git checkout main
git pull origin main
```

### Langkah 2: Buat Branch Baru Sesuai Tugas Anda
Jangan pernah bekerja langsung di branch `main`. Buat branch baru sesuai pembagian tugas Anda:

```bash
# Pilih SATU sesuai tugas Anda:
git checkout -b feature/create-report          # Untuk Anggota 1
git checkout -b feature/report-detail          # Untuk Anggota 2
git checkout -b feature/my-reports             # Untuk Anggota 3
git checkout -b feature/claim-system           # Untuk Anggota 4
git checkout -b feature/landing-and-activity   # Untuk Anggota 5
```

### Langkah 3: Instal Dependensi & Jalankan Aplikasi Lokal
Pastikan paket sudah terinstal dan aplikasi berjalan normal sebelum mulai mengubah kode:

```bash
npm install
npm run dev
```
- Buka `http://localhost:5173` di browser.
- Gunakan akun demo: **`student@unklab.ac.id`** / **`unklab123`**.

### Langkah 4: Jalankan Prompt di AI Coding Agent Anda
Salin (*copy-paste*) **Prompt Khusus Anggota** yang sesuai dengan nomor tugas Anda pada bagian di bawah dokumen ini, lalu kirimkan ke AI Coding Agent Anda (Antigravity / Cursor / Claude Code / Copilot).

### Langkah 5: Periksa Hasil & Pastikan Build Berhasil
Setelah fitur selesai dibuat, uji tampilan di browser (`http://localhost:5173`) dan jalankan perintah validasi wajib berikut:

```bash
npm run build
```
> ⚠️ **Penting:** Pastikan `npm run build` sukses **100% tanpa error**.

### Langkah 6: Cek Status File, Commit, dan Push ke GitHub
Pastikan file database lokal (`server/data/lost-and-found.db`) atau `.env` tidak ikut ter-stage:

```bash
git status
git add .
git commit -m "feat: implementasi sesuai task anggota"
git push -u origin <nama-branch-anda>
```
*(Contoh untuk Anggota 1: `git push -u origin feature/create-report`)*

### Langkah 7: Buat Pull Request (PR) di GitHub
1. Buka repositori GitHub: `https://github.com/yoelkosenda/Lost-and-Found`
2. Klik tombol kuning **"Compare & pull request"** yang muncul di bagian atas halaman (atau buka tab **Pull requests** → **New pull request**).
3. Pastikan:
   - **base:** `main`
   - **compare:** `<nama-branch-anda>` (misal: `feature/create-report`)
4. Isi judul PR (contoh: `feat(report): tambah halaman dan endpoint buat laporan baru`) dan deskripsi singkat apa saja yang dikerjakan.
5. Klik **"Create pull request"** dan beritahu ketua tim untuk direview.

---

## 🤖 Kumpulan Prompt Siap Pakai untuk 5 Anggota Tim

Salin (*copy-paste*) kotak prompt sesuai nomor tugas Anda langsung ke chat AI Coding Agent.

---

### 👤 Prompt Anggota 1 — Task 1: Buat Laporan Baru (`feature/create-report`)

```text
Tolong baca file AGENTS.md, docs/design-system.md, dan docs/tasks/task-1-create-report.md terlebih dahulu, lalu kerjakan seluruh spesifikasi Task 1 (Fitur Pembuatan Laporan Baru) sampai tuntas.

Aturan wajib yang harus dipatuhi:
1. Hanya ada 1 peran pengguna: Mahasiswa (student). Jangan membuat fitur admin.
2. Gunakan custom router yang sudah ada di src/router.jsx (Link, navigate) dan daftarkan rute /app/reports/new di src/App.jsx. DILARANG menginstal react-router-dom.
3. Buat endpoint POST /api/reports di server/index.js dengan middleware authenticate dan validasi field (type, title, category, location, description). Set status otomatis menjadi 'Masih dicari' untuk Lost dan 'Menunggu pemilik' untuk Found.
4. Tambahkan fungsi createReport(data) di src/lib/api.js. Jangan memanggil fetch() langsung di komponen React.
5. Buat halaman src/pages/CreateReportPage.jsx menggunakan sistem desain SquareUp Figma Dark Theme yang sudah ada di src/styles/global.css (gunakan class .sq-page, .sq-navbar dengan logo /figma/logo-cube.svg, .sq-container, .sq-cta-banner, .sq-login-shell, .sq-form-box, .sq-input-card, .sq-input-label, .sq-form-error, dan tombol .sq-btn.sq-btn-lime).
6. Hubungkan tombol "+ Buat laporan" (.sq-btn-lime) di src/pages/DashboardPage.jsx agar mengarahkan ke /app/reports/new, dan setelah form berhasil disubmit arahkan kembali ke /app.
7. Setelah selesai, jalankan npm run build untuk memastikan tidak ada error kompilasi.
```

---

### 👤 Prompt Anggota 2 — Task 2: Halaman Detail Laporan (`feature/report-detail`)

```text
Tolong baca file AGENTS.md, docs/design-system.md, dan docs/tasks/task-2-report-detail.md terlebih dahulu, lalu kerjakan seluruh spesifikasi Task 2 (Halaman Detail Laporan Barang) sampai tuntas.

Aturan wajib yang harus dipatuhi:
1. Hanya ada 1 peran pengguna: Mahasiswa (student). Jangan menampilkan password_hash atau nomor telepon pribadi.
2. Gunakan custom router yang sudah ada di src/router.jsx (Link, navigate) dan tangani rute dinamis /app/reports/:id menggunakan regex di src/App.jsx. DILARANG menginstal react-router-dom.
3. Buat endpoint GET /api/reports/:id di server/index.js dengan middleware authenticate yang melakukan JOIN tabel reports dan users untuk mengambil nama pelapor (owner_name), serta mengembalikan 404 jika ID tidak ditemukan.
4. Tambahkan fungsi report(id) di src/lib/api.js. Jangan memanggil fetch() langsung di komponen React.
5. Buat halaman src/pages/ReportDetailPage.jsx menggunakan sistem desain SquareUp Figma Dark Theme di src/styles/global.css (gunakan class .sq-page, .sq-navbar, .sq-container, .sq-section, .sq-status-badge, .sq-work-visual dengan .sq-visual-orb, .sq-work-pill, .sq-state untuk loading/error, serta tombol .sq-btn.sq-btn-lime dan .sq-btn-outline).
6. Jika laporan bertipe Found, tampilkan tombol CTA "Ajukan Klaim Barang Ini" (.sq-btn-lime). Jika bertipe Lost, tampilkan kartu panduan koordinasi pengembalian di kampus.
7. Ubah kartu laporan (.sq-report-card) di src/pages/DashboardPage.jsx agar dapat diklik dan mengarahkan pengguna ke /app/reports/${r.id}.
8. Setelah selesai, jalankan npm run build untuk memastikan tidak ada error kompilasi.
```

---

### 👤 Prompt Anggota 3 — Task 3: Laporan Saya & Kelola Status (`feature/my-reports`)

```text
Tolong baca file AGENTS.md, docs/design-system.md, dan docs/tasks/task-3-my-reports.md terlebih dahulu, lalu kerjakan seluruh spesifikasi Task 3 (Halaman Laporan Saya & Kelola Status) sampai tuntas.

Aturan wajib yang harus dipatuhi:
1. Hanya ada 1 peran pengguna: Mahasiswa (student).
2. Gunakan custom router di src/router.jsx (Link, navigate) dan daftarkan rute /app/my-reports di src/App.jsx. DILARANG menginstal react-router-dom.
3. Buat endpoint GET /api/reports/my dan PATCH /api/reports/:id/status di server/index.js dengan middleware authenticate. Pastikan PATCH memverifikasi owner_id === req.userId (kembalikan HTTP 403 jika bukan pemilik laporan).
4. Tambahkan fungsi myReports() dan updateReportStatus(id, status) di src/lib/api.js. Jangan memanggil fetch() langsung di komponen React.
5. Buat halaman src/pages/MyReportsPage.jsx menggunakan sistem desain SquareUp Figma Dark Theme di src/styles/global.css (gunakan class .sq-page, .sq-navbar, .sq-container, .sq-dash-hero, .sq-dash-stats dengan 3 .sq-stat-card untuk Total/Aktif/Selesai, .sq-dash-toolbar untuk filter tipe, .sq-report-grid, .sq-report-card, .sq-status-badge, dan .sq-state untuk empty state).
6. Sediakan tombol aksi pada setiap kartu milik user untuk mengubah status laporan menjadi "Sudah ditemukan" / "Sudah dikembalikan" (.sq-btn-lime) atau "Dibatalkan / Ditutup" (.sq-btn-outline).
7. Tambahkan link navigasi "Laporan Saya" pada .sq-nav-links di src/pages/DashboardPage.jsx.
8. Setelah selesai, jalankan npm run build untuk memastikan tidak ada error kompilasi.
```

---

### 👤 Prompt Anggota 4 — Task 4: Sistem Pengajuan Klaim (`feature/claim-system`)

```text
Tolong baca file AGENTS.md, docs/design-system.md, dan docs/tasks/task-4-claim-system.md terlebih dahulu, lalu kerjakan seluruh spesifikasi Task 4 (Sistem Pengajuan Klaim Barang Temuan) sampai tuntas.

Aturan wajib yang harus dipatuhi:
1. Hanya ada 1 peran pengguna: Mahasiswa (student). Bukti kepemilikan klaim bersifat rahasia dan tidak boleh ditampilkan pada kartu laporan publik.
2. Gunakan custom router di src/router.jsx (Link, navigate) dan daftarkan rute /app/my-claims di src/App.jsx. DILARANG menginstal react-router-dom.
3. Di server/db.js, pastikan tabel claims memiliki kolom message (gunakan ALTER TABLE claims ADD COLUMN message TEXT DEFAULT '' dengan try/catch).
4. Di server/index.js, buat endpoint POST /api/claims (validasi barang bertipe Found, message minimal 10 karakter, user tidak mengklaim laporan miliknya sendiri, dan cegah duplikasi klaim pending) serta GET /api/claims/my dengan middleware authenticate.
5. Tambahkan fungsi createClaim(report_id, message) dan myClaims() di src/lib/api.js. Jangan memanggil fetch() langsung di komponen React.
6. Buat komponen/modal form pengajuan klaim dan halaman riwayat klaim src/pages/MyClaimsPage.jsx menggunakan sistem desain SquareUp Figma Dark Theme di src/styles/global.css (gunakan .sq-page, .sq-navbar, .sq-container, .sq-form-box, .sq-input-card, .sq-input-label, .sq-report-card, .sq-status-badge, serta tombol .sq-btn-lime dan .sq-btn-outline).
7. Integrasikan tombol/modal klaim pada kartu atau halaman detail laporan bertipe Found serta tambahkan tautan "Klaim Saya" (/app/my-claims) di navigasi dashboard.
8. Setelah selesai, jalankan npm run build untuk memastikan tidak ada error kompilasi.
```

---

### 👤 Prompt Anggota 5 — Task 5: Landing Page Dinamis & Activity Feed (`feature/landing-and-activity`)

```text
Tolong baca file AGENTS.md, docs/design-system.md, dan docs/tasks/task-5-landing-and-activity.md terlebih dahulu, lalu kerjakan seluruh spesifikasi Task 5 (Landing Page Dinamis, Activity Feed Dashboard, & Standarisasi CSS) sampai tuntas.

Aturan wajib yang harus dipatuhi:
1. Hanya ada 1 peran pengguna: Mahasiswa (student). Jangan membocorkan data sensitif pada endpoint publik.
2. Gunakan custom router di src/router.jsx. DILARANG menginstal react-router-dom.
3. Di server/index.js, buat endpoint publik GET /api/reports/public (tanpa auth, mengambil 4 laporan terbaru untuk preview landing page) dan endpoint terproteksi GET /api/activities (dengan middleware authenticate, menggabungkan aktivitas terbaru dari tabel reports dan claims).
4. Tambahkan fungsi publicReports() dan activities() di src/lib/api.js. Jangan memanggil fetch() langsung di komponen React.
5. Di src/pages/LandingPage.jsx, panggil api.publicReports() saat komponen dimuat dan render datanya ke dalam grid .sq-works-grid menggunakan struktur .sq-work-card SquareUp Figma Dark Theme (dengan fallback ke data preview jika API masih memuat).
6. Di src/pages/DashboardPage.jsx, panggil api.activities() dan tampilkan feed aktivitas komunitas secara dinamis pada section #aktivitas menggunakan gaya kartu/grid berbingkai gelap SquareUp (.sq-section, .sq-icon-badge.sm, .sq-status-badge) tanpa menghilangkan estetika tema gelap (#1a1a1a & #9eff00).
7. Pastikan seluruh styling tambahan di src/styles/global.css rapi, memakai variabel CSS :root yang ada, dan responsif di breakpoint 1100px, 800px, serta 480px.
8. Setelah selesai, jalankan npm run build untuk memastikan tidak ada error kompilasi.
```

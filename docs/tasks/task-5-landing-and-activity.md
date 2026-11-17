# Task 5: Landing Page Dinamis, Activity Feed, & Standarisasi CSS

**Nama Branch:** `feature/landing-and-activity`  
**Target File:** `src/pages/LandingPage.jsx`, `src/pages/DashboardPage.jsx`, `src/styles/global.css`, `server/index.js`  
**Prasyarat Dokumen:** Baca `AGENTS.md` dan `docs/design-system.md` sebelum memulai.

---

## 1. Tujuan Fitur
1. Menghubungkan bagian **Laporan Terbaru Komunitas** pada Landing Page publik (`/`) ke data laporan nyata dari database SQLite (dengan fallback ke data preview jika API belum mengembalikan data).
2. Membangun panel **Aktivitas Komunitas (Activity Feed)** nyata pada dashboard mahasiswa `/app` di bagian `#aktivitas` dengan gaya grid berbingkai SquareUp Dark Theme.
3. Menjaga struktur `src/styles/global.css` tetap rapi, modular, dan terdokumentasi sesuai token SquareUp Figma Dark Theme.

---

## 2. Pekerjaan Backend & API

### A. Endpoint Laporan Publik (Tanpa Auth)
Buka `server/index.js` dan tambahkan endpoint publik untuk preview landing page:
- **Method:** `GET`
- **URL:** `/api/reports/public`
- **Otorisasi:** **Publik (TIDAK memerlukan middleware `authenticate`)**.
- **Logika Database:**
  - Ambil 4 laporan terbaru yang aktif (sesuai grid 2x2 `.sq-works-grid` di `LandingPage.jsx`):
    ```sql
    SELECT id, type, title, category, location, description, status, reported_at 
    FROM reports 
    ORDER BY reported_at DESC 
    LIMIT 4
    ```
  - Kembalikan HTTP `200` dengan JSON `{ "reports": reports }`.

### B. Endpoint Riwayat Aktivitas Komunitas
Buka `server/index.js` dan buat endpoint dengan middleware `authenticate`:
- **Method:** `GET`
- **URL:** `/api/activities`
- **Logika Database:**
  - Gabungkan log aktivitas terbaru dari laporan dan klaim:
    ```sql
    SELECT 'report' AS activity_type, id, title, type AS item_type, location, status, reported_at AS created_at
    FROM reports
    UNION ALL
    SELECT 'claim' AS activity_type, c.id, r.title, 'Claim' AS item_type, r.location, c.status, c.submitted_at AS created_at
    FROM claims c
    JOIN reports r ON c.report_id = r.id
    ORDER BY created_at DESC
    LIMIT 6
    ```
  - Kembalikan HTTP `200` dengan JSON `{ "activities": activities }`.

### C. Perbarui API Adapter di Frontend
Buka `src/lib/api.js` dan tambahkan fungsi:
```javascript
export const api = {
  // ... fungsi yang sudah ada
  publicReports: () => request('/api/reports/public'),
  activities: () => request('/api/activities'),
}
```

---

## 3. Pekerjaan Frontend (Tema Gelap SquareUp Figma)

### A. Landing Page Dinamis (`src/pages/LandingPage.jsx`)
- Pada saat komponen `LandingPage` dimuat (`useEffect`), panggil `api.publicReports()`.
- Render data laporan dari API ke dalam `<div className="sq-works-grid">` menggunakan struktur `.sq-work-card`:
  - `.sq-work-header`: Menampilkan tipe & lokasi serta `<em className={`sq-status-badge ${item.type.toLowerCase()}`}>{item.status}</em>`.
  - `.sq-work-visual`: Menampilkan `.sq-visual-tag` (`BARANG DITEMUKAN` / `BARANG HILANG`), kode `#LF-${item.id}`, `.sq-visual-orb` dengan ikon `/figma/icon-service-2.svg` (Found) atau `/figma/icon-service-1.svg` (Lost), judul, dan status.
  - `.sq-work-meta` & `.sq-work-desc`: Menampilkan judul, `.sq-work-pill` (`{category} · {location}`), tombol panah `.sq-icon-action` ke `/login`, dan deskripsi laporan.
- Pertahankan `previewReports` sebagai fallback awal saat data sedang dimuat atau jika terjadi gangguan jaringan agar tampilan beranda tidak pernah kosong.

### B. Activity Feed Nyata di Dashboard (`src/pages/DashboardPage.jsx`)
- Panggil `api.activities()` di `DashboardPage.jsx`.
- Pada bagian `<section id="aktivitas">`, tampilkan daftar aktivitas terbaru di dalam grid berbingkai gelap (misalnya menggunakan `.sq-section` + `.sq-why-grid` / `.sq-activity-grid` di atas atau bersama `.sq-cta-banner`):
  - Setiap item aktivitas menampilkan `.sq-icon-badge.sm` (ikon laporan atau klaim), judul aktivitas, lokasi/status (`.sq-status-badge`), dan penanda waktu (`created_at`).
  - *Contoh Laporan:* `"Laporan Barang Hilang baru: Dompet kulit cokelat di Student Center"`
  - *Contoh Klaim:* `"Pengajuan klaim baru untuk: AirPods putih"`

### C. Standarisasi Styling di `src/styles/global.css`
- Pastikan seluruh styling komponen baru (timeline aktivitas, kartu klaim, dll.) menggunakan variabel CSS yang sudah ada di `:root`:
  - `--bg-dark` (`#1a1a1a`), `--bg-card` (`#1f1f1f`), `--grey-15` (`#262626`), `--grey-20` (`#333333`), `--grey-60` (`#98989a`), `--grey-90` (`#e6e6e6`), `--white` (`#ffffff`), `--green-50` (`#9eff00`), `--green-70` (`#c5ff66`), dan `--icon-gradient`.
- ⚠️ **PENTING:** Jangan mengubah nilai token warna utama, font (`Barlow` & `Inter`), atau merusak layout responsif pada breakpoint `1100px`, `800px`, dan `480px`.

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Landing page (`/`) menampilkan kartu `.sq-work-card` yang bersumber langsung dari database SQLite melalui `GET /api/reports/public`.
- [ ] Section `#aktivitas` di dashboard (`/app`) menampilkan event laporan/klaim terbaru secara dinamis dari `GET /api/activities`.
- [ ] Seluruh elemen baru mengikuti **SquareUp Figma Dark Theme** di `src/styles/global.css` dan responsif di layar mobile.
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

---

## 5. Langkah-Langkah Git (Dari Buat Branch Baru Sampai Pull Request)

Ikuti langkah berikut secara berurutan di terminal:

```bash
# 1. Pastikan berada di branch main terbaru
git checkout main
git pull origin main

# 2. Buat branch baru khusus Task 5
git checkout -b feature/landing-and-activity

# 3. Instal dependensi & jalankan server lokal untuk pengujian
npm install
npm run dev

# 4. Setelah fitur selesai dikerjakan, wajib uji build produksi
npm run build

# 5. Periksa file yang berubah (pastikan server/data/lost-and-found.db tidak ikut)
git status

# 6. Simpan perubahan (commit) dan push branch ke GitHub
git add .
git commit -m "feat(activity): integrasi laporan publik landing page dan activity feed dashboard"
git push -u origin feature/landing-and-activity
```

**Cara Membuat Pull Request (PR) di GitHub:**
1. Buka repositori `https://github.com/yoelkosenda/Lost-and-Found` di browser.
2. Klik tombol **"Compare & pull request"** untuk branch `feature/landing-and-activity` (pastikan **base:** `main` ← **compare:** `feature/landing-and-activity`).
3. Beri judul PR: `feat(activity): integrasi laporan publik landing page dan activity feed dashboard`, isi deskripsi singkat, lalu klik **"Create pull request"**.

---

## 6. Prompt Siap Pakai untuk AI Coding Agent (Copy-Paste)

Salin (*copy-paste*) prompt di bawah ini langsung ke AI Coding Agent Anda (Antigravity / Cursor / Claude Code / Copilot):

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

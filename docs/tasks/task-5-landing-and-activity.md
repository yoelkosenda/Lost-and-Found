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

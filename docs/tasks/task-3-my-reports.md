# Task 3: Halaman Laporan Saya & Kelola Status (My Reports)

**Nama Branch:** `feature/my-reports`  
**Target Rute:** `/app/my-reports`  
**Prasyarat Dokumen:** Baca `AGENTS.md` dan `docs/design-system.md` sebelum memulai.

---

## 1. Tujuan Fitur
Memungkinkan mahasiswa melihat semua laporan yang pernah mereka buat sendiri, memantau perkembangannya, serta mengubah status laporan (misalnya: menandai barang telah ditemukan/dikembalikan atau menutup laporan yang sudah selesai).

---

## 2. Pekerjaan Backend & API

### A. Endpoint Mengambil Laporan Milik Sendiri
Buka `server/index.js` dan buat endpoint dengan middleware `authenticate`:
- **Method:** `GET`
- **URL:** `/api/reports/my`
- **Logika Database:**
  - Ambil semua laporan yang `owner_id`-nya sama dengan `req.userId`:
    ```sql
    SELECT id, type, title, category, location, description, status, reported_at, image_url 
    FROM reports 
    WHERE owner_id = ? 
    ORDER BY reported_at DESC
    ```
  - Kembalikan HTTP `200` dengan JSON `{ "reports": reports }`.

### B. Endpoint Memperbarui Status Laporan
Buka `server/index.js` dan tambahkan endpoint pembaruan status:
- **Method:** `PATCH`
- **URL:** `/api/reports/:id/status`
- **Request Body (JSON):**
  ```json
  {
    "status": "Sudah ditemukan" // misal: "Sudah ditemukan", "Sudah dikembalikan", atau "Dibatalkan / Ditutup"
  }
  ```
- **Validasi & Otorisasi:**
  - Pastikan `status` tidak kosong.
  - Periksa kepemilikan: Laporan harus memiliki `owner_id == req.userId`. Jika bukan pemiliknya, tolak dengan HTTP `403` `{ "error": "Anda tidak memiliki izin mengubah laporan ini." }`.
- **Logika Database:**
  - Update kolom status di tabel `reports`:
    ```sql
    UPDATE reports SET status = ? WHERE id = ? AND owner_id = ?
    ```
  - Kembalikan HTTP `200` dengan JSON `{ "report": updatedReport }`.

### C. Perbarui API Adapter di Frontend
Buka `src/lib/api.js` dan tambahkan fungsi:
```javascript
export const api = {
  // ... fungsi yang sudah ada
  myReports: () => request('/api/reports/my'),
  updateReportStatus: (id, status) => request(`/api/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}
```

---

## 3. Pekerjaan Frontend (Tema Gelap SquareUp Figma)

### A. Buat Halaman: `src/pages/MyReportsPage.jsx`
1. **Header & Navigasi (`.sq-page` & `.sq-navbar`):**
   - Gunakan `.sq-navbar` dengan `.sq-nav-links` yang memuat `<Link to="/app" className="sq-nav-item">Dashboard</Link>` dan `<Link to="/app/my-reports" className="sq-nav-item active">Laporan Saya</Link>`.
2. **Banner & Statistik Pribadi (`.sq-dash-hero` & `.sq-dash-stats`):**
   - Tampilkan banner header dengan `.sq-kicker-pill` (`KELOLA LAPORAN SAYA`) dan judul halaman.
   - Tampilkan 3 kartu ringkasan `.sq-stat-card` di dalam `.sq-dash-stats`: Total Laporan Anda, Laporan Aktif, dan Laporan Selesai.
3. **Filter Toolbar (`.sq-dash-toolbar`):**
   - Sediakan filter tab atau `.sq-select-field` untuk menyaring: `Semua`, `Lost (Barang Hilang)`, dan `Found (Barang Ditemukan)`.
4. **Daftar Kartu Laporan (`.sq-report-grid` & `.sq-report-card`):**
   - Tampilkan detail barang, tanggal pelaporan (`.sq-report-date`), pill lokasi (`.sq-work-pill`), dan badge status teks (`.sq-status-badge`).
   - **Tombol Aksi Pemilik** di bagian bawah kartu:
     - Tombol `.sq-btn sq-btn-lime` `"Tandai Selesai / Ditemukan"` (mengubah status menjadi `Sudah ditemukan` atau `Sudah dikembalikan`).
     - Tombol `.sq-btn sq-btn-outline` `"Tutup Laporan"` (mengubah status menjadi `Dibatalkan / Ditutup`).
     - Berikan konfirmasi sebelum status diubah.
5. **Empty State (`.sq-state`):**
   - Jika belum ada laporan: tampilkan pesan ramah di dalam `.sq-state` beserta tombol `.sq-btn sq-btn-lime` `"+ Buat Laporan Pertama"` yang mengarahkan ke `/app/reports/new`.

### B. Hubungkan Navigasi di Dashboard
Buka `src/pages/DashboardPage.jsx`:
- Pada bagian `<nav className="sq-nav-links">` di `.sq-navbar`, tambahkan link navigasi ke halaman ini:
  ```jsx
  <Link to="/app/my-reports" className="sq-nav-item">Laporan Saya</Link>
  ```

### C. Daftarkan Rute di `src/App.jsx`
Di `src/App.jsx`, tambahkan rute baru:
```jsx
if (path === '/app/my-reports') return user ? <MyReportsPage user={user} onLogout={logout} /> : <Redirect to="/login" />
```

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Pengguna dapat mengakses halaman `/app/my-reports` dari `.sq-navbar` di dashboard.
- [ ] Halaman hanya menampilkan laporan milik mahasiswa yang sedang login dengan gaya SquareUp Dark Theme.
- [ ] Pengguna dapat memperbarui status laporan miliknya menjadi selesai atau ditutup.
- [ ] Upaya mengubah laporan orang lain ditolak oleh backend (HTTP 403).
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

---

## 5. Langkah-Langkah Git (Dari Buat Branch Baru Sampai Pull Request)

Ikuti langkah berikut secara berurutan di terminal:

```bash
# 1. Pastikan berada di branch main terbaru
git checkout main
git pull origin main

# 2. Buat branch baru khusus Task 3
git checkout -b feature/my-reports

# 3. Instal dependensi & jalankan server lokal untuk pengujian
npm install
npm run dev

# 4. Setelah fitur selesai dikerjakan, wajib uji build produksi
npm run build

# 5. Periksa file yang berubah (pastikan server/data/lost-and-found.db tidak ikut)
git status

# 6. Simpan perubahan (commit) dan push branch ke GitHub
git add .
git commit -m "feat(my-reports): tambah halaman laporan saya dan kelola status"
git push -u origin feature/my-reports
```

**Cara Membuat Pull Request (PR) di GitHub:**
1. Buka repositori `https://github.com/yoelkosenda/Lost-and-Found` di browser.
2. Klik tombol **"Compare & pull request"** untuk branch `feature/my-reports` (pastikan **base:** `main` ← **compare:** `feature/my-reports`).
3. Beri judul PR: `feat(my-reports): tambah halaman laporan saya dan kelola status`, isi deskripsi singkat, lalu klik **"Create pull request"**.

---

## 6. Prompt Siap Pakai untuk AI Coding Agent (Copy-Paste)

Salin (*copy-paste*) prompt di bawah ini langsung ke AI Coding Agent Anda (Antigravity / Cursor / Claude Code / Copilot):

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

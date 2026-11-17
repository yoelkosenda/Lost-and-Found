# Task 1: Fitur Pembuatan Laporan Baru (Create Report)

**Nama Branch:** `feature/create-report`  
**Target Rute:** `/app/reports/new`  
**Prasyarat Dokumen:** Baca `AGENTS.md` dan `docs/design-system.md` sebelum memulai.

---

## 1. Tujuan Fitur
Memungkinkan mahasiswa yang telah login untuk membuat laporan barang hilang (*Lost*) atau barang ditemukan (*Found*) yang langsung tersimpan ke database SQLite lokal dan muncul di dashboard komunitas.

---

## 2. Pekerjaan Backend & API

### A. Endpoint Pembuatan Laporan
Buka `server/index.js` dan buat endpoint baru dengan middleware `authenticate`:
- **Method:** `POST`
- **URL:** `/api/reports`
- **Request Body (JSON):**
  ```json
  {
    "type": "Lost", // "Lost" atau "Found"
    "title": "Dompet Kulit Hitam",
    "category": "Aksesori",
    "location": "Gedung Kuliah GK1",
    "description": "Berisi kartu identitas dan kartu mahasiswa.",
    "reported_at": "2026-11-15T10:00:00", // opsional, default ke waktu sekarang
    "image_url": null // opsional
  }
  ```
- **Validasi:**
  - `type` harus bernilai `'Lost'` atau `'Found'`.
  - `title`, `category`, `location`, dan `description` tidak boleh kosong.
  - Jika tidak valid, kembalikan HTTP `400` dengan JSON `{ "error": "Pesan error spesifik" }`.
- **Logika Database:**
  - Ambil `owner_id` dari `req.userId` (disediakan middleware `authenticate`).
  - Tentukan status awal:
    - Jika `type === 'Lost'`, status = `'Masih dicari'`.
    - Jika `type === 'Found'`, status = `'Menunggu pemilik'`.
  - Eksekusi query SQLite:
    ```sql
    INSERT INTO reports (owner_id, type, title, category, location, description, status, reported_at, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ```
  - Kembalikan HTTP `201` dengan JSON `{ "report": { "id": result.lastInsertRowid, ... } }`.

### B. Perbarui API Adapter di Frontend
Buka `src/lib/api.js` dan tambahkan fungsi `createReport`:
```javascript
export const api = {
  // ... fungsi yang sudah ada
  createReport: (data) => request('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
}
```

---

## 3. Pekerjaan Frontend (Tema Gelap SquareUp Figma)

### A. Buat Halaman Form: `src/pages/CreateReportPage.jsx`
1. **Shell & Header Konsisten (`.sq-page` & `.sq-navbar`):**
   - Gunakan struktur `.sq-page` dan `.sq-navbar` yang sama dengan `DashboardPage.jsx` (logo kubus `/figma/logo-cube.svg` + teks `Lost and Found. UNKLAB`, tautan `← Kembali ke Dashboard` menuju `/app`, serta chip akun `.sq-user-chip` dan tombol `Keluar ↗`).
2. **Banner Header Seksi (`.sq-cta-banner` / `.sq-section-banner`):**
   - Tampilkan header halaman dengan tekstur `/figma/banner-wave-1.png` dan `/figma/banner-dots.png`, judul `Buat Laporan Barang Baru`, dan subjudul instruksi singkat.
3. **Komponen Form (`.sq-login-shell` & `.sq-form-box`):**
   - Bungkus setiap input menggunakan kartu `.sq-input-card` dengan label `.sq-input-label` yang jelas:
     - **Tipe Laporan:** Pilihan jelas antara **"Barang Hilang (Lost)"** dan **"Barang Ditemukan (Found)"** (dapat berupa tombol toggle pill atau select/radio bergaya gelap).
     - **Nama Barang (Title):** Input teks di dalam `.sq-input-underline`.
     - **Kategori:** Dropdown `.sq-select-field` (`Elektronik`, `Aksesori`, `Kunci`, `Dokumen/Buku`, `Perlengkapan`, `Pakaian`, `Lainnya`).
     - **Lokasi di Kampus:** Input teks atau dropdown lokasi kampus UNKLAB (`GK1`, `GK2`, `Perpustakaan`, `Student Center`, `Cafeteria`, `Gymnasium`, `Parkiran Fakultas`, `Asrama`).
     - **Tanggal Kejadian:** Input datepicker/date.
     - **Deskripsi Detail:** Textarea untuk ciri khusus barang, kondisi, atau instruksi serah terima.
     - **URL Foto (Opsional):** Input URL gambar pendukung (jika ada).
4. **State & Interaksi:**
   - Gunakan `.sq-form-error` (`role="alert"`) untuk menampilkan pesan error jika validasi gagal.
   - Gunakan tombol submit `.sq-btn sq-btn-lime sq-submit-btn` dengan indikator loading saat pengiriman diproses.
   - Setelah sukses menyimpan laporan: arahkan pengguna kembali ke `/app` menggunakan `navigate('/app')`.

### B. Hubungkan Tombol di Dashboard
Buka `src/pages/DashboardPage.jsx`:
- Ubah tombol `<button type="button" className="sq-btn sq-btn-lime">+ Buat laporan</button>` pada bagian `.sq-dash-hero` agar saat diklik mengarahkan pengguna ke `/app/reports/new` (menggunakan `onClick={() => navigate('/app/reports/new')}` atau komponen `Link` dari `../router.jsx`).

### C. Daftarkan Rute di `src/App.jsx`
Di `src/App.jsx`, tambahkan rute baru sebelum pengecekan `/app`:
```jsx
if (path === '/app/reports/new') return user ? <CreateReportPage user={user} onLogout={logout} /> : <Redirect to="/login" />
```

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Tombol `+ Buat laporan` (`.sq-btn-lime`) di dashboard membuka halaman form `/app/reports/new`.
- [ ] Form memiliki validasi lengkap (tidak bisa mengirim form kosong).
- [ ] Laporan baru berhasil tersimpan di SQLite dan langsung muncul di daftar laporan dashboard `/app`.
- [ ] Tampilan form selaras dengan **SquareUp Figma Dark Theme** (background `#1a1a1a`, border `#262626`, kartu `.sq-input-card`, font `Barlow` & `Inter`, serta tombol CTA hijau neon `#9eff00`).
- [ ] Menjalankan `npm run build` sukses tanpa error syntax/kompilasi.

---

## 5. Langkah-Langkah Git (Dari Buat Branch Baru Sampai Pull Request)

Ikuti langkah berikut secara berurutan di terminal:

```bash
# 1. Pastikan berada di branch main terbaru
git checkout main
git pull origin main

# 2. Buat branch baru khusus Task 1
git checkout -b feature/create-report

# 3. Instal dependensi & jalankan server lokal untuk pengujian
npm install
npm run dev

# 4. Setelah fitur selesai dikerjakan, wajib uji build produksi
npm run build

# 5. Periksa file yang berubah (pastikan server/data/lost-and-found.db tidak ikut)
git status

# 6. Simpan perubahan (commit) dan push branch ke GitHub
git add .
git commit -m "feat(report): tambah halaman dan endpoint buat laporan baru"
git push -u origin feature/create-report
```

**Cara Membuat Pull Request (PR) di GitHub:**
1. Buka repositori `https://github.com/yoelkosenda/Lost-and-Found` di browser.
2. Klik tombol **"Compare & pull request"** untuk branch `feature/create-report` (pastikan **base:** `main` ← **compare:** `feature/create-report`).
3. Beri judul PR: `feat(report): tambah halaman dan endpoint buat laporan baru`, isi deskripsi singkat, lalu klik **"Create pull request"**.

---

## 6. Prompt Siap Pakai untuk AI Coding Agent (Copy-Paste)

Salin (*copy-paste*) prompt di bawah ini langsung ke AI Coding Agent Anda (Antigravity / Cursor / Claude Code / Copilot):

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

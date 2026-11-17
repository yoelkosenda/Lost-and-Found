# Task 2: Halaman Detail Laporan Barang (Report Detail Page)

**Nama Branch:** `feature/report-detail`  
**Target Rute:** `/app/reports/:id`  
**Prasyarat Dokumen:** Baca `AGENTS.md` dan `docs/design-system.md` sebelum memulai.

---

## 1. Tujuan Fitur
Menampilkan informasi lengkap dari satu laporan barang (baik barang hilang maupun barang temuan), termasuk kategori, lokasi spesifik, deskripsi detail, waktu pelaporan, dan identitas pelapor, serta navigasi kembali ke dashboard.

---

## 2. Pekerjaan Backend & API

### A. Endpoint Detail Laporan
Buka `server/index.js` dan buat endpoint dengan middleware `authenticate`:
- **Method:** `GET`
- **URL:** `/api/reports/:id`
- **Logika Database:**
  - Lakukan join antara tabel `reports` dan `users` untuk menyertakan nama pelapor:
    ```sql
    SELECT r.id, r.owner_id, r.type, r.title, r.category, r.location, r.description, 
           r.status, r.reported_at, r.image_url, u.name AS owner_name
    FROM reports r
    JOIN users u ON r.owner_id = u.id
    WHERE r.id = ?
    ```
  - Jika data tidak ditemukan, kembalikan HTTP `404` dengan JSON `{ "error": "Laporan tidak ditemukan." }`.
  - Jika ditemukan, kembalikan HTTP `200` dengan JSON `{ "report": report }`.

### B. Perbarui API Adapter di Frontend
Buka `src/lib/api.js` dan tambahkan fungsi `report`:
```javascript
export const api = {
  // ... fungsi yang sudah ada
  report: (id) => request(`/api/reports/${id}`),
}
```

---

## 3. Pekerjaan Frontend (Tema Gelap SquareUp Figma)

### A. Buat Halaman Detail: `src/pages/ReportDetailPage.jsx`
1. **Shell & Navigasi (`.sq-page` & `.sq-navbar`):**
   - Sertakan `.sq-navbar` dengan logo `.sq-brand` dan tombol/tautan `"← Kembali ke Dashboard"` (`.sq-btn sq-btn-outline` atau `.sq-nav-item`) yang memanggil `navigate('/app')`.
2. **Hierarki Konten (SquareUp Dark Theme):**
   - Gunakan kontainer `.sq-container` dan seksi berbingkai `.sq-section`.
   - **Header & Badge Status:** Tampilkan penanda tipe (`BARANG HILANG` atau `BARANG DITEMUKAN`) bersama `.sq-status-badge` (`lost` atau `found`) yang memuat teks status (misal: `Masih dicari` / `Menunggu pemilik`).
   - **Judul Barang:** Heading besar dengan font `Barlow` warna putih (`--white`).
   - **Area Visual (`.sq-work-visual`):** Tampilkan foto barang jika ada `image_url`, atau gunakan panel visual gelap `.sq-work-visual` dengan `.sq-visual-grid`, `.sq-visual-orb` (`/figma/icon-service-1.svg` atau `/figma/icon-service-2.svg`), dan kode laporan `#LF-{id}`.
   - **Info Grid / Metadata:** Gunakan kartu berbingkai gelap atau `.sq-work-pill` untuk menampilkan:
     - Kategori barang
     - Titik lokasi kampus dilaporkan
     - Waktu & tanggal pelaporan
     - Dilaporkan oleh: Nama mahasiswa pelapor (`owner_name`)
   - **Deskripsi Lengkap:** Paragraf rapi dengan font `Inter` / `Barlow` (`--grey-90`) yang menjelaskan kondisi atau ciri fisik barang.
   - **Panel Panduan / Aksi:**
     - Jika tipe laporan adalah **Found**: Sediakan tombol utama `.sq-btn sq-btn-lime` berlabel **"Ajukan Klaim Barang Ini"** (terhubung ke modal/alur klaim Task 4).
     - Jika tipe laporan adalah **Lost**: Berikan kartu informasi ramah berbingkai `--grey-15`: *"Jika Anda menemukan barang ini di area kampus, silakan amankan ke titik layanan Student Center / keamanan kampus atau perbarui koordinasi melalui portal."*
3. **State Loading & Error (`.sq-state`):**
   - Tampilkan `.sq-state` saat data sedang diambil dari API.
   - Tampilkan `.sq-state.error` jika ID laporan tidak ditemukan (404) beserta tombol kembali ke `/app`.

### B. Buat Kartu di Dashboard Dapat Diklik
Buka `src/pages/DashboardPage.jsx`:
- Pada daftar kartu laporan (`reports.map((r) => ...)`), tambahkan navigasi ke `/app/reports/${r.id}` pada `.sq-report-card`:
  ```jsx
  <article
    className={`sq-report-card ${r.type.toLowerCase()}`}
    key={r.id}
    onClick={() => navigate(`/app/reports/${r.id}`)}
    style={{ cursor: 'pointer' }}
  >
  ```

### C. Daftarkan Rute di `src/App.jsx`
Di `src/App.jsx`, tangani rute dinamis dengan regex sebelum fallback ke landing page:
```jsx
const reportDetailMatch = path.match(/^\/app\/reports\/(\d+)$/)
if (reportDetailMatch) {
  const reportId = reportDetailMatch[1]
  return user ? <ReportDetailPage id={reportId} user={user} onLogout={logout} /> : <Redirect to="/login" />
}
```

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Mengklik `.sq-report-card` di dashboard membuka halaman detail `/app/reports/:id`.
- [ ] Data laporan tampil lengkap dari API `GET /api/reports/:id` dengan tema gelap SquareUp.
- [ ] Tombol kembali membawa pengguna ke `/app` tanpa me-refresh halaman.
- [ ] Privasi terjaga: tidak menampilkan password hash atau nomor telepon pribadi.
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

---

## 5. Langkah-Langkah Git (Dari Buat Branch Baru Sampai Pull Request)

Ikuti langkah berikut secara berurutan di terminal:

```bash
# 1. Pastikan berada di branch main terbaru
git checkout main
git pull origin main

# 2. Buat branch baru khusus Task 2
git checkout -b feature/report-detail

# 3. Instal dependensi & jalankan server lokal untuk pengujian
npm install
npm run dev

# 4. Setelah fitur selesai dikerjakan, wajib uji build produksi
npm run build

# 5. Periksa file yang berubah (pastikan server/data/lost-and-found.db tidak ikut)
git status

# 6. Simpan perubahan (commit) dan push branch ke GitHub
git add .
git commit -m "feat(report): tambah halaman detail laporan barang"
git push -u origin feature/report-detail
```

**Cara Membuat Pull Request (PR) di GitHub:**
1. Buka repositori `https://github.com/yoelkosenda/Lost-and-Found` di browser.
2. Klik tombol **"Compare & pull request"** untuk branch `feature/report-detail` (pastikan **base:** `main` ← **compare:** `feature/report-detail`).
3. Beri judul PR: `feat(report): tambah halaman detail laporan barang`, isi deskripsi singkat, lalu klik **"Create pull request"**.

---

## 6. Prompt Siap Pakai untuk AI Coding Agent (Copy-Paste)

Salin (*copy-paste*) prompt di bawah ini langsung ke AI Coding Agent Anda (Antigravity / Cursor / Claude Code / Copilot):

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

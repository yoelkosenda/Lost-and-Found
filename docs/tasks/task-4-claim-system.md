# Task 4: Sistem Pengajuan Klaim Barang Temuan (Claim System)

**Nama Branch:** `feature/claim-system`  
**Target Komponen/Rute:** Modal/Panel Klaim pada `/app/reports/:id` dan halaman `/app/my-claims`  
**Prasyarat Dokumen:** Baca `AGENTS.md` dan `docs/design-system.md` sebelum memulai.

---

## 1. Tujuan Fitur
Memungkinkan mahasiswa yang merasa kehilangan barang untuk mengajukan klaim atas barang yang terdaftar sebagai **Found (Barang Ditemukan)** dengan menyertakan bukti kepemilikan tersembunyi/ciri khusus yang tidak dipublikasikan ke umum.

---

## 2. Pekerjaan Backend & Database

### A. Penyesuaian Tabel `claims` (SQLite)
Pastikan tabel `claims` di `server/db.js` memiliki kolom `message` untuk menyimpan bukti kepemilikan. Anda bisa menambahkan query migrasi aman berikut di `server/db.js`:
```javascript
try {
  db.exec(`ALTER TABLE claims ADD COLUMN message TEXT DEFAULT ''`)
} catch (_e) {
  // Kolom sudah ada
}
```

### B. Endpoint Mengajukan Klaim
Buka `server/index.js` dan tambahkan endpoint klaim dengan middleware `authenticate`:
- **Method:** `POST`
- **URL:** `/api/claims`
- **Request Body (JSON):**
  ```json
  {
    "report_id": 2,
    "message": "AirPods tersebut memiliki goresan kecil di bagian tutup kiri dan casing silikon hitam."
  }
  ```
- **Validasi:**
  - `report_id` dan `message` (minimal 10 karakter) wajib diisi.
  - Periksa apakah laporan ada dan bertipe `'Found'`. Barang bertipe `'Lost'` tidak dapat diklaim.
  - Pengguna tidak boleh mengklaim barang yang ia laporkan sendiri (`claimant_id !== report.owner_id`).
  - Cegah duplikasi klaim pending untuk laporan yang sama dari user yang sama.
- **Logika Database:**
  - Simpan klaim baru dengan status `'pending'`:
    ```sql
    INSERT INTO claims (report_id, claimant_id, message, status) VALUES (?, ?, ?, 'pending')
    ```
  - Opsional: perbarui status laporan menjadi `'Sedang diklaim'`.
  - Kembalikan HTTP `201` dengan JSON `{ "claim": { "id": result.lastInsertRowid, "status": "pending" } }`.

### C. Endpoint Daftar Klaim Saya
Buka `server/index.js` dan tambahkan endpoint:
- **Method:** `GET`
- **URL:** `/api/claims/my`
- **Logika Database:**
  - Ambil klaim milik `req.userId` beserta data barang yang diklaim:
    ```sql
    SELECT c.id, c.report_id, c.status, c.submitted_at, c.message,
           r.title AS report_title, r.category AS report_category, r.location AS report_location
    FROM claims c
    JOIN reports r ON c.report_id = r.id
    WHERE c.claimant_id = ?
    ORDER BY c.submitted_at DESC
    ```
  - Kembalikan HTTP `200` dengan JSON `{ "claims": claims }`.

### D. Perbarui API Adapter di Frontend
Buka `src/lib/api.js` dan tambahkan fungsi:
```javascript
export const api = {
  // ... fungsi yang sudah ada
  createClaim: (report_id, message) => request('/api/claims', { method: 'POST', body: JSON.stringify({ report_id, message }) }),
  myClaims: () => request('/api/claims/my'),
}
```

---

## 3. Pekerjaan Frontend (Tema Gelap SquareUp Figma)

### A. Modal / Form Klaim pada Halaman Detail Laporan
1. Pada halaman detail laporan (`ReportDetailPage.jsx` atau komponen `ClaimModal.jsx`):
   - Jika laporan bertipe **Found** dan bukan milik user sendiri: tampilkan tombol primer `.sq-btn sq-btn-lime` **"Ajukan Klaim Barang Ini"**.
   - Ketika tombol diklik, tampilkan panel/modal klaim bergaya `.sq-form-box` (`background: #1f1f1f`, `border: 1px solid var(--grey-15)`, `border-radius: 12px`):
     - Judul: `"Pengajuan Klaim Kepemilikan"`
     - Pesan privasi: *"Sebutkan ciri khusus, nomor seri, isi barang, atau tanda unik lainnya yang tidak dipublikasikan. Informasi ini bersifat rahasia dan hanya digunakan untuk memverifikasi kepemilikan."*
     - Kartu input `.sq-input-card` dengan `.sq-input-label` dan `<textarea>` bukti kepemilikan (`message`).
     - Tombol `.sq-btn sq-btn-lime` `"Kirim Klaim"` (dengan state loading) dan tombol `.sq-btn sq-btn-outline` `"Batal"`.
2. Setelah klaim berhasil dikirim:
   - Tampilkan pesan sukses beraksen hijau (`--green-50`): *"Pengajuan klaim berhasil dikirim. Penemu barang akan memverifikasi bukti kepemilikan Anda."*
   - Ubah tombol menjadi `.sq-status-badge` berlabel *"Klaim Telah Diajukan (Menunggu Verifikasi)"*.

### B. Halaman Riwayat Klaim: `src/pages/MyClaimsPage.jsx`
- Gunakan struktur `.sq-page`, `.sq-navbar`, `.sq-container`, dan `.sq-report-grid` / `.sq-report-card` untuk menampilkan daftar barang yang pernah diklaim oleh pengguna beserta badge statusnya (`.sq-status-badge`: `Menunggu Verifikasi`, `Klaim Diterima`, atau `Klaim Ditolak`).
- Daftarkan rute `/app/my-claims` di `src/App.jsx` dan tambahkan tautannya pada `.sq-nav-links`.

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Tombol klaim (`.sq-btn-lime`) hanya muncul pada laporan barang bertipe `Found`.
- [ ] Mahasiswa dapat mengajukan klaim dengan menyertakan bukti ciri khusus pada form bertema gelap SquareUp.
- [ ] Bukti ciri khusus klaim tidak bocor pada kartu laporan publik dan tersimpan aman di database.
- [ ] Mahasiswa dapat melihat daftar klaim yang pernah diajukannya beserta label teks statusnya di `/app/my-claims`.
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

---

## 5. Langkah-Langkah Git (Dari Buat Branch Baru Sampai Pull Request)

Ikuti langkah berikut secara berurutan di terminal:

```bash
# 1. Pastikan berada di branch main terbaru
git checkout main
git pull origin main

# 2. Buat branch baru khusus Task 4
git checkout -b feature/claim-system

# 3. Instal dependensi & jalankan server lokal untuk pengujian
npm install
npm run dev

# 4. Setelah fitur selesai dikerjakan, wajib uji build produksi
npm run build

# 5. Periksa file yang berubah (pastikan server/data/lost-and-found.db tidak ikut)
git status

# 6. Simpan perubahan (commit) dan push branch ke GitHub
git add .
git commit -m "feat(claim): tambah sistem pengajuan klaim dan halaman riwayat klaim"
git push -u origin feature/claim-system
```

**Cara Membuat Pull Request (PR) di GitHub:**
1. Buka repositori `https://github.com/yoelkosenda/Lost-and-Found` di browser.
2. Klik tombol **"Compare & pull request"** untuk branch `feature/claim-system` (pastikan **base:** `main` ← **compare:** `feature/claim-system`).
3. Beri judul PR: `feat(claim): tambah sistem pengajuan klaim dan halaman riwayat klaim`, isi deskripsi singkat, lalu klik **"Create pull request"**.

---

## 6. Prompt Siap Pakai untuk AI Coding Agent (Copy-Paste)

Salin (*copy-paste*) prompt di bawah ini langsung ke AI Coding Agent Anda (Antigravity / Cursor / Claude Code / Copilot):

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

# Task 3: Halaman Laporan Saya & Kelola Status (My Reports)

**Nama Branch:** `feature/my-reports`  
**Target Rute:** `/app/my-reports`  
**Prasyarat Dokumen:** Baca `AGENTS.md` sebelum memulai.

---

## 1. Tujuan Fitur
Memungkinkan mahasiswa melihat semua laporan yang pernah mereka buat sendiri, memantau perkembangannya, serta mengubah status laporan (misalnya: menandai barang telah ditemukan atau membatalkan laporan yang sudah selesai).

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

## 3. Pekerjaan Frontend

### A. Buat Halaman: `src/pages/MyReportsPage.jsx`
1. **Header & Navigasi:**
   - Navigasi atas dengan link "Beranda" (ke `/app`) dan "Laporan Saya" (aktif).
   - Tombol "← Kembali ke Dashboard".
2. **Statistik Pribadi:**
   - Ringkasan kecil: Total laporan Anda, Laporan aktif, dan Laporan selesai.
3. **Filter Tab:**
   - Tab cepat untuk menyaring: `Semua`, `Barang Hilang`, `Barang Ditemukan`.
4. **Daftar Kartu Laporan:**
   - Menampilkan detail barang, tanggal pelaporan, dan badge status saat ini.
   - **Tombol Aksi Pemilik:**
     - Tombol `"Tandai Selesai / Ditemukan"` (mengubah status menjadi `Sudah ditemukan` atau `Sudah dikembalikan`).
     - Tombol `"Tutup Laporan"` (mengubah status menjadi `Dibatalkan / Ditutup`).
     - Dialog konfirmasi sederhana sebelum status diubah.
5. **Empty State:**
   - Jika belum ada laporan: tampilkan teks penjelasan ramah dan tombol `"+ Buat Laporan Pertama"` yang mengarahkan ke `/app/reports/new`.

### B. Hubungkan Navigasi di Dashboard
Buka `src/pages/DashboardPage.jsx`:
- Pada bagian `<nav>` di header atas, tambahkan link navigasi ke halaman ini:
  ```jsx
  <Link to="/app/my-reports">Laporan Saya</Link>
  ```

### C. Daftarkan Rute di `src/App.jsx`
Di `src/App.jsx`, tambahkan rute baru:
```jsx
if (path === '/app/my-reports') return user ? <MyReportsPage user={user} onLogout={logout} /> : <Redirect to="/login" />
```

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Pengguna dapat mengakses halaman `/app/my-reports` dari navigasi dashboard.
- [ ] Halaman hanya menampilkan laporan yang dibuat oleh pengguna yang sedang login.
- [ ] Pengguna dapat memperbarui status laporan miliknya menjadi selesai atau dibatalkan.
- [ ] Upaya mengubah laporan orang lain ditolak oleh backend (HTTP 403).
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

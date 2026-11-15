# Task 4: Sistem Pengajuan Klaim Barang Temuan (Claim System)

**Nama Branch:** `feature/claim-system`  
**Target Komponen/Rute:** Modal Klaim pada `/app/reports/:id` dan/atau `/app/my-claims`  
**Prasyarat Dokumen:** Baca `AGENTS.md` sebelum memulai.

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

## 3. Pekerjaan Frontend

### A. Modal / Form Klaim pada Halaman Detail Laporan
1. Pada halaman detail laporan (`ReportDetailPage.jsx` atau komponen modal terpisah `ClaimModal.jsx`):
   - Jika laporan bertipe **Found** dan bukan milik user sendiri: tampilkan tombol primer **"Ajukan Klaim Barang Ini"**.
   - Ketika tombol diklik, buka form modal klaim:
     - Judul: "Pengajuan Klaim Kepemilikan"
     - Pesan privasi: *"Sebutkan ciri khusus, nomor seri, isi barang, atau tanda unik lainnya yang tidak Anda publikasikan. Informasi ini hanya digunakan untuk mencocokkan kepemilikan."*
     - Textarea input bukti kepemilikan (`message`).
     - Tombol "Kirim Klaim" (dengan status loading) dan tombol "Batal".
2. Setelah klaim berhasil dikirim:
   - Tampilkan pesan sukses: *"Pengajuan klaim berhasil dikirim. Penemu barang akan memverifikasi bukti kepemilikan Anda."*
   - Ubah status tampilan tombol menjadi badge *"Klaim Telah Diajukan (Menunggu Verifikasi)"*.

### B. Halaman/Tab Riwayat Klaim: `src/pages/MyClaimsPage.jsx`
- Buat halaman sederhana untuk melihat daftar barang yang pernah diklaim oleh pengguna beserta statusnya (`pending`: Menunggu Verifikasi, `approved`: Klaim Diterima, `rejected`: Ditolak).
- Daftarkan rute `/app/my-claims` di `src/App.jsx`.

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Tombol klaim hanya muncul pada laporan barang bertipe `Found`.
- [ ] Mahasiswa dapat mengajukan klaim dengan menyertakan bukti ciri khusus.
- [ ] Bukti ciri khusus klaim tidak bocor ke publik dan tersimpan dengan aman di database.
- [ ] Mahasiswa dapat melihat daftar klaim yang pernah diajukannya beserta statusnya.
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

# Task 1: Fitur Pembuatan Laporan Baru (Create Report)

**Nama Branch:** `feature/create-report`  
**Target Rute:** `/app/reports/new`  
**Prasyarat Dokumen:** Baca `AGENTS.md` sebelum memulai.

---

## 1. Tujuan Fitur
Memungkinkan mahasiswa yang telah login untuk membuat laporan barang hilang (*Lost*) atau barang ditemukan (*Found*) yang langsung tersimpan ke database SQLite lokal dan muncul di dashboard.

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

## 3. Pekerjaan Frontend

### A. Buat Halaman Form: `src/pages/CreateReportPage.jsx`
1. **Header Konsisten:** Sertakan navigasi/topbar yang serupa dengan dashboard (logo `found.`, tombol kembali ke dashboard, dan nama user).
2. **Komponen Form:**
   - **Tipe Laporan:** Tombol toggle atau radio button yang jelas antara **"Barang Hilang (Lost)"** dan **"Barang Ditemukan (Found)"**.
   - **Nama Barang (Title):** Input teks dengan label terlihat.
   - **Kategori:** Dropdown pilihan (`Elektronik`, `Aksesori`, `Kunci`, `Dokumen/Buku`, `Perlengkapan`, `Pakaian`, `Lainnya`).
   - **Lokasi di Kampus:** Input teks atau dropdown lokasi kampus UNKLAB umum (misal: `GK1`, `GK2`, `Perpustakaan`, `Student Center`, `Cafeteria`, `Gymnasium`, `Parkiran Fakultas`, `Asrama`).
   - **Tanggal Kejadian:** Input datepicker/date.
   - **Deskripsi Detail:** Textarea untuk ciri khusus barang, kondisi, atau instruksi.
   - **URL Foto (Opsional):** Input URL gambar pendukung (jika ada).
3. **State & Interaksi:**
   - Loading indicator pada tombol saat submit sedang diproses.
   - Tampilkan pesan error jika server mengembalikan error validasi.
   - Setelah sukses menyimpan laporan: navigasikan kembali ke `/app` menggunakan `navigate('/app')`.

### B. Hubungkan Tombol di Dashboard
Buka `src/pages/DashboardPage.jsx`:
- Ubah tombol `<button className="btn btn-green">+ Buat laporan</button>` agar saat diklik mengarahkan pengguna ke `/app/reports/new` (menggunakan fungsi `navigate('/app/reports/new')` atau komponen `Link` dari `../router.jsx`).

### C. Daftarkan Rute di `src/App.jsx`
Di `src/App.jsx`, tambahkan rute baru di bawah pengecekan rute `/app`:
```jsx
if (path === '/app/reports/new') return user ? <CreateReportPage user={user} onLogout={logout} /> : <Redirect to="/login" />
```

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Tombol `+ Buat laporan` di dashboard membuka halaman form `/app/reports/new`.
- [ ] Form memiliki validasi lengkap (tidak bisa kirim form kosong).
- [ ] Laporan baru berhasil tersimpan di SQLite dan langsung muncul di daftar laporan dashboard `/app`.
- [ ] Tampilan form selaras dengan tema Talentflow (krem `#f7f5ef`, font serif display untuk judul, border tipis, dan tombol rounded).
- [ ] Menjalankan `npm run build` sukses tanpa error syntax/kompilasi.

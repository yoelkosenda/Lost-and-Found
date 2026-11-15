# Task 2: Halaman Detail Laporan Barang (Report Detail Page)

**Nama Branch:** `feature/report-detail`  
**Target Rute:** `/app/reports/:id`  
**Prasyarat Dokumen:** Baca `AGENTS.md` sebelum memulai.

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

## 3. Pekerjaan Frontend

### A. Buat Halaman Detail: `src/pages/ReportDetailPage.jsx`
1. **Navigasi & Breadcrumb:**
   - Tombol "← Kembali ke Dashboard" yang memanggil `navigate('/app')`.
2. **Hierarki Konten (Gaya Editorial Talentflow):**
   - **Eyebrow & Tipe:** Teks penanda seperti `BARANG HILANG` atau `BARANG DITEMUKAN` dengan badge status berlabel teks (misal: `Masih dicari` / `Menunggu pemilik`).
   - **Judul Barang:** Heading besar dengan font `DM Serif Display`.
   - **Info Grid / Metadata:**
     - Kategori barang
     - Lokasi kampus dilaporkan
     - Waktu & tanggal pelaporan
     - Dilaporkan oleh: Nama mahasiswa pelapor
   - **Deskripsi Lengkap:** Paragraf rapi yang menjelaskan kondisi atau ciri fisik barang.
   - **Area Visual:** Tampilkan gambar barang jika ada `image_url`, atau kotak placeholder grafis netral yang elegan sesuai tema krem/sage.
   - **Panel Panduan / Aksi:**
     - Jika tipe laporan adalah **Found**: Sediakan tombol CTA `"Ajukan Klaim Barang Ini"` (bisa membuka modal atau mengarahkan ke alur klaim).
     - Jika tipe laporan adalah **Lost**: Berikan kotak informasi ramah: *"Jika Anda menemukan barang ini, Anda dapat menyerahkannya ke loket keamanan terdekat atau menghubungi pelapor."*
3. **State Loading & Error:**
   - Tampilkan skeleton/spinner saat data sedang diambil dari API.
   - Tampilkan kotak peringatan ramah jika ID laporan tidak ada (404) beserta tombol kembali.

### B. Buat Kartu di Dashboard Dapat Diklik
Buka `src/pages/DashboardPage.jsx`:
- Pada list kartu laporan (`reports.map(r => ...)`), tambahkan handler klik atau bungkus dengan `Link` ke `/app/reports/${r.id}`:
  ```jsx
  <article 
    className={`app-report ${r.type.toLowerCase()}`} 
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
- [ ] Mengklik kartu laporan di dashboard membuka halaman detail `/app/reports/:id`.
- [ ] Data laporan tampil lengkap dari API `GET /api/reports/:id`.
- [ ] Tombol kembali membawa pengguna kembali ke `/app` tanpa me-refresh halaman.
- [ ] Privasi terjaga: tidak menampilkan password hash atau data kontak sensitif.
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

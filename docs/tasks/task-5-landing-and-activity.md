# Task 5: Landing Page Dinamis, Activity Feed, & Refactor CSS

**Nama Branch:** `feature/landing-and-activity`  
**Target File:** `src/pages/LandingPage.jsx`, `src/pages/DashboardPage.jsx`, `src/styles/global.css`, `server/index.js`  
**Prasyarat Dokumen:** Baca `AGENTS.md` sebelum memulai.

---

## 1. Tujuan Fitur
1. Menghubungkan Landing Page publik (`/`) ke data laporan nyata dari database (bukan lagi data statis).
2. Membangun panel **Aktivitas Komunitas (Activity Feed)** nyata pada dashboard mahasiswa `/app` (menggantikan teks statis saat ini).
3. Melakukan pemformatan dan restrukturisasi file [src/styles/global.css](file:///C:/Technologiaa/FrontEnd%20Final%20Project/Lost-and-Found/src/styles/global.css) agar rapi, berindentasi, dan mudah dirawat oleh seluruh anggota tim.

---

## 2. Pekerjaan Backend & API

### A. Endpoint Laporan Publik (Tanpa Auth)
Buka `server/index.js` dan tambahkan endpoint publik untuk preview landing page:
- **Method:** `GET`
- **URL:** `/api/reports/public`
- **Otorisasi:** **Publik (TIDAK memerlukan middleware `authenticate`)**.
- **Logika Database:**
  - Ambil 3-4 laporan terbaru yang aktif:
    ```sql
    SELECT id, type, title, category, location, status, reported_at 
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
    SELECT 'report' AS activity_type, id, title, type AS item_type, status, reported_at AS created_at
    FROM reports
    UNION ALL
    SELECT 'claim' AS activity_type, c.id, r.title, 'Claim' AS item_type, c.status, c.submitted_at AS created_at
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

## 3. Pekerjaan Frontend

### A. Landing Page Dinamis (`src/pages/LandingPage.jsx`)
- Pada saat komponen dimuat (`useEffect`), panggil `api.publicReports()`.
- Gantikan daftar laporan hardcoded pada bagian preview laporan dengan data dinamis dari API.
- Tampilkan fallback state yang halus jika data masih dimuat atau belum ada laporan.

### B. Activity Feed Nyata di Dashboard (`src/pages/DashboardPage.jsx`)
- Panggil `api.activities()` di `DashboardPage`.
- Ubah bagian `<section id="aktivitas" className="activity">`:
  - Buat komponen linimasa / timeline vertikal dengan garis tipis dan ikon aktivitas.
  - Tampilkan informasi ringkas:
    - *Contoh Laporan:* "Yoel melaporkan barang hilang: **Dompet kulit cokelat** di Student Center."
    - *Contoh Klaim:* "Ada pengajuan klaim baru untuk: **AirPods putih**."
    - Cantumkan penanda waktu relatif (misal: "2 jam yang lalu" atau "13 Nov").

### C. Pemformatan & Restrukturisasi `src/styles/global.css`
- **Kondisi saat ini:** File `src/styles/global.css` tersimpan dalam satu baris yang sangat panjang/minified.
- **Tugas:**
  - Format ulang CSS tersebut dengan baris baru (*line breaks*) dan indentasi 2 spasi yang rapi.
  - Berikan komentar pemisah bagian, misalnya:
    ```css
    /* ==========================================================================
       1. DESIGN TOKENS & ROOT VARIABLES
       ========================================================================== */
    /* ==========================================================================
       2. RESET & BASE ELEMENTS
       ========================================================================== */
    /* ==========================================================================
       3. NAVIGATION & APP SHELL
       ========================================================================== */
    /* ==========================================================================
       4. DASHBOARD & REPORT CARDS
       ========================================================================== */
    /* ==========================================================================
       5. FORMS, BUTTONS & UTILITIES
       ========================================================================== */
    /* ==========================================================================
       6. RESPONSIVE BREAKPOINTS
       ========================================================================== */
    ```
  - ⚠️ **PENTING:** Jangan mengubah nilai token, ukuran font, margin, atau warna yang ada agar tidak merusak tampilan visual yang sudah selesai.

---

## 4. Checklist Selesai (Definition of Done)
- [ ] Landing page (`/`) menampilkan kartu laporan yang bersumber langsung dari database SQLite.
- [ ] Section aktivitas di dashboard menampilkan event laporan/klaim terbaru secara dinamis.
- [ ] File `src/styles/global.css` terformat rapi dengan indentasi dan komentar section yang jelas tanpa mengubah visual aplikasi.
- [ ] Menjalankan `npm run build` sukses tanpa error kompilasi.

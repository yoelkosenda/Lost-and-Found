# Lost & Found UNKLAB

Portal Lost & Found untuk komunitas UNKLAB, dengan landing page publik, login mahasiswa, dan main menu yang terhubung ke backend lokal.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Perintah tersebut menjalankan dua layanan bersamaan:

- Frontend React + Vite: URL yang ditampilkan Vite (biasanya `http://localhost:5173`).
- API Express: `http://localhost:3001`.

Vite mem-proxy semua permintaan `/api` ke API Express, sehingga cukup buka URL frontend di browser.

## Akun demo lokal

| Email | Password |
| --- | --- |
| `student@unklab.ac.id` | `unklab123` |

Kredensial ini hanya untuk presentasi dan pengembangan lokal. Password tersimpan dalam database sebagai hash, bukan teks biasa.

## Halaman

- `/` — landing page Lost & Found UNKLAB.
- `/login` — login mahasiswa.
- `/app` — main menu terlindungi; pengguna yang belum login akan dialihkan ke `/login`.

## Backend dan database

Backend berada di `server/` dan memakai Express serta SQLite. Saat server pertama kali dijalankan, database lokal akan dibuat otomatis di `server/data/lost-and-found.db` beserta data seed.

Skema awal:

- `users` — profil mahasiswa dan password hash.
- `reports` — laporan barang hilang/ditemukan.
- `claims` — pondasi pengajuan klaim untuk tahap berikutnya.

Database SQLite lokal dan file `.env` tidak dilacak Git. Untuk memulai ulang data demo, hentikan server lalu hapus file `server/data/lost-and-found.db`; data seed akan dibuat kembali saat server dijalankan.

## API awal

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/reports`

Endpoint profil dan laporan memerlukan session cookie HTTP-only yang dibuat setelah login.

## Pemeriksaan produksi

```bash
npm run build
```

## Struktur utama

- `src/pages/` — halaman landing, login, dan dashboard.
- `src/components/` — komponen dari dashboard awal; dapat digunakan kembali saat modul lain dibangun.
- `src/lib/api.js` — satu titik akses frontend ke API.
- `server/` — inisialisasi SQLite dan route Express.
- `docs/superpowers/specs/` — spesifikasi final.
- `docs/superpowers/plans/` — rencana implementasi.

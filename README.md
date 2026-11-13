# Lost & Found UNKLAB — Home Dashboard

Kerangka front-end halaman beranda untuk project Lost & Found komunitas UNKLAB. Project ini menggunakan React + Vite dan data mock lokal; backend, autentikasi, dan halaman lain sengaja belum termasuk dalam scope.

## Menjalankan project

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

## Struktur yang perlu dipahami

- `src/pages/HomePage.jsx` — composition root untuk seluruh beranda.
- `src/components/layout/` — sidebar dan topbar yang bisa digunakan ulang.
- `src/components/home/` — komponen statistik, laporan, dan aktivitas.
- `src/data/mockReports.js` — kontrak data sementara; ganti dengan adapter API saat backend tersedia.
- `src/styles/global.css` — token visual, responsive rules, focus state, dan reduced motion.
- `docs/superpowers/specs/2026-11-13-home-dashboard-design.md` — keputusan desain dan acceptance criteria.

## Pola kerja GitHub Flow

Mulai dari branch terbaru:

```bash
git switch main
git pull origin main
git switch -c feature/report-item
```

Anggota yang mengerjakan halaman lain sebaiknya menambah file di `src/pages/` dan folder komponen domain masing-masing. Hindari mengubah `HomePage.jsx` atau `global.css` secara besar-besaran tanpa koordinasi agar merge tetap kecil.

Sebelum membuka pull request:

```bash
npm run build
git add .
git commit -m "feat: add report item page"
git push -u origin feature/report-item
```

## Di luar scope beranda

Login, Lost Items, Found Items, Detail Barang, Report Item, AI Matching, klaim, pesan, notifikasi, dan Admin Panel disiapkan sebagai extension points tetapi belum diimplementasikan.

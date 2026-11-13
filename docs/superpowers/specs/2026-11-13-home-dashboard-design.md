# Home Dashboard — Design

## Scope

Membangun halaman beranda/dashboard front-end Lost & Found UNKLAB menggunakan React + Vite. Implementasi mengikuti wireframe beranda yang diberikan, memakai data mock lokal, dan tidak mencakup backend maupun halaman lain.

## Struktur

- `src/pages/HomePage.jsx` menjadi composition root beranda.
- `src/components/layout` berisi shell dan navigasi yang dapat dipakai ulang.
- `src/components/home` berisi komponen statistik, laporan, dan aktivitas.
- `src/data/mockReports.js` menjadi kontrak data sementara yang nantinya dapat diganti adapter API.
- `src/styles/global.css` memusatkan token visual, responsive layout, focus state, dan reduced motion.

## Interaksi

Pencarian memfilter nama barang, kategori, dan lokasi. Dropdown memfilter tipe `Lost` atau `Found`. Navigasi dan CTA halaman lain berupa titik integrasi hash, tanpa mengimplementasikan flow halaman tersebut.

## Kolaborasi

Fondasi ini dirancang untuk branch pendek seperti `feature/report-item`, `feature/lost-items`, dan `feature/my-reports`. Anggota lain sebaiknya menambah halaman di `src/pages` dan komponen domain masing-masing tanpa memindahkan data mock atau shell beranda.

## Acceptance criteria

- Beranda dapat dijalankan dengan `npm run dev` dan dibuild dengan `npm run build`.
- Layout desktop dan mobile mengikuti hierarki wireframe.
- Search, filter tipe, empty state, keyboard focus, dan reduced motion tersedia.
- Tidak ada dependensi backend atau kredensial pada project.

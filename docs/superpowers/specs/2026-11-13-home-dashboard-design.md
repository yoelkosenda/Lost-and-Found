# Home Dashboard — Design (SquareUp Figma Dark Theme)

## Scope

Membangun halaman dashboard utama (`/app`) untuk portal mahasiswa **Lost & Found UNKLAB** menggunakan React + Vite yang terhubung ke backend Express + SQLite. Desain mengadaptasi estetika gelap **SquareUp Figma Dark Theme** (`#1a1a1a` background, `#262626` structural grid borders, `#9eff00` neon lime accent, serta font `Barlow` & `Inter`).

## Struktur

- `src/pages/DashboardPage.jsx` menjadi komponen halaman utama `/app` setelah mahasiswa berhasil login.
- Menggunakan struktur shell `.sq-page` yang terdiri dari:
  - `.sq-navbar`: Header sticky dengan logo `.sq-brand` (`/figma/logo-cube.svg`), tautan navigasi `.sq-nav-links`, serta `.sq-account-bar` (chip identitas mahasiswa `.sq-user-chip` + tombol keluar `.sq-logout-btn`).
  - `.sq-dash-hero`: Banner sambutan bertekstur gelombang (`banner-wave-1.png` + `banner-dots.png`), tombol aksi utama `.sq-btn-lime` (`+ Buat laporan`), dan kartu sorotan `.sq-dash-highlight` untuk jumlah barang ditemukan minggu ini.
  - `.sq-dash-stats`: Baris 3 kartu statistik berbingkai (`.sq-stat-card`) untuk kategori `LOST`, `FOUND`, dan `TOTAL`.
  - `.sq-dash-toolbar` & `.sq-report-grid`: Toolbar pencarian (`.sq-search-field`) dan filter tipe (`.sq-select-field`), diikuti grid 2 kolom kartu laporan (`.sq-report-card`).
  - `.sq-cta-banner` (`#aktivitas`) & `.sq-footer`: Panel jejak aktivitas komunitas dan informasi kaki halaman.
- `src/lib/api.js` menjadi satu-satunya adapter komunikasi ke endpoint `/api/reports`.
- `src/styles/global.css` memusatkan token visual tema gelap (`--bg-dark`, `--green-50`, `--grey-15`, dll.), responsive layout, focus state (`outline: 2px solid var(--green-50)`), dan dukungan `prefers-reduced-motion`.

## Interaksi

- Pencarian menyaring judul barang, kategori, dan lokasi kampus secara real-time.
- Dropdown menyaring tipe laporan (`Semua`, `Lost`, atau `Found`).
- Kartu laporan menampilkan label tipe (`BARANG HILANG` / `BARANG DITEMUKAN`), badge status berlabel teks (`.sq-status-badge.lost` / `.sq-status-badge.found`), tanggal, pill kategori & lokasi (`.sq-work-pill`), serta deskripsi singkat.
- Mendukung state memuat data (`Memuat laporan komunitas…`), state tidak ada hasil pencarian, dan state error disertai tombol `Coba lagi`.

## Kolaborasi

Fondasi ini dirancang agar anggota tim dapat mengembangkan fitur lanjutan secara modular pada branch terpisah (`feature/create-report`, `feature/report-detail`, `feature/my-reports`, `feature/claim-system`, `feature/landing-and-activity`) dengan tetap mempertahankan kelas `.sq-*` dan struktur layout yang konsisten.

## Acceptance criteria

- Dashboard dapat dijalankan dengan `npm run dev` dan dibuild dengan `npm run build` tanpa error.
- Layout desktop (`max-width: 1596px`) dan mobile (`<= 800px` dan `<= 480px`) mengikuti hierarki grid berbingkai SquareUp Dark Theme.
- Search, filter tipe, loading/empty/error state, keyboard focus hijau neon, dan `prefers-reduced-motion` berfungsi dengan baik.
- Seluruh pengambilan data dilakukan melalui `src/lib/api.js` dengan sesi autentikasi mahasiswa yang valid.

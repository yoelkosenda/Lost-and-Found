# Lost & Found UNKLAB — Design System (SquareUp Figma Dark Theme)

Dokumen ini adalah sumber acuan visual dan interaksi untuk seluruh halaman website **Lost & Found UNKLAB**. Semua halaman—Landing Page (`/`), Login (`/login`), Dashboard Komunitas (`/app`), Buat Laporan (`/app/reports/new`), Detail Barang (`/app/reports/:id`), Laporan Saya (`/app/my-reports`), dan Riwayat Klaim (`/app/my-claims`)—wajib mengikuti aturan di sini agar tetap konsisten sebagai satu produk.

Versi: 2.0 (SquareUp Dark Theme Adaptation)
Tanggal: 17 November 2026
Basis: Adaptasi template Figma **SquareUp Dark Theme** untuk portal komunitas mahasiswa UNKLAB.

---

## 1. Prinsip Desain

### Jelas sebelum dekoratif
Pengguna harus langsung memahami jenis laporan (`Lost` / `Found`), lokasi kampus, waktu, status, dan tindakan yang tersedia. Tekstur *wave*, *dot matrix*, dan aksen hijau neon dipakai untuk memperkuat struktur seksi, bukan menutupi keterbacaan informasi.

### Gelap modern, terstruktur, dan ramah komunitas
Produk ini membantu mahasiswa Universitas Klabat menemukan kembali barang berharga mereka. Gunakan kontras tinggi di atas permukaan gelap (`#1A1A1A`), garis batas arsitektural tipis (`1px solid #262626`), dan aksen hijau limau elektrik (`#9EFF00`) sebagai penunjuk fokus serta aksi utama.

### Satu tindakan utama per area
Setiap halaman atau banner harus memiliki satu CTA utama berwarna hijau limau (`.sq-btn-lime`) yang paling menonjol. Aksi sekunder menggunakan tombol berbingkai gelap transparan (`.sq-btn-outline` atau `.sq-btn-card`).

### Privasi sejak tampilan pertama
Nomor telepon pribadi, email pribadi, password hash, dan bukti kepemilikan rahasia tidak boleh tampil pada kartu laporan publik. Gunakan status verifikasi dan sistem klaim terproteksi sebagai pengganti kontak langsung.

---

## 2. Arah Visual & Karakter Tampilan

Visual mengadaptasi estetika **SquareUp Dark UI**: latar belakang karbon gelap (`#1A1A1A`), grid berbingkai tegas (`#262626`), banner seksi bertekstur gelombang (*topographic/wave overlay*) dengan bintik halus (*dot grid*), badge ikon bergradasi hijau halus, serta tombol CTA hijau neon (`#9EFF00`).

### Karakter tampilan
- **Navigasi Atas (`.sq-navbar`):** Sticky topbar dengan efek *glassmorphism* (`backdrop-filter: blur(12px)`), logo kubus hijau (`.sq-brand-box` + `/figma/logo-cube.svg`), tautan navigasi tengah (`.sq-nav-links`), dan panel akun/CTA di sisi kanan.
- **Grid Berbingkai (`.sq-section`):** Setiap bagian halaman berada di dalam kontainer `.sq-container` (`max-width: 1596px`) dengan garis tepi kiri, kanan, dan bawah `1px solid var(--grey-15)`.
- **Banner Seksi (`.sq-section-banner` & `.sq-cta-banner`):** Header bagian tengah dengan latar `#171B12`, gambar gelombang `/figma/banner-wave-*.png` (`mix-blend-mode: overlay`), `/figma/banner-dots.png`, dan sorotan radial hijau halus (`.sq-banner-tint`).
- **Ikon & Aset Visual:** Tersimpan di `public/figma/` menggunakan ikon outline hijau neon (`#9EFF00`) di dalam wadah `.sq-icon-badge` bergradasi gelap.

---

## 3. Design Tokens (`src/styles/global.css`)

### Warna Utama

| Token CSS | Hex / Nilai | Penggunaan |
| --- | --- | --- |
| `--bg-dark` | `#1a1a1a` | Latar belakang utama seluruh halaman (`body`, `.sq-page`) |
| `--bg-card` | `#1f1f1f` | Permukaan alternatif kartu dan panel dalam |
| `--grey-10` | `#191919` | Permukaan gelap terdalam |
| `--grey-15` | `#262626` | Garis batas struktural utama (border seksi, kartu, pill, tombol sekunder) |
| `--grey-20` | `#333333` | Border input, badge, kontrol form, dan kartu sorotan |
| `--grey-30` | `#4c4c4d` | Border aktif/hover pada kontrol sekunder |
| `--grey-40` | `#656567` | Warna placeholder input |
| `--grey-60` | `#98989a` | Teks sekunder, metadata, tanggal, dan deskripsi pendukung |
| `--grey-90` | `#e6e6e6` | Teks body utama dan tautan navigasi |
| `--white` | `#ffffff` | Judul utama (`h1`, `h2`, `h3`), label penting, dan angka statistik |
| `--green-50` | `#9eff00` | Warna aksen primer, CTA utama (`.sq-btn-lime`), fokus keyboard, ikon aktif |
| `--green-60` | `#b1ff33` | State hover untuk tombol CTA utama (`.sq-btn-lime:hover`) |
| `--green-70` | `#c5ff66` | Aksen teks sorotan pada judul (`h1 span`), badge UNKLAB, FAQ terbuka |
| `--green-80` | `#d8ff99` | Angka besar proses (`.sq-process-num`) dan teks status kaki kartu |
| `--green-99` | `#fdfffa` | Teks putih kehijauan lembut pada pill kepercayaan & checklist |
| `--icon-gradient` | `linear-gradient(229.29deg, rgba(158,255,0,0.2) 0%, rgba(158,255,0,0) 68.25%), linear-gradient(180deg, #242424 0%, rgba(36,36,36,0) 100%)` | Latar belakang wadah ikon `.sq-icon-badge` dan `.sq-visual-orb` |

Jangan membuat warna acak di luar palet di atas tanpa alasan fungsional yang jelas.

### Badge & Status Laporan (`.sq-status-badge`)

Status laporan **WAJIB** selalu ditampilkan dengan teks yang jelas, tidak boleh hanya mengandalkan warna:

| Kategori / Status | Class CSS | Latar (`background`) | Border | Teks | Makna Operasional |
| --- | --- | --- | --- | --- | --- |
| **Found** (`Menunggu pemilik`, `Sudah ditemukan`, `Sudah dikembalikan`) | `.sq-status-badge.found` | `rgba(158, 255, 0, 0.12)` | `rgba(158, 255, 0, 0.35)` | `#9eff00` (`--green-50`) | Barang temuan siap diklaim atau laporan telah tuntas |
| **Lost** (`Masih dicari`) | `.sq-status-badge.lost` | `rgba(255, 179, 71, 0.12)` | `rgba(255, 179, 71, 0.35)` | `#ffc470` | Barang hilang masih aktif dicari pemiliknya |
| **Verifikasi / Klaim** (`Sedang diklaim`, `Dalam verifikasi`) | `.sq-status-badge` | `rgba(38, 38, 38, 0.75)` | `#333333` (`--grey-20`) | `#d8ff99` (`--green-80`) | Klaim sedang diajukan dan menunggu verifikasi |
| **Ditutup** (`Dibatalkan / Ditutup`) | `.sq-status-badge` | `#262626` (`--grey-15`) | `#333333` (`--grey-20`) | `#98989a` (`--grey-60`) | Laporan sudah ditutup atau dibatalkan |

### Tipografi

Menggunakan dua keluarga font Google Fonts:
- **`Barlow`** (`400`, `500`, `600`, `700`): Font utama untuk heading, navigasi, tombol, statistik, dan struktur UI.
- **`Inter`** (`400`, `500`, `600`): Font pendukung untuk paragraf deskripsi kartu dan nomor kode laporan.

| Peran | Font | Ukuran Desktop | Weight | Catatan |
| --- | --- | --- | --- | --- |
| Hero Title (`h1`) | `Barlow` | `clamp(40px, 5.2vw, 68px)` | `600` | Line-height `1.15`, sorotan `span` memakai `--green-70` |
| Dashboard Hero (`h1`) | `Barlow` | `clamp(34px, 4.2vw, 56px)` | `600` | Line-height `1.12` |
| Section Heading (`h2`) | `Barlow` | `clamp(30px, 3.6vw, 46px)` | `600` | Putih (`--white`), rata tengah pada `.sq-section-banner` |
| Card Title (`h3`) | `Barlow` | `24px–26px` | `500–600` | Putih (`--white`) atau `--grey-90` |
| Stat Number (`strong`) | `Barlow` | `44px–56px` | `600–700` | Line-height `1–1.05` |
| Process Number | `Barlow` | `clamp(68px, 7vw, 112px)` | `600` | Warna `--green-80` (`#d8ff99`) |
| Body & Deskripsi | `Barlow` / `Inter` | `15px–17px` | `400–500` | Line-height `1.6–1.65`, warna `--grey-90` atau `--grey-60` |
| Kicker Pill (`.sq-kicker-pill`) | `Barlow` | `12px` | `700` | Uppercase, letter-spacing `1.4px`, teks `--green-50` |
| Button (`.sq-btn`) | `Barlow` | `14px–17px` | `500–600` | Border-radius `8px` |

---

## 4. Layout & Navigasi

### Struktur Halaman (`.sq-page` & `.sq-container`)

Berbeda dari layout sidebar lama, sistem desain baru menggunakan **arsitektur halaman penuh berbingkai (top-navigation container layout)**:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ .sq-navbar (Sticky Topbar, backdrop blur, tinggi min 96px)          │
├──────────────────────────────────────────────────────────────────────┤
│ .sq-container (lebar maks 1596px, margin auto, border struktural)   │
│   ├── .sq-hero / .sq-dash-hero / .sq-cta-banner                     │
│   ├── .sq-dash-stats / .sq-trust-bar                                │
│   └── .sq-section (Grid 2 atau 3 kolom dengan border 1px #262626)   │
├──────────────────────────────────────────────────────────────────────┤
│ .sq-footer (Kontak kampus, navigasi bawah, dan hak cipta)           │
└──────────────────────────────────────────────────────────────────────┘
```

- **Lebar Kontainer (`.sq-container`):** `width: min(1596px, calc(100% - 64px))` pada desktop, dan `calc(100% - 32px)` pada layar `<= 800px`.
- **Navbar (`.sq-navbar`):** Memuat `.sq-brand` di kiri, `.sq-nav-links` di tengah, dan `.sq-nav-cta` atau `.sq-account-bar` (chip profil mahasiswa + tombol `Keluar ↗`) di kanan.

### Breakpoint Responsif

- **`<= 1100px`:**
  - `.sq-trust-grid` menjadi 3 kolom.
  - `.sq-services-grid` dan `.sq-dash-hero-grid` berubah menjadi 1 kolom.
- **`<= 800px`:**
  -Lebar kontainer menyesuaikan ke `calc(100% - 32px)`.
  - `.sq-nav-links` disembunyikan agar header tetap ringkas di layar mobile.
  - Seluruh grid multi-kolom (`.sq-works-grid`, `.sq-process-grid`, `.sq-why-grid`, `.sq-faq-grid`, `.sq-form-row`, `.sq-check-grid`, `.sq-dash-stats`, `.sq-report-grid`) berubah menjadi **1 kolom** dengan pembatas `border-bottom: 1px solid var(--grey-15)`.
  - Input pencarian dan dropdown filter melebar `100%`.
- **`<= 480px`:**
  - Tombol aksi pada `.sq-hero-actions` tersusun vertikal (`flex-direction: column`) dan melebar penuh (`width: 100%`).

---

## 5. Komponen Standar

### 1. Tombol (`.sq-btn`)
- **Primary CTA (`.sq-btn.sq-btn-lime`):** Background `--green-50` (`#9eff00`), teks `--grey-15` (`#262626`), `font-weight: 600`. Saat hover: background `--green-60` dengan glow hijau `0 10px 26px rgba(158, 255, 0, 0.22)`.
- **Secondary / Outline (`.sq-btn.sq-btn-outline`):** Background `rgba(36, 36, 36, 0.35)`, border `1px solid var(--grey-20)`, teks `--white`.
- **Card Action (`.sq-btn.sq-btn-card`):** Lebar `100%`, background `--grey-15`, border `--grey-20`, berubah menjadi border & teks `--green-50` saat di-hover.

### 2. Kartu Laporan Dashboard (`.sq-report-card`)
Urutan informasi di dalam `.sq-report-card`:
1. **Header Kartu (`.sq-report-card-header`):** Label tipe (`BARANG HILANG` / `BARANG DITEMUKAN`) di kiri dan `.sq-status-badge` (`lost` / `found`) di kanan.
2. **Baris Ikon & Tanggal (`.sq-report-top-row`):** `.sq-icon-badge.sm` dengan ikon SVG di kiri dan tanggal laporan (`.sq-report-date`) di kanan.
3. **Judul Barang (`h3`):** Nama barang dengan ukuran `26px` warna putih.
4. **Metadata Lokasi & Kategori (`.sq-work-pill`):** Pill berlatar `--grey-15` menampilkan `{category} · {location}`.
5. **Deskripsi Singkat (`.sq-report-desc`):** Teks ringkas warna `--grey-60`.
6. **Footer Kartu (`.sq-report-footer`):** Teks status berwarna `--green-80` dan tombol ikon panah `.sq-icon-action.sm` (`/figma/icon-arrow-up-right.svg`).

### 3. Kartu Input & Form (`.sq-form-box` & `.sq-input-card`)
- Form dibungkus oleh `.sq-form-box` berlatar gelap semi-transparan (`rgba(26, 26, 26, 0.6)`) dengan border `1px solid var(--grey-15)` dan radius `12px`.
- Setiap field berada di dalam kartu `.sq-input-card` (`background: rgba(36, 36, 36, 0.5)`, `border: 1px solid var(--grey-15)`, `border-radius: 10px`).
- Label tampil jelas di atas input menggunakan `.sq-input-label` (`20px`, `--white`), diikuti `.sq-input-underline` dengan garis bawah yang berubah menjadi `--green-50` ketika fokus (`:focus-within`).
- Pesan error validasi atau server menggunakan `.sq-form-error` (`role="alert"`, border & latar merah transparan, teks `#ff9b9b`).

### 4. Pencarian, Filter, dan State Kosong/Error
- Toolbar pencarian berada di `.sq-dash-toolbar` menggunakan `.sq-search-field input` dan dropdown `.sq-select-field`.
- State loading, kosong (*empty state*), dan error ditampilkan menggunakan `.sq-state` (dan `.sq-state.error` beserta tombol retry `.sq-btn-lime`).

---

## 6. Aset Visual (`public/figma/`)

Seluruh aset grafis tema gelap disimpan di direktori `public/figma/`:
- **Identitas:** `logo-cube.svg`
- **Tekstur Banner:** `banner-wave-1.png`, `banner-wave-2.png`, `banner-wave-3.png`, `cta-wave.png`, `banner-dots.png`, `hero-dots.png`
- **Ikon Layanan & Laporan:** `icon-service-1.svg` (Lost/Hilang), `icon-service-2.svg` (Found/Ditemukan), `icon-service-3.svg` (Total/Verifikasi)
- **Ikon Keunggulan:** `icon-why-1.svg`, `icon-why-2.svg`, `icon-why-3.svg`, `icon-why-4.svg`
- **Ikon UI & Navigasi:** `icon-arrow-up-right.svg`, `icon-check.svg`, `icon-faq-plus.svg`, `icon-faq-close.svg`
- **Ikon Kontak & Sosial:** `icon-mail.svg`, `icon-phone.svg`, `icon-location.svg`, `icon-social-1.svg`, `icon-social-2.svg`, `icon-social-3.svg`

---

## 7. Interaksi, Motion & Aksesibilitas

- **Hover:** Tombol utama dan tombol ikon naik `translateY(-2px)` dengan transisi `0.2s`. Kartu laporan berubah latar menjadi `rgba(38, 38, 38, 0.28)` saat di-hover.
- **Keyboard Focus:** Semua elemen interaktif (`button`, `a`, `input`, `select`, `textarea`) memiliki `outline: 2px solid var(--green-50)` dengan `outline-offset: 3px` saat `:focus-visible`.
- **Reduced Motion:** Media query `@media (prefers-reduced-motion: reduce)` wajib menonaktifkan `transition` dan `scroll-behavior: smooth`.
- **Aksesibilitas:**
  - Status laporan selalu menyertakan teks, bukan hanya warna.
  - Semua kontrol form memiliki label tampak (`.sq-input-label`) atau `aria-label`.
  - Elemen dekoratif murni (gelombang banner, dot matrix, garis terrain) diberi `aria-hidden="true"`.

---

## 8. Checklist Kepatuhan Visual (Definition of Done)

Sebuah halaman atau komponen baru dianggap sesuai dengan Design System v2.0 jika:
- [ ] Menggunakan struktur `.sq-page`, `.sq-navbar`, `.sq-container`, dan `.sq-footer`.
- [ ] Memakai variabel warna CSS (`--bg-dark`, `--grey-15`, `--green-50`, dll.) serta font `Barlow` & `Inter`.
- [ ] Menyediakan state loading, empty, dan error (`.sq-state`) yang jelas.
- [ ] Responsif penuh pada breakpoint `1100px`, `800px`, dan `480px`.
- [ ] Tidak menampilkan nomor telepon pribadi, password, atau bukti kepemilikan rahasia di area publik.
- [ ] Lulus `npm run build` tanpa error kompilasi.

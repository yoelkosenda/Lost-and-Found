# Lost & Found UNKLAB — Design System

Dokumen ini adalah sumber acuan visual dan interaksi untuk seluruh halaman website Lost & Found UNKLAB. Semua halaman baru—Lost Items, Found Items, Detail Barang, Report Item, AI Matching, My Reports, Notifications, Profile, dan Admin Panel—harus mengikuti aturan di sini agar tetap terasa sebagai satu produk.

Versi: 1.0  
Tanggal: 13 November 2026  
Basis: desain awal halaman Home/Dashboard dan wireframe beranda.

## 1. Prinsip desain

### Jelas sebelum dekoratif

Pengguna harus langsung memahami jenis laporan, lokasi, waktu, status, dan tindakan yang tersedia. Jangan menambahkan ornamen yang mengganggu hierarki informasi.

### Tenang, terpercaya, dan ramah komunitas

Produk ini membantu mahasiswa mengembalikan barang. Gunakan ruang kosong, warna lembut, dan bahasa yang sederhana. Aksen warna dipakai untuk membantu orientasi, bukan untuk menghias setiap elemen.

### Satu tindakan utama per area

Setiap halaman harus memiliki satu CTA utama yang paling menonjol. CTA sekunder tidak boleh memiliki bobot visual yang sama.

### Privasi sejak tampilan pertama

Nomor telepon, bukti kepemilikan, dan data pribadi tidak boleh tampil pada kartu publik. Gunakan pesan internal atau status verifikasi sebagai pengganti kontak langsung.

## 2. Arah visual

Visual menggunakan dashboard yang bersih dengan fondasi navy, permukaan putih, latar abu-abu sangat terang, dan aksen kuning hangat. Bentuk komponen membulat ringan, bukan pill berlebihan. Panel utama boleh memakai ilustrasi geometris sederhana, tetapi konten tetap menjadi fokus.

### Karakter tampilan

- Desktop: sidebar tetap di kiri, konten utama memiliki scroll terpisah.
- Mobile: sidebar berubah menjadi drawer yang dibuka melalui tombol menu.
- Kartu: permukaan putih, border tipis, radius sedang, shadow sangat halus.
- Aksen: gunakan navy untuk struktur, biru untuk aksi, kuning untuk penekanan, dan warna status untuk makna operasional.
- Ikon: sederhana, outline, konsisten dalam ukuran dan stroke.

## 3. Design tokens

### Warna

| Token | Hex | Penggunaan |
| --- | --- | --- |
| `--navy` | `#1F2B4A` | Sidebar, hero, heading penting, primary button |
| `--blue` | `#5069D9` | Link, active navigation, fokus, secondary action |
| `--page-bg` | `#F6F7FB` | Latar halaman utama |
| `--surface` | `#FFFFFF` | Card, input, sidebar, panel |
| `--line` | `#E8EBF1` | Border, divider, timeline |
| `--text` | `#1F2735` | Teks utama |
| `--muted` | `#7E8798` | Teks sekunder dan metadata |
| `--subtle` | `#A2A9B7` | Label, placeholder, caption |
| `--gold` | `#F2B86C` | Aksen hero dan CTA emosional |
| `--peach` | `#FFF0E6` | Latar status/barang hilang |
| `--mint` | `#E5F2ED` | Latar status selesai/barang ditemukan |
| `--lavender` | `#EEE9FB` | Latar status verifikasi |
| `--yellow-soft` | `#FFF6DA` | Latar status menunggu |

Warna baru hanya boleh ditambahkan jika memiliki makna UI yang jelas. Jangan memakai warna random per halaman.

### Status laporan

| Status | Latar | Teks | Makna |
| --- | --- | --- | --- |
| Masih Dicari | `#FFF0E7` | `#C8794D` | Laporan lost masih aktif |
| Sudah Ditemukan | `#E5F2ED` | `#5C9B83` | Informasi barang sudah ditemukan |
| Menunggu Pemilik | `#FFF6DA` | `#AD8125` | Barang found belum diklaim |
| Sedang Diklaim | `#EEE9FB` | `#7967B9` | Ada klaim yang sedang diproses |
| Dalam Verifikasi | `#EEE9FB` | `#7967B9` | Bukti kepemilikan sedang ditinjau |
| Sudah Dikembalikan | `#E5F2ED` | `#5C9B83` | Serah-terima sudah selesai |
| Dibatalkan / Ditutup | `#EEF0F3` | `#697386` | Laporan tidak lagi aktif |

Status harus selalu ditampilkan dengan teks, bukan warna saja.

### Tipografi

Gunakan dua keluarga font:

- `Manrope`: heading, brand, angka statistik, dan judul card.
- `DM Sans`: body text, label, metadata, input, dan tombol.

| Peran | Font | Ukuran desktop | Weight | Catatan |
| --- | --- | --- | --- | --- |
| Page title | Manrope | 28–32px | 800 | Letter spacing sekitar `-1.2px` |
| Section heading | Manrope | 18–20px | 700 | Singkat dan langsung |
| Card title | Manrope | 13–14px | 700 | Satu baris bila memungkinkan |
| Body | DM Sans | 12–14px | 400–500 | Line-height 1.5–1.6 |
| Label/eyebrow | DM Sans | 10px | 700 | Uppercase, letter spacing 1.25px |
| Metadata | DM Sans | 10–11px | 400–500 | Warna muted |
| Button | DM Sans | 11–13px | 700 | Gunakan kata kerja |

Jika font tidak tersedia, fallback harus tetap sans-serif: `Manrope, DM Sans, sans-serif`.

### Spacing dan bentuk

Gunakan kelipatan 4px sebagai dasar:

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| `space-1` | 4px | Jarak ikon dan label kecil |
| `space-2` | 8px | Gap metadata |
| `space-3` | 12px | Padding input kecil |
| `space-4` | 16px | Gap card dan toolbar |
| `space-5` | 20px | Padding card |
| `space-6` | 24px | Gap antar blok |
| `space-8` | 32px | Jarak section |
| `space-10` | 40px | Padding halaman |

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| `radius-sm` | 6px | Badge/status dan kontrol kecil |
| `radius-md` | 8–10px | Button, input, report card |
| `radius-lg` | 12–14px | Stat card dan panel |
| `radius-xl` | 18px | Hero/panel utama |
| `shadow-card` | `0 8px 20px rgba(31,43,74,.06)` | Hover card saja |

## 4. Layout dan navigasi

### App shell

Pada desktop, gunakan dua kolom:

```text
┌────────────────────┬─────────────────────────────────────┐
│ Sidebar / Dashboard │ Topbar                              │
│ tetap 250px         ├─────────────────────────────────────┤
│ tinggi viewport     │ Main content dengan scroll sendiri  │
│                     │                                     │
└────────────────────┴─────────────────────────────────────┘
```

- Sidebar desktop: lebar sekitar 250px, tinggi `100vh`, tidak ikut scroll konten.
- Main content: tinggi `100vh`, `overflow-y: auto`.
- Topbar: tinggi sekitar 65–80px, selalu berada di dalam area main content.
- Padding desktop halaman: sekitar 5vw horizontal, 32–44px vertikal.
- Lebar konten maksimum: sekitar 1300px.

### Sidebar

Urutan navigasi utama:

1. Beranda
2. Barang Hilang
3. Barang Ditemukan
4. Laporan Saya

Area bantuan dan akun berada di bagian bawah. Item aktif memakai latar biru muda, ikon biru, dan indikator vertikal biru di sisi kanan.

Halaman baru tidak boleh membuat sidebar versi sendiri. Gunakan komponen layout yang sama dan hanya ubah item aktif.

### Responsive

- Di bawah 900px, content grid berubah menjadi satu kolom.
- Di bawah 680px, sidebar menjadi drawer fixed.
- Mobile memiliki padding halaman sekitar 18px.
- CTA utama di mobile boleh full-width.
- Jangan menyembunyikan informasi status penting hanya karena layar kecil.

## 5. Komponen standar

### Button

Gunakan label berbasis tindakan: `Buat laporan`, `Ajukan klaim`, `Simpan perubahan`, `Hubungi pelapor`.

- Primary: background navy, teks putih.
- Secondary: background biru sangat muda atau outline tipis.
- Tertiary: teks biru tanpa background.
- Destructive: hanya untuk pembatalan/penghapusan dan harus diberi konfirmasi.
- Tinggi kontrol minimum: 38px desktop; 42px untuk kontrol utama mobile.

### Search dan filter

Search field harus memakai ikon search, placeholder yang menjelaskan target pencarian, dan label aksesibel. Filter Lost/Found, kategori, lokasi, tanggal, dan status memakai kontrol native atau komponen yang perilakunya setara.

### Card laporan

Urutan informasi:

1. Visual/foto atau placeholder.
2. Jenis laporan dan judul barang.
3. Kategori, lokasi, dan waktu.
4. Status.
5. Aksi membuka detail.

Jangan menampilkan kontak privat pada card publik.

### Empty state

Empty state harus menjelaskan kondisi dan tindakan berikutnya, misalnya: “Belum ada laporan yang cocok. Coba ubah kata kunci atau buat laporan baru.” Hindari area kosong tanpa arahan.

### Activity/timeline

Gunakan garis vertikal tipis dan ikon kecil untuk menunjukkan urutan aktivitas. Setiap item minimal memiliki judul aktivitas, objek yang terdampak, dan waktu.

### Form

- Label selalu terlihat; jangan hanya mengandalkan placeholder.
- Field wajib diberi penanda dan pesan validasi yang spesifik.
- Upload foto menjelaskan format dan batas ukuran.
- Bukti klaim diberi penjelasan privasi sebelum pengguna mengunggah.

## 6. Ikon dan ilustrasi

Gunakan ikon outline dengan ukuran umum 16–20px dan stroke sekitar 1.8–2px. Ikon harus membantu pemahaman, bukan menggantikan label penting.

Placeholder visual laporan memakai bidang warna lembut yang berbeda, bukan gambar acak. Ilustrasi hero boleh memakai orbit/geometri sederhana yang sudah dipakai di beranda; jangan menambahkan dekorasi besar pada setiap halaman.

## 7. Interaksi dan motion

- Hover card: naik maksimal 2px dengan shadow lembut.
- Hover button: perubahan warna ringan, bukan animasi besar.
- Drawer mobile: transisi singkat sekitar 200ms.
- Fokus keyboard: outline minimal 3px dengan warna biru transparan.
- Hormati `prefers-reduced-motion: reduce` dan matikan transisi dekoratif.
- Jangan menggunakan auto-advancing carousel atau animasi yang mengalihkan perhatian dari laporan.

## 8. Aksesibilitas

- Kontras teks dan background harus terbaca; jangan menyampaikan status hanya lewat warna.
- Semua tombol ikon memiliki `aria-label`.
- Semua input memiliki label atau accessible name.
- Urutan tab mengikuti urutan visual dan alur tugas.
- Modal, drawer, dan menu harus dapat ditutup dengan keyboard.
- Ukuran target interaktif mobile minimal sekitar 42px.
- Heading harus berurutan dan menjelaskan struktur halaman.

## 9. Aturan implementasi untuk anggota kelompok

- Reuse `src/components/layout` dan `src/components/icons` dari project awal.
- Tambahkan halaman baru di `src/pages`.
- Tambahkan komponen domain di folder terpisah, misalnya `src/components/report-item`.
- Jangan menaruh data API langsung di komponen presentasi; gunakan adapter atau data module.
- Jangan mengubah token global tanpa mencatat alasannya di pull request.
- Jangan membuat warna, radius, atau font baru jika token yang ada sudah cukup.
- Pastikan `npm run build` berhasil sebelum pull request.
- Gunakan branch pendek seperti `feature/report-item` atau `fix/mobile-sidebar`.

## 10. Definition of done visual

Sebuah halaman dianggap sesuai design system jika:

- Memakai shell dan navigasi yang sama.
- Menggunakan token warna, tipografi, spacing, dan radius yang tersedia.
- Menampilkan loading, empty, error, dan success state yang jelas.
- Responsif pada desktop dan mobile.
- Memiliki keyboard focus dan label aksesibel.
- Tidak membocorkan data kontak atau bukti kepemilikan.
- Lulus build dan dapat direview tanpa perubahan visual besar yang tidak terdokumentasi.


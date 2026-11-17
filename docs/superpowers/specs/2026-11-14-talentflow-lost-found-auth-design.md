# SquareUp Dark Theme Lost & Found UNKLAB — Final Design

## Purpose

Build a cohesive student-facing Lost & Found UNKLAB web application adapting the **SquareUp Figma Dark Theme**: deep carbon surfaces (`#1a1a1a`), structured architectural grid borders (`1px solid #262626`), wave-textured section banners with dot-matrix overlays, gradient icon badges, and vibrant neon lime (`#9eff00`) calls to action. All copy, campus locations, and workflows are tailored specifically for Universitas Klabat (UNKLAB) students.

The core delivery prioritizes three working experiences: a public landing page (`/`), student login (`/login`), and an authenticated community dashboard (`/app`), backed by a local Express API and SQLite database foundation for subsequent report and claim workflows.

## Scope

### Included

- Public landing page at `/`.
- Student-only login page at `/login`.
- Protected main menu / dashboard at `/app`.
- React + Vite frontend with custom lightweight History API routing (`src/router.jsx`) and responsive dark-theme layout.
- Express API (`server/index.js`) with SQLite storage (`server/db.js`).
- Password-hash based authentication (`bcryptjs`) and HTTP-only local session cookie (`lf_session`).
- Seeded student account (`student@unklab.ac.id` / `unklab123`) for local demonstration.
- Initial `users`, `reports`, and `claims` database tables.
- API-backed dashboard report list, summary statistics, real-time search, and type filter.
- Loading, empty, validation, error, and success feedback states.

### Excluded from Base Phase (Covered in Team Tasks 1–5)

- Student self-registration, password reset, and external identity providers.
- Admin roles or a separate admin panel (strictly single-role: `student`).
- Production cloud hosting, external SMTP delivery, and deployment secrets.

## Visual System (SquareUp Figma Dark Theme)

- **Palette:**
  - Page background: `--bg-dark` (`#1a1a1a`) and card surface `--bg-card` (`#1f1f1f`).
  - Structural borders & pills: `--grey-15` (`#262626`), `--grey-20` (`#333333`), `--grey-30` (`#4c4c4d`).
  - Typography colors: `--white` (`#ffffff`) for headings, `--grey-90` (`#e6e6e6`) for primary copy, `--grey-60` (`#98989a`) for metadata and descriptions.
  - Primary accent & CTA: `--green-50` (`#9eff00`), hover `--green-60` (`#b1ff33`), highlight text `--green-70` (`#c5ff66`), soft lime `--green-80` (`#d8ff99`).
  - Status accents: Neon lime (`#9eff00` on `rgba(158, 255, 0, 0.12)`) for `Found` items; warm amber (`#ffc470` on `rgba(255, 179, 71, 0.12)`) for `Lost` items.
- **Typography:**
  - `Barlow` (`400`, `500`, `600`, `700`) for headings, navigation, buttons, statistics, and form labels.
  - `Inter` (`400`, `500`, `600`) for report descriptions and item codes.
- **Composition:**
  - Centered `.sq-container` (`width: min(1596px, calc(100% - 64px))`).
  - Sticky `.sq-navbar` with blur backdrop and green cube logo (`/figma/logo-cube.svg`).
  - Section headers (`.sq-section-banner`) featuring dark green tint (`#171b12`), wave overlays (`/figma/banner-wave-*.png`), and dot grids (`/figma/banner-dots.png`).
  - Multi-column bordered card grids (`.sq-services-grid`, `.sq-works-grid`, `.sq-process-grid`, `.sq-why-grid`, `.sq-faq-grid`, `.sq-report-grid`).
- **Interaction:** `0.2s` transform/background transitions; high-contrast `2px solid #9eff00` keyboard focus outline; transitions disabled when `prefers-reduced-motion: reduce` is active.

## Information Architecture

```text
Public visitor
  /                         Landing page (SquareUp Dark Theme)
  /login                    Student sign-in
Student session
  /app                      Protected student dashboard
  /api/auth/*               Authentication API
  /api/reports              Dashboard report data
```

An unauthenticated visit to `/app` redirects to `/login`. A successfully authenticated student visiting `/login` redirects to `/app`.

## Page Specifications

### Landing page (`/`)

1. **Sticky Navbar (`.sq-navbar`):** Cube brand logo (`Lost and Found. UNKLAB`), section anchor links (`Beranda`, `Layanan`, `Laporan`, `Cara Kerja`, `Keunggulan`, `FAQ`), and `Masuk Portal` lime CTA button.
2. **Hero Section (`.sq-hero`):** Dot-matrix backdrop, main heading with `--green-70` highlight, audience pill bar (`Mahasiswa UNKLAB`, `Barang Hilang`, `Barang Temuan`, `Komunitas Peduli`), dual CTA buttons (`Lihat Laporan Terbaru` & `Mulai Mencari`), and SVG wireframe topographic terrain visual (`.sq-hero-terrain`).
3. **Trust & Campus Stats Bar (`.sq-trust-bar`):** Floating trust pill (`Dipercaya oleh 1.200+ Mahasiswa UNKLAB`) and 6-column campus metric/zone grid.
4. **Services Section (`#layanan`):** Wave banner header + 3-column `.sq-services-grid` with gradient `.sq-icon-badge` icons and full-width `.sq-btn-card` links.
5. **Recent Reports Preview (`#laporan`):** Wave banner header + 2x2 `.sq-works-grid` featuring report header, `.sq-status-badge`, visual card orb, location pill (`.sq-work-pill`), and description.
6. **Four-Step Process (`#cara-kerja`):** Wave banner header + 2x2 `.sq-process-grid` with oversized `--green-80` step numbers (`01`–`04`).
7. **Why Choose Us (`#keunggulan`):** Wave banner header + 2x2 `.sq-why-grid` highlighting UNKLAB student exclusivity, community collaboration, privacy, and real-time status.
8. **Interactive FAQ (`#faq`):** Wave banner header + 2-column `.sq-faq-grid` accordion with toggleable answers.
9. **Closing CTA & Footer (`.sq-cta-banner` & `.sq-footer`):** Glowing cube emblem, closing call to action, campus contact pills, and copyright.

### Login page (`/login`)

- Sticky `.sq-navbar` with back link to `/`.
- `.sq-cta-banner.sq-login-banner` welcome header with cube emblem and introductory instructions.
- `.sq-login-shell` containing `.sq-form-box`:
  - 2-column `.sq-form-row` with `.sq-input-card` for `Email Mahasiswa` and `Password` (including `.sq-password-toggle`).
  - `.sq-access-card` featuring a 2x2 `.sq-check-grid` summarizing portal capabilities.
  - `.sq-form-footer` with `.sq-btn-lime.sq-submit-btn` and `.sq-demo-pill` displaying local demo credentials (`student@unklab.ac.id` / `unklab123`).

### Main menu / Dashboard (`/app`)

- Sticky `.sq-navbar` with section links (`Ringkasan`, `Laporan`, `Aktivitas`), `.sq-user-chip` (initials avatar, student name, role), and `Keluar ↗` button.
- **Dashboard Hero (`.sq-dash-hero`):** Personalized greeting (`Halo, {firstName}.`), `+ Buat laporan` primary lime CTA, and `.sq-dash-highlight` card showing weekly found items count.
- **Summary Cards (`.sq-dash-stats`):** 3-column bordered `.sq-stat-card` row for `Barang hilang (LOST)`, `Barang ditemukan (FOUND)`, and `Total laporan (TOTAL)`.
- **Report Explorer (`#laporan`):** `.sq-dash-toolbar` with search input (`.sq-search-field`) and type filter dropdown (`.sq-select-field`), followed by a 2-column `.sq-report-grid` of `.sq-report-card` items.
- **Community Activity Banner (`#aktivitas`):** `.sq-cta-banner` highlighting community impact, ready to be expanded into a live activity feed.

## Backend and Data Model

### API contract

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Validate credentials and create a local session. |
| `POST` | `/api/auth/logout` | End the current session. |
| `GET` | `/api/auth/me` | Return the signed-in student profile. |
| `GET` | `/api/reports` | Return report cards and dashboard summary inputs. |

### Tables

| Table | Essential fields |
| --- | --- |
| `users` | `id`, `name`, `email` (unique), `password_hash`, `role` (`student`), `created_at` |
| `reports` | `id`, `owner_id`, `type`, `title`, `category`, `location`, `description`, `status`, `reported_at`, `image_url` (nullable) |
| `claims` | `id`, `report_id`, `claimant_id`, `status`, `submitted_at` |

## Error Handling and Accessibility

- API failures display a clear message inside `.sq-state.error` with a `Coba lagi` button.
- Every form control has a visible `.sq-input-label` or `aria-label`.
- Report status is always communicated via text inside `.sq-status-badge` in addition to color.
- Supports keyboard navigation (`:focus-visible` lime outline), responsive single-column collapse below `800px`, and `prefers-reduced-motion`.

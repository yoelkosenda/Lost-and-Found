# SquareUp Dark Theme Lost & Found UNKLAB — Implementation Plan

> Prerequisite: approved design at `docs/superpowers/specs/2026-11-14-talentflow-lost-found-auth-design.md` and `docs/design-system.md`.

## 1. Establish the application boundaries

1. Inspect the Vite scripts and retain the React entry point (`src/main.jsx`).
2. Configure server scripts and dependencies for Express, SQLite (`better-sqlite3`), password hashing (`bcryptjs`), session cookies (`cookie-parser`), and concurrent local development (`concurrently`).
3. Maintain `server/db.js` and `server/index.js` for SQLite initialization, seed data, session middleware, and API routes.
4. Ensure `.gitignore` excludes `server/data/lost-and-found.db`, `node_modules`, `dist`, and `.env` files.

**Verification:** `npm install`, `npm run build`, and `npm run dev` start cleanly without committing generated database or environment files.

## 2. Implement persistent local authentication

1. Define SQLite initialization with `users`, `reports`, and `claims` tables and foreign key constraints.
2. Add idempotent seed data: one password-hashed UNKLAB student (`student@unklab.ac.id` / `unklab123`) and representative campus reports.
3. Add HTTP-only session cookie middleware (`lf_session`).
4. Implement `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, and protected `GET /api/reports`.

**Verification:** requests verify valid login, rejected invalid login (`401`), protected endpoint rejection (`401`), report retrieval after login, and logout invalidation.

## 3. Build the SquareUp Figma Dark Theme visual foundation

1. Configure `src/styles/global.css` with SquareUp dark theme tokens (`--bg-dark: #1a1a1a`, `--bg-card: #1f1f1f`, `--grey-10` to `--grey-90`, `--green-50: #9eff00` to `--green-99`, `--icon-gradient`) and Google Fonts (`Barlow` and `Inter`).
2. Store SVG icons, cube brand logo, dot matrices, and wave banner textures in `public/figma/`.
3. Build shared `.sq-page`, `.sq-container`, `.sq-navbar`, `.sq-section`, `.sq-section-banner`, `.sq-cta-banner`, `.sq-btn` (`.sq-btn-lime`, `.sq-btn-outline`, `.sq-btn-card`), and `.sq-footer` styles.
4. Add focus visibility (`outline: 2px solid var(--green-50)`), responsive media queries (`1100px`, `800px`, `480px`), and `prefers-reduced-motion` support.

**Verification:** inspect landing, login, and dashboard at desktop and mobile widths; verify keyboard focus and zero horizontal overflow.

## 4. Add routes, API adapter, and session guard

1. Use the lightweight History API router in `src/router.jsx` (`Link`, `navigate`, `usePath`).
2. Route all HTTP calls exclusively through `src/lib/api.js` with `credentials: 'include'`.
3. Manage session hydration via `api.me()` in `src/App.jsx`, redirecting unauthenticated `/app` visits to `/login` and authenticated `/login` visits to `/app`.

**Verification:** refresh-safe navigation for public, authenticated, and logged-out states behaves as specified.

## 5. Implement the public landing page (`src/pages/LandingPage.jsx`)

1. Build the sticky `.sq-navbar`, `.sq-hero` with SVG topographic terrain, `.sq-trust-bar`, 3-column `#layanan` grid, 2x2 `#laporan` preview grid, 2x2 `#cara-kerja` process steps, 2x2 `#keunggulan` cards, interactive `#faq` accordion, `.sq-cta-banner`, and `.sq-footer`.
2. Wire all portal CTAs to `/login` and ensure section anchors scroll smoothly.

**Verification:** content hierarchy matches the SquareUp dark theme specification, FAQ toggles work, and grids collapse cleanly to 1 column on mobile.

## 6. Implement student login (`src/pages/LoginPage.jsx`)

1. Build the login banner (`.sq-login-banner`) and form container (`.sq-login-shell` & `.sq-form-box`).
2. Implement controlled email/password `.sq-input-card` fields, visible `.sq-input-label`, `.sq-password-toggle`, `.sq-access-card` feature checklist, inline error alert (`.sq-form-error`), and submit loading feedback.
3. Display local demo credentials inside `.sq-demo-pill`.

**Verification:** valid demo login reaches `/app`; invalid data shows `.sq-form-error`; keyboard submit and focus order work.

## 7. Implement the authenticated dashboard (`src/pages/DashboardPage.jsx`)

1. Add authenticated `.sq-navbar` with `.sq-user-chip` and `.sq-logout-btn`.
2. Create `.sq-dash-hero` welcome banner with `.sq-dash-highlight`, 3-column `.sq-dash-stats` (`LOST`, `FOUND`, `TOTAL`), `.sq-dash-toolbar` (search + type filter), 2-column `.sq-report-grid` of `.sq-report-card` items, and `#aktivitas` banner.
3. Fetch reports through `api.reports()`, compute summary counts, and filter client-side by query and type.
4. Implement loading state, no-results state, and error state with retry (`.sq-state`).

**Verification:** report data renders from SQLite; search and type filter update the grid; empty/error/retry states are reachable and readable.

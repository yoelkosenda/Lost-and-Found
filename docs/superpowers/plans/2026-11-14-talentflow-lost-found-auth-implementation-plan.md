# Talentflow-inspired Lost & Found — Implementation Plan

> Prerequisite: approved design at `docs/superpowers/specs/2026-11-14-talentflow-lost-found-auth-design.md`.

## 1. Establish the application boundaries

1. Inspect the current Vite scripts and retain the existing React entry point.
2. Add server scripts and dependencies for Express, SQLite, password hashing, session cookies, and concurrent local development.
3. Create a `server/` structure that keeps database setup, middleware, and HTTP routes separate.
4. Update `.gitignore` to exclude the local SQLite database and local environment files.

**Verification:** `npm install`, `npm run build`, and the local server entry point all start without committing generated database or environment files.

## 2. Implement persistent local authentication

1. Define SQLite initialization with `users`, `reports`, and `claims` tables and referential constraints.
2. Add idempotent seed data: one password-hashed UNKLAB student and representative reports/activity.
3. Add session middleware with a development-safe HTTP-only cookie configuration.
4. Implement `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.
5. Implement auth middleware and `GET /api/reports` for a signed-in student.
6. Return consistent JSON error objects and correct `400`, `401`, and `500` HTTP responses.

**Verification:** manual or automated requests prove valid login, rejected invalid login, protected endpoint rejection, report retrieval after login, and logout invalidation.

## 3. Build the Talentflow-inspired visual foundation

1. Replace the old dashboard-only tokens with global variables for warm cream, forest/ink, green action, neutral surfaces, editorial serif, and utility sans-serif fonts.
2. Add base reset, focus visibility, reduced-motion support, responsive container rules, and shared button/form/card primitives.
3. Build public and authenticated headers plus a concise footer.
4. Ensure original Lost & Found text and original visual treatments; do not reuse copyrighted template assets.

**Verification:** inspect landing, login, and app shell at desktop and narrow mobile widths; verify keyboard focus and no horizontal overflow.

## 4. Add routes, API adapter, and session guard

1. Install and configure a client-side router (or a minimal route layer if package constraints require it).
2. Add `src/lib/api.js` with fetch wrappers, credential forwarding, and normalized API errors.
3. Add an auth context/provider that loads `/api/auth/me`, exposes login/logout, and tracks loading/error state.
4. Redirect unauthenticated `/app` visits to `/login`; redirect authenticated `/login` visits to `/app`.

**Verification:** refresh-safe navigation for public, authenticated, and logged-out states behaves as specified.

## 5. Implement the public landing page

1. Build the hero, header, proof/statistics, three-step process, recent-report preview, closing CTA, and footer.
2. Use seeded reports in the recent-report preview through a public-safe source or a static preview subset.
3. Wire all auth-facing CTAs to `/login` and ensure anchors navigate predictably.

**Verification:** content hierarchy matches the design specification, all CTAs work, and the page reflows to one column on mobile.

## 6. Implement login

1. Build the two-panel editorial login layout and mobile single-column fallback.
2. Implement controlled email/password inputs, visible labels, show/hide password control, inline validation, and loading feedback.
3. Connect submit to the API and show invalid-credential or network errors without revealing account existence.
4. Present local demo credentials only in development-facing copy.

**Verification:** valid demo login reaches `/app`; invalid data remains on the form with a useful error; keyboard submit and focus order work.

## 7. Implement the authenticated main menu

1. Add authenticated header with student identity and logout.
2. Create welcome/CTA panel, report summary cards, report search/type controls, report cards, and activity panel.
3. Fetch reports through the API adapter, calculate or render summary values, and filter client-side after data loads.
4. Implement loading skeleton/state, no-results state, and error state with retry.
5. Keep report creation as an accessible, clearly labeled non-creating placeholder until its feature is implemented.

**Verification:** report data renders from SQLite; search and report type filter update the list; empty/error/retry states are reachable and readable.

## 8. Document and validate

1. Update the README with development commands, local database behavior, and demo login credentials.
2. Run the frontend production build and backend/API verification suite.
3. Review staged files for database artifacts, environment files, and secrets.
4. Commit each coherent implementation slice only after its relevant checks pass.

**Final acceptance:** all verification points in the approved design specification pass, the site is responsive, and a local student can log in, see the main menu, and log out using persisted SQLite-backed data.

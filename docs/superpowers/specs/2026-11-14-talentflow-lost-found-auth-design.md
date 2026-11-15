# Talentflow-inspired Lost & Found — Final Design

## Purpose

Replace the current static Lost & Found UNKLAB dashboard with a cohesive student-facing web application. The visual language is inspired by the supplied Talentflow Webflow reference: warm cream surfaces, large editorial serif headings, spacious SaaS composition, fine borders, rounded controls, and confident green calls to action. Content, illustrations, icons, and branding remain original to Lost & Found UNKLAB.

The first delivery prioritizes three working experiences: a public landing page, student login, and an authenticated main menu. It also establishes a local backend and database foundation for later report and claim flows.

## Scope

### Included

- Public landing page at `/`.
- Student-only login page at `/login`.
- Protected main menu at `/app`.
- React + Vite frontend routing and responsive layout.
- Express API with SQLite storage.
- Password-hash based authentication and HTTP-only local session cookie.
- Seeded student account for local demonstration.
- Initial `users`, `reports`, and `claims` database tables.
- API-backed dashboard report list, summary, search, and type filter.
- Loading, empty, validation, error, and success feedback states.

### Excluded from this phase

- Student self-registration, password reset, and external identity providers.
- Admin roles or a separate admin experience.
- Real photo upload, report creation/editing, messaging, and complete claim UI.
- Production hosting, external email delivery, and deployment secrets.

## Visual System

- **Palette:** warm cream page background, deep forest/ink text, a saturated green primary action, muted sage/stone supporting surfaces, and restrained warm highlight accents for report types.
- **Typography:** display serif for hero and prominent section titles; clean sans-serif for navigation, forms, body copy, metadata, and controls.
- **Composition:** broad desktop gutters, clear asymmetric hero composition, card groups separated by generous space, thin neutral borders, and rounded but not pill-heavy controls.
- **Imagery:** original Lost & Found item and campus-themed graphic compositions. Do not copy proprietary Talentflow illustrations, copy, photos, or assets.
- **Interaction:** 150–220 ms opacity/transform transitions; visible keyboard focus; motion reduced when the user requests reduced motion.

## Information Architecture

```text
Public visitor
  /                         Landing page
  /login                    Student sign-in
Student session
  /app                      Protected main menu
  /api/auth/*               Authentication API
  /api/reports              Dashboard report data
```

An unauthenticated visit to `/app` redirects to `/login`. A successfully authenticated student visiting `/login` redirects to `/app`.

## Page Specifications

### Landing page (`/`)

1. Compact header: Lost & Found UNKLAB brand, anchor navigation, and `Masuk` CTA.
2. Editorial hero: a clear recovery-focused statement, short supporting copy, primary `Mulai mencari` CTA, secondary process link, and original illustrative object composition.
3. Community proof: concise counts for reports, returns, and active students.
4. Three-step process: report, match, return.
5. Recent report preview: cards backed by seed data.
6. Closing CTA and concise footer.

### Login page (`/login`)

- Two-column editorial composition on wide screens; supporting community/value panel and focused form card.
- Visible labels for email and password, inline validation, show/hide password control, submit loading state, and useful server errors.
- Demo credential hint for local development only.
- Mobile converts to a single-column, readable form-first layout.

### Main menu (`/app`)

- Authenticated header with the student name and logout control.
- Welcome panel and primary `Buat laporan` CTA (non-creating placeholder in this phase).
- Summary cards calculated from report records.
- Search and report-type filtering.
- Report cards with title, lost/found type, category, place, time, and text status.
- Recent activity panel sourced from seeded report events.
- Clear loading, API-error/retry, and no-results states.

## Components and Boundaries

- `src/pages/`: route-level compositions only.
- `src/components/layout/`: shared header, footer, authenticated app shell, and navigation primitives.
- `src/components/auth/`: login form and field-level validation presentation.
- `src/components/landing/`: public landing sections.
- `src/components/dashboard/`: summary, filtering, report card/list, and activity components.
- `src/lib/api.js`: the only frontend adapter that calls backend endpoints.
- `server/`: Express application, route handlers, auth middleware, database initialization, and seed data.

Presentation components receive data and callbacks; they do not call HTTP endpoints directly.

## Backend and Data Model

### API contract

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Validate credentials and create a local session. |
| `POST` | `/api/auth/logout` | End the current session. |
| `GET` | `/api/auth/me` | Return the signed-in student profile. |
| `GET` | `/api/reports` | Return report cards and dashboard summary inputs. |

All routes other than login must reject an invalid/missing session with `401`. The frontend maps `401` to the login route.

### Tables

| Table | Essential fields |
| --- | --- |
| `users` | `id`, `name`, `email` (unique), `password_hash`, `role` (`student`), `created_at` |
| `reports` | `id`, `owner_id`, `type`, `title`, `category`, `location`, `description`, `status`, `reported_at`, `image_url` (nullable) |
| `claims` | `id`, `report_id`, `claimant_id`, `status`, `submitted_at` |

SQLite is stored locally and initialized/seeding occurs through a server-owned script. A seeded local account is documented in the README for developer testing. Its password is hashed and never placed in frontend source.

## Error Handling and Accessibility

- API failures show a short plain-language message and a retry path; no raw server error is shown to students.
- Login responses avoid revealing whether an email address exists beyond an invalid-credentials message.
- Every form control has a visible label and accessible error association.
- Buttons, nav, menu controls, and icon-only controls have accessible names and keyboard focus.
- Report type/status is communicated by text in addition to color.
- The app supports keyboard use, a logical heading hierarchy, responsive reflow, and `prefers-reduced-motion`.

## Verification

1. Frontend production build succeeds.
2. Valid seeded credentials create a session and enter `/app`.
3. Invalid credentials show an inline login error.
4. `/app` and `/api/reports` reject unauthenticated requests.
5. Logout ends the session and returns the visitor to public/login state.
6. Dashboard shows loading, data, filtering/no-results, and API error/retry states.
7. Landing, login, and main menu are checked at desktop and mobile viewport widths.

## Implementation Sequence

1. Replace global design tokens and construct the shared responsive layout.
2. Build landing and login views using original Lost & Found content.
3. Add Express/SQLite initialization, seed, session auth, and API routes.
4. Wire frontend session guard and login/logout to the API.
5. Implement API-driven main-menu data states and complete verification.

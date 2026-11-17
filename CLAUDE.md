# Claude Code Guidelines

Read and adhere to `AGENTS.md`, `docs/design-system.md`, and `docs/HANDOFF-2026-11-15.md` before making changes.

- Single role: Student (`student`). No admin.
- Custom router: `src/router.jsx` & `src/App.jsx`. No `react-router-dom`.
- API calls: strictly via `src/lib/api.js`. No direct `fetch()` in components.
- Design: SquareUp Figma Dark Theme (`#1a1a1a`, `#262626`, `#9eff00`, Barlow & Inter fonts, `.sq-*` CSS classes). Text status labels mandatory.
- Verification command: `npm run build`.

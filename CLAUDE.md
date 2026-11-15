# Claude Code Guidelines

Read and adhere to `AGENTS.md` and `docs/HANDOFF-2026-11-15.md` before making changes.

- Single role: Student (`student`). No admin.
- Custom router: `src/router.jsx` & `src/App.jsx`. No `react-router-dom`.
- API calls: strictly via `src/lib/api.js`. No direct `fetch()` in components.
- Design: Talentflow aesthetic (`#f7f5ef`, `#193529`, `#c9ee5b`, DM Serif Display, DM Sans). Text status labels mandatory.
- Verification command: `npm run build`.

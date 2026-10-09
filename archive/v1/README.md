# Archived portfolio v1

Source for the original (2024-era) portfolio, preserved for historical reference.
Originally hosted on Firebase (Hosting + Firestore + Storage), now served from
Cloudflare at `https://bcpletcher.com/v1/`.

- Data: D1 table `archive_projects` (archive = `v1`), exposed at `GET /api/archive/v1/projects`.
- Media: R2 bucket `bcpletcher-artwork`, keys `Archive/v1/Projects/<project>/<file>`, served read-only at `/api/media/Archive/v1/Projects/...`.
- Built output is committed to `frontend/public/v1/` (hash routing, `base: "/v1/"`).
- Rebuild: `cd archive/v1/frontend && npm ci && npm run build`, then replace `frontend/public/v1/` with `dist/`.
- The original Firebase-backed source remains on the `archives/v1` branch.

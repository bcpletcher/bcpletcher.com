# Archived portfolio v1

Source for the original (2024-era) portfolio, preserved for historical reference.
Originally hosted on Firebase (Hosting + Firestore + Storage); now served by
Cloudflare at `https://v1.bcpletcher.com/`, fully separate from the current site.

- Hosting: Cloudflare Pages project `bcpletcher-v1` (custom domain `v1.bcpletcher.com`),
  serving the static build in `site/`. It is not part of the main site's build or CD.
- API: the shared Worker also routes `v1.bcpletcher.com/api/*`. Archive data is
  `GET /api/archive/v1/projects` (D1 table `archive_projects`, SQL in `d1-archive-projects.sql`);
  media is read-only from R2 `bcpletcher-artwork` under `Archive/v1/Projects/...`
  via `/api/media/Archive/v1/Projects/...`.
- The site is frozen. To redeploy the static build:
  `npx wrangler pages deploy archive/v1/site --project-name bcpletcher-v1 --branch main`
- Rebuild (only if ever needed): `cd frontend && npm ci && npm run build`, then copy `dist/` to `site/`.
- The original Firebase-backed source remains on the `archives/v1` branch.

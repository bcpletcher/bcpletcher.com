# bcpletcher.com

<p>
  <img src="frontend/src/assets/images/logo.svg" alt="bcpletcher.com logo" width="96" height="96" />
</p>

### Status
[![Live Site](https://img.shields.io/badge/live-www.bcpletcher.com-F38020?logo=cloudflare&logoColor=white)](https://www.bcpletcher.com)
[![Last Commit](https://img.shields.io/github/last-commit/bcpletcher/bcpletcher.com)](https://github.com/bcpletcher/bcpletcher.com/commits/main)

### Tech stack
![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-f7d336?logo=pinia&logoColor=111827)
![Vue Router](https://img.shields.io/badge/Vue_Router-5-42b883?logo=vue.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-F38020?logo=cloudflare&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=0b0b0b)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?logo=prettier&logoColor=111827)

Personal portfolio site powered by Vue 3 + Vite with Cloudflare-backed data/storage (D1 + R2 + Worker API).

## Repository structure
- `frontend/`: Frontend application (Vite)
- `cloudflare/worker/`: Cloudflare Worker API (admin auth + CRUD + image ops)
- `cloudflare/d1-schema.sql`: D1 schema (`projects`, `project_images`)
- `cloudflare/migrations/`: D1 migrations applied by hand (admin login lockout)
- `cloudflare/scripts/`: D1 export helper, `backup-portfolio.mjs` and the Unraid weekly backup script
- `archive/v1/`: frozen v1 portfolio (served at `v1.bcpletcher.com`, see below)

## Prerequisites
- **Node.js 22** (standardized via `.nvmrc`)
- **npm**
- **Wrangler CLI** for Cloudflare Worker/D1/R2 workflows

> This repo enforces the Node version via `engine-strict=true` in `.npmrc`.

## Quick start
### 0) Use the right Node version
This repo is standardized on `nvm` via `.nvmrc`.

```bash
nvm install
nvm use
```

### 1) Install dependencies
```bash
cd frontend
npm install

cd ../cloudflare/worker
npm install
```

### 2) Run the frontend
```bash
cd frontend
npm run serve
```

### 3) (Optional) Run local Cloudflare API
```bash
cd cloudflare/worker
npx wrangler dev
```

## Environment variables
The frontend reads configuration from Vite env files:
- `frontend/.env.development`: used by `npm run serve`
- `frontend/.env.production`: used by `npm run build`

### Recommended setup
Copy the example file and create **local-only** env files (not committed):

```bash
cp frontend/.env.example frontend/.env.development.local
cp frontend/.env.example frontend/.env.production.local
```

Then fill in the runtime values.

> `frontend/.env.example` is tracked. Any `.env*.local` file is ignored by git.

### Required Vite values
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Cloudflare API base URL (leave empty for same-origin) |
| `VITE_MEDIA_BASE_URL` | Public R2/CDN base URL for media files |

### Feature flags
| Variable | Type | Default | Notes |
|---|---:|---:|---|
| `VITE_USE_EMULATOR` | boolean | `false` | Reserved legacy flag; no effect in Cloudflare runtime path. |
| `VITE_CACHE_ENABLED` | boolean | `true` | Enables client caching (IndexedDB via `idb`). |
| `VITE_CACHE_TTL_MINUTES` | number | `60` | Cache freshness window before refetch. |
| `VITE_SIMULATE_BOOT_ERROR` | boolean | `false` | Forces the boot overlay into error mode (dev only). |
| `VITE_MEDIA_BASE_URL` | string | empty | Public base URL for image paths (e.g. R2 custom domain). |
| `VITE_ENABLE_RESPONSIVE_SRCSET` | boolean | `false` | Keep disabled until resized R2 variants are seeded and verified. Originals remain the source of truth. |

## Common scripts
### Frontend (`frontend/`)
```bash
npm run serve    # dev server (vite.config.dev.mjs)
npm run build    # production build (vite.config.prod.mjs)
npm run preview  # preview the build
npm run lint     # eslint
npm run test:coordination # upload/persist/delete ordering and cleanup checks
```

### D1 export (`cloudflare/scripts/`)
```bash
node cloudflare/scripts/export-projects-from-d1.mjs                 # D1 -> frontend/public/projects.json
PUBLISH_R2=1 CLOUDFLARE_R2_BUCKET=<bucket> node cloudflare/scripts/export-projects-from-d1.mjs  # also upload to R2
```

### Cloudflare Worker API (`cloudflare/worker/`)
```bash
cd cloudflare/worker
npm test                # local Worker routing/auth/CORS/data/media checks
npx wrangler dev         # local API at http://localhost:8787
npx wrangler deploy      # deploy API
```

### Cloudflare Worker env (required for admin create/update/images)
Set these for the Cloudflare Worker API:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `MEDIA_BASE_URL` (public R2/CDN base)
- `ALLOWED_ORIGIN` (comma-separated exact origins; never use `*`)

Production `ALLOWED_ORIGIN` values are:
`https://www.bcpletcher.com`, `https://bcpletcher.com`, and `https://next.bcpletcher.com`.
For local development, add the configured dev origin (for example `http://localhost:5173`) to the comma-separated value; do not add it to production unless intentionally needed.

## Deployment

### GitHub-to-Cloudflare Worker CD

GitHub Actions is the production deployment control. A push to `main`, or a
manual dispatch from `main`, runs both validation jobs before any production
credential is used. The frontend job runs Node 22 installation, coordination
tests, lint, build, and production audit, then preserves the verified `dist`
directory as a short-lived artifact. The Worker job runs Node 22 installation,
tests, Wrangler dry-run, and production audit.

Deployment is ordered: the existing Cloudflare Pages project
`bcpletcher-com-staging` receives the verified frontend artifact first; only a
successful Pages deployment permits the Worker deployment. Production
concurrency is non-canceling so an in-progress release is not interrupted by a
later run.

The protected GitHub `production` environment uses only these deployment
secrets: `CLOUDFLARE_PAGES_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, and
`CLOUDFLARE_ACCOUNT_ID`. Worker runtime values
(`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ALLOWED_ORIGIN`,
and `MEDIA_BASE_URL`) remain Cloudflare Worker secrets/vars and are not GitHub
workflow inputs. The Worker command uses Wrangler `--keep-vars`, so
dashboard-managed Worker variables not represented in the repository
configuration are retained. Neither job changes DNS, routes, or D1/R2 data.

### Frontend hosting (Cloudflare Pages)
```bash
cd frontend
npm run build
```

The GitHub Actions Pages deployment targets the existing project with these
exact production settings:

- Repository: `bcpletcher/bcpletcher.com`
- Production branch: `main`
- Project root / root directory: `frontend`
- Build command: `npm ci && npm run build`
- Build output directory: `dist`

The Pages token should be a custom account-scoped token with only **Cloudflare
Pages: Edit** for this account. The Worker token should have **Workers Scripts:
Edit** for this account and only the `bcpletcher.com` **Workers Routes: Edit**
permission plus the minimum zone-read permission Wrangler requires to resolve
those routes. Do not grant Pages, DNS, D1, R2, account-admin, or global-key
permissions to the Worker token. Never commit or print any token value.

Keep the previous Pages deployment available (do not delete it) until a new release is verified; Pages keeps deployment history for rollbacks.

This repository does not have an isolated staging D1/R2 environment; do not call
the `next.bcpletcher.com` binding a staging binding.

### API hosting (Cloudflare Worker)
```bash
cd cloudflare/worker
npx wrangler deploy
```

Production deployment is performed by the GitHub Actions workflow above. The
manual command is for local or separately authorized operations only:

- Keep the existing Worker routes for `bcpletcher.com/api/*`, `www.bcpletcher.com/api/*`, and `next.bcpletcher.com/api/*`.
- Keep the Worker on custom zone routes with `workers_dev = false`; the frontend uses same-origin `/api` in production and the Vite proxy for local development.

## Operations

### Rollout notes
- Deploy the Worker API first (`/api/projects`, `/api/admin/*`); the frontend deploys through Pages.
- Leave `VITE_API_BASE_URL` empty in production (same-origin `/api`); local development uses the Vite proxy.
- Set `VITE_MEDIA_BASE_URL` only when a reviewed public R2/CDN custom domain exists.
- Keep `VITE_ENABLE_RESPONSIVE_SRCSET=false` until resized variants are seeded and verified.
- Database changes live in `cloudflare/migrations/` (apply with `wrangler d1 execute bcpletcher-db --remote --file <file>`; each file is idempotent). Apply a migration before, or together with, the Worker release that uses it.

### Rollback
- **Frontend:** Cloudflare dashboard → Workers & Pages → the Pages project → Deployments → pick the last good deployment → Rollback. Or revert the commit on `main`.
- **Worker:** `cd cloudflare/worker && npx wrangler rollback` (or revert the commit on `main`; the deploy workflow redeploys).
- **Data:** D1 has automatic point-in-time recovery (Time Travel, 7 days on the Free plan): `wrangler d1 time-travel info bcpletcher-db` then `wrangler d1 time-travel restore bcpletcher-db --timestamp <unix-seconds>`. A restore overwrites the database in place, so take a backup first (below). R2 has no versioning, so rely on the backups.
- Do not delete the previous deployment while diagnosing an incident.

### Admin login protection
Two layers protect `POST /api/admin/login`:
1. **Cloudflare edge rate-limiting rule** (dashboard → Security → WAF → Rate limiting rules). The Free plan allows one rule, counted per IP over 10 seconds with a 10-second block, so it only slows rapid bursts (a burst of bad logins returns `429` after about 9 requests and clears within seconds).
2. **Worker lockout** (`handleLogin`, table `admin_login_attempts`, migration `cloudflare/migrations/0001_admin_login_attempts.sql`): 5 failed attempts from one address within 15 minutes locks that address for 15 minutes (`429` with `Retry-After`, even for the correct password), and 30 failures across all addresses within an hour locks everyone for 15 minutes. Addresses are stored only as a hash. A successful login clears that address. If the table is missing the limiter fails open, so apply the migration. Passwords are compared in constant time.

To unlock yourself immediately: `wrangler d1 execute bcpletcher-db --remote --command "DELETE FROM admin_login_attempts"`.

### Backups and restore
Two complementary backups; D1 also keeps 7 days of automatic point-in-time recovery (Time Travel, Free plan).

- **Weekly snapshot on the home server (automatic, no credentials).** `cloudflare/scripts/unraid-portfolio-backup.sh` runs as an Unraid User Script (Sundays, 04:45). It reads the site's public API and writes `snapshot-YYYY-MM-DD/` to the `backups` share: `projects.json`, `archive-v1.json`, every referenced image under `media/`, `manifest.sha256` and `manifest.json`. It verifies every download and keeps the newest 12, and Unraid raises a notification on failure. Install by copying the script to `/boot/config/plugins/user.scripts/scripts/<name>/script` and scheduling it in Settings → User Scripts.
- **Full database dump (manual).** `node cloudflare/scripts/backup-portfolio.mjs` uses your logged-in `wrangler` (read-only against Cloudflare) to write `d1.sql` (schema + data), the referenced R2 objects and `manifest.json` to `~/bcpletcher-backups/portfolio-YYYY-MM-DD/`. Run it before risky changes. Re-running into the same folder resumes.

Restore: for a full database restore, recreate or empty the database and run `wrangler d1 execute bcpletcher-db --remote --file d1.sql`, then re-upload images with `wrangler r2 object put bcpletcher-artwork/<key> --file media/<key> --remote` (folder layout mirrors the R2 keys). From a weekly snapshot, re-upload the images the same way and re-create each project from `projects.json` through the admin upsert endpoint; archive records come from `archive-v1.json`.

## Archived v1 portfolio and Firebase retirement
The project previously ran on Firebase (Hosting, Firestore, Storage, Functions). That stack has been fully retired.

- The current site runs entirely on Cloudflare (Pages + Worker + D1 + R2).
- The original v1 portfolio is preserved as a frozen archive at `https://v1.bcpletcher.com/`. It is its own Pages project (`bcpletcher-v1`) built from `archive/v1/site`, with data in the D1 table `archive_projects` and media in R2 under `Archive/v1/`. See `archive/v1/README.md`.
- The Firebase-era source and migration tooling remain in git history and on the protected `archives/v1` branch.

## Troubleshooting
### Boot loader shows maintenance message
- Confirm Cloudflare API is reachable (`/api/projects` should return JSON, not HTML).
- Ensure `VITE_SIMULATE_BOOT_ERROR=false`.

### Caching issues / stale data
- Set `VITE_CACHE_ENABLED=false` to disable caching.
- Admin (signed in): use the top banner **Clear cache** button to clear IndexedDB cache + reload.
- QA URLs:
  - `/?nocache=1` bypasses cache read/write for that page load (forces a network boot).
  - `/?clearcache=1` clears the projects cache then boots normally.

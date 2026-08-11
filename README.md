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
- `firebase/functions/`: legacy migration/scripts workspace
- `firebase.json`: Firebase Hosting configuration

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
| `VITE_CLOUDFLARE_PROJECTS_API_URL` | string | empty | Optional direct projects JSON URL (otherwise app uses `/api/projects`). |
| `VITE_MEDIA_BASE_URL` | string | empty | Public base URL for image paths (e.g. R2 custom domain). |
| `VITE_API_BASE_URL_FALLBACK` | string | empty | Optional fallback API origin (recommended: Worker `workers.dev` URL during route/DNS cutover). |

## Common scripts
### Frontend (`frontend/`)
```bash
npm run serve    # dev server (vite.config.dev.mjs)
npm run build    # production build (vite.config.prod.mjs)
npm run preview  # preview the build
npm run lint     # eslint
```

### Functions (`firebase/functions/`)
```bash
npm run serve            # firebase emulators:start --only functions,firestore
npm run deploy:functions # deploy functions only
npm run logs:functions   # view function logs
npm run lint             # eslint
npm run cloudflare:snapshot:callable # export projects JSON from prod callable
npm run cloudflare:export:projects # export projects JSON from D1 -> frontend/public/projects.json
npm run cloudflare:publish:projects # export projects JSON and upload to R2
npm run cloudflare:migrate:prepare # generate manifest + D1 SQL (no writes)
npm run cloudflare:migrate:apply   # upload to R2 + apply D1 SQL
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

## Security / maintenance notes
- Cloud Functions runtime is set to **Node 22** via `firebase/functions/package.json` (`engines.node`).
- `firebase-tools` is pinned to a recent version in `firebase/functions` to keep `npm audit` clean.
- Removed unused Functions dependencies (e.g. `username-generator`).

## Functions emulator workflow (seeded with production data)
When you run Firestore + Functions emulators, Firestore starts **empty** unless you import data.
This repo supports seeding the Firestore emulator from a production Firestore export.

### Export production Firestore (whenever you want fresh seed data)
This is done with `gcloud` (not the Firebase CLI):

```bash
gcloud config set project pletcher-portfolio-app
EXPORT_PATH="gs://pletcher-portfolio-app.firebasestorage.app/firestore-exports/$(date +%Y%m%d-%H%M%S)"
gcloud firestore export "$EXPORT_PATH"
```

### One command you run every time (kill ports + refresh seed + start emulators)
From `firebase/functions/`:

```bash
npm run serve:aio
```

That command:
- kills any stuck emulator processes (fixes “port taken” issues)
- downloads the latest Firestore export into `firebase/.databases/imports/firestore/` (keeps only one local copy)
- starts Firestore + Functions emulators and imports that data

> Local emulator DB data is stored under `firebase/.databases/` and ignored by git.


## Deployment
### Frontend hosting (Cloudflare Pages)
```bash
cd frontend
npm run build

cd ../cloudflare/worker
npx wrangler pages deploy ../../frontend/dist --project-name bcpletcher-com-staging --branch codex/firebase-to-cloudflare-migration
```

### API hosting (Cloudflare Worker)
```bash
cd cloudflare/worker
npx wrangler deploy
```

Recommended production setup:
- Connect repo to Cloudflare Pages (Git integration) so merges to `main` auto-deploy from Cloudflare.
- Keep Worker routes for `bcpletcher.com/api/*`, `www.bcpletcher.com/api/*`, and `next.bcpletcher.com/api/*`.

## Release hardening and cutover checklist

Complete this checklist in order. Values for secrets are entered through Cloudflare and are never committed or printed in logs.

### 1. Preflight and Cloudflare access

- Confirm the release candidate is the reviewed commit and that `git status --short` contains no generated state, secrets, or private data.
- Authenticate Wrangler interactively and verify the account before any deploy:

  ```bash
  npx wrangler login
  npx wrangler whoami
  ```

- In the Worker environment, configure these names only: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `MEDIA_BASE_URL`, and `ALLOWED_ORIGIN`. Use the exact production origins above; use a separate non-production value that also includes `http://localhost:5173` for local QA.
- Confirm the Wrangler configuration still binds D1 database `bcpletcher-db` as `DB` and R2 bucket `bcpletcher-artwork` as `ARTWORK`.

### 2. Local validation and data/media verification

- Run the dependency-free Worker checks:

  ```bash
  cd cloudflare/worker
  npm test
  npx wrangler deploy --dry-run --config wrangler.toml
  ```

- Verify D1 counts without changing data:

  ```bash
  npx wrangler d1 execute bcpletcher-db --remote --command "SELECT COUNT(*) AS project_count FROM projects;"
  npx wrangler d1 execute bcpletcher-db --remote --command "SELECT COUNT(*) AS image_count FROM project_images;"
  ```

- Verify the `bcpletcher-artwork` bucket exists and contains the expected `Projects/` objects in the Cloudflare R2 dashboard, then fetch one known canonical object without writing it:

  ```bash
  npx wrangler r2 bucket list
  npx wrangler r2 object get bcpletcher-artwork/Projects/<known-project>/<known-image>.webp --file=/tmp/bcpletcher-r2-check.webp
  ```

  Remove the temporary `/tmp` file after inspection; do not delete the R2 object.

### 3. Pages and Worker production configuration

- In Cloudflare Pages, set the production branch to `main`, the project root to `frontend`, the build command to `npm ci && npm run build`, and the output directory to `dist`.
- Build the production frontend with the reviewed environment values and confirm `frontend/dist` contains no unintended Firebase SDK/import/URL references:

  ```bash
  cd frontend
  npm ci
  npm run lint
  npm run build
  ```

- Deploy the Worker only after the Pages preview and local checks pass. Confirm these routes are present and point to the Worker: `/api/projects`, `/api/admin/login`, `/api/admin/session`, `/api/admin/projects/upsert`, `/api/admin/images/upload`, `/api/admin/images/delete`, and `/api/media/*`.

### 4. Admin protection and reversible fixture test

- Before production traffic, create the Cloudflare rate-limit rule in the next section and verify it in a staging/preview hostname.
- Use a pre-existing hidden staging project as the fixture. Save its exact JSON, add a temporary marker through the admin UI/API, verify it through `GET /api/projects`, then restore the saved JSON immediately. Do not create a new project unless an approved delete/restore path exists.
- Exercise login with a temporary staging fixture account. Capture the returned token only in a shell variable; verify `/api/admin/session` returns the expected user, and verify invalid credentials return `401` without returning a token or secret. Rotate or remove the temporary staging secret values after the test.
- Do not run fixture writes against production D1 until the rollback owner has confirmed the saved payload and restoration path.

### 5. DNS cutover and live verification

- Record the current `www`/apex DNS targets and the last known-good Firebase/Pages deployment before changing anything.
- Confirm the Pages custom domains and the Worker routes are ready. Then change only the approved DNS records to the Cloudflare Pages targets, keep them proxied as required, and leave the Worker `/api/*` routes enabled.
- Verify each production host and the CORS policy:

  ```bash
  curl -fsS https://www.bcpletcher.com/api/projects | jq '.result | length'
  curl -fsS https://bcpletcher.com/api/projects | jq '.result | length'
  curl -fsS https://next.bcpletcher.com/api/projects | jq '.result | length'
  curl -i -X OPTIONS https://next.bcpletcher.com/api/projects \
    -H 'Origin: https://www.bcpletcher.com' \
    -H 'Access-Control-Request-Method: GET'
  curl -i -X OPTIONS https://next.bcpletcher.com/api/projects \
    -H 'Origin: https://not-allowed.example' \
    -H 'Access-Control-Request-Method: GET'
  ```

  The allowed preflight must return `204` with the requesting allowed origin. The disallowed preflight must not return `Access-Control-Allow-Origin` and must be rejected. Check one known media URL for `200`, one missing key for `404`, `/api/admin/session` without a token for `401`, and the browser admin login/upload flow.

### 6. Rollback and Firebase hold

- If live verification fails, restore the recorded DNS targets or the previous Pages deployment, then disable/revert only the new Worker route/configuration as needed. Restore the previous frontend environment values and invalidate any temporary fixture session.
- Keep D1/R2 data intact during rollback. Do not delete or overwrite the known-good release artifacts until the incident is understood.
- Explicit hold: do not delete the Firebase project, Firestore data, Firebase Storage objects, Functions, Hosting configuration, rules, exports, or migration backups. Firebase remains the reversible rollback/archive source until a separately approved retirement decision.

### Admin login rate-limit configuration and verification

This Worker has no durable rate-limit binding, so brute-force protection must be configured at the Cloudflare zone edge. In the Cloudflare dashboard, open **Security rules → Create rule → Rate limiting rules** and create:

- Rule name: `bcpletcher-admin-login-bruteforce`
- Expression: `http.request.uri.path eq "/api/admin/login"`
- Counting characteristic: `IP`
- Threshold: `5` requests in `1 minute`
- Action: `Block`
- Mitigation duration: `600` seconds (`10 minutes`)
- Disable applying the rule to cached assets; the login endpoint must reach the Worker.

Verify the rule on the staging/preview hostname from a test IP with six invalid POSTs. The first five should be Worker `401` responses; the next request should be blocked by Cloudflare (normally `429` or the custom block response). Remove the staging test lockout or wait the 10-minute mitigation period, then repeat one valid login to confirm the rule does not weaken or bypass authentication. Record the Cloudflare rule ID and verification timestamp in the release record. The rule must be enabled before DNS cutover and remain enabled after release.

## Firebase -> Cloudflare migration (D1 + R2)
Use this when moving project data/images from Firestore + Firebase Storage to Cloudflare D1 + R2.

Script location:
- `firebase/functions/scripts/migrate-firebase-to-cloudflare.mjs`

D1 schema file:
- `firebase/functions/scripts/cloudflare-d1-schema.sql`

### Source modes
`migrate-firebase-to-cloudflare.mjs` supports three source modes:
- `SOURCE_MODE=firestore` (default): reads Firestore via Firebase Admin SDK.
- `SOURCE_MODE=callable`: reads from public callable endpoint (`getProjectsCollection`).
- `SOURCE_MODE=json`: reads from a local JSON snapshot file.

For locked Google-account scenarios, use `SOURCE_MODE=callable` or `SOURCE_MODE=json`.

### Required environment variables
| Variable | Required | Description |
|---|---:|---|
| `FIREBASE_STORAGE_BUCKET` | no* | Firebase Storage bucket name (defaults to `pletcher-portfolio-app.firebasestorage.app`) |
| `CLOUDFLARE_R2_BUCKET` | if uploading | R2 bucket name |
| `CLOUDFLARE_D1_DATABASE` | if applying | D1 database name for `wrangler d1 execute --remote` (example: `bcpletcher-db`) |

\* required if your bucket is not the default.

### Optional environment variables
| Variable | Default | Description |
|---|---|---|
| `FIREBASE_PROJECT_ID` | `pletcher-portfolio-app` | Firebase project ID |
| `FIRESTORE_COLLECTION` | `projects` | Firestore collection to migrate |
| `SOURCE_MODE` | `firestore` | `firestore`, `callable`, or `json` |
| `DOWNLOAD_MODE` | `firebase-admin` | `firebase-admin` or `http` |
| `CALLABLE_URL` | derived from project | Callable endpoint URL |
| `INPUT_JSON` | (empty) | Required when `SOURCE_MODE=json` |
| `MAX_PROJECTS` | `0` | Limit migrated projects for smoke tests |
| `FIREBASE_STORAGE_PUBLIC_BASE` | `https://firebasestorage.googleapis.com` | Base URL for public HTTP image downloads |
| `R2_PREFIX` | (empty) | Prefix prepended to uploaded R2 object keys |
| `R2_PUBLIC_BASE_URL` | (empty) | If set, rewrites image `url` in migrated JSON |
| `INCLUDE_HIDDEN` | `1` | Set to `0` to skip hidden projects |
| `UPLOAD_R2` | `0` | Set `1` to upload downloaded files to R2 |
| `APPLY_D1` | `0` | Set `1` to execute generated SQL against D1 |
| `OUT_DIR` | auto timestamp path | Override output path |

### Recommended run order
From `firebase/functions/`:

1) Snapshot production data from callable (no Firebase auth required):
```bash
npm run cloudflare:snapshot:callable
```

2) Dry run using callable source + public HTTP image download (no remote writes):
```bash
SOURCE_MODE=callable \
DOWNLOAD_MODE=http \
FIREBASE_STORAGE_BUCKET="<your-firebase-bucket>" \
CLOUDFLARE_R2_BUCKET="<your-r2-bucket>" \
CLOUDFLARE_D1_DATABASE="<your-d1-db>" \
npm run cloudflare:migrate:prepare
```

3) Apply to Cloudflare from callable source:
```bash
SOURCE_MODE=callable \
DOWNLOAD_MODE=http \
FIREBASE_STORAGE_BUCKET="<your-firebase-bucket>" \
CLOUDFLARE_R2_BUCKET="<your-r2-bucket>" \
CLOUDFLARE_D1_DATABASE="<your-d1-db>" \
npm run cloudflare:migrate:apply
```

4) Optional: apply from a frozen local snapshot:
```bash
SOURCE_MODE=json \
INPUT_JSON="<absolute-path-to-projects-from-callable.json>" \
DOWNLOAD_MODE=http \
FIREBASE_STORAGE_BUCKET="<your-firebase-bucket>" \
CLOUDFLARE_R2_BUCKET="<your-r2-bucket>" \
CLOUDFLARE_D1_DATABASE="<your-d1-db>" \
npm run cloudflare:migrate:apply
```

Outputs are written to `.backups/cloudflare-migration/<timestamp>/`:
- `migration-manifest.json`
- `d1-seed.sql`
- downloaded images under `images/`

Admin image behavior after cutover:
- Uploads originate from admin UI directly to Cloudflare API (`/api/admin/images/upload`).
- API stores canonical image + resized variants (`480/960`) in R2.
- Cards/first paint use resized variants; modal view prefers original full-size image path.

### Zero-downtime rollout notes
- Deploy Worker API first (`/api/projects`, `/api/admin/*`).
- Set `VITE_API_BASE_URL` and `VITE_MEDIA_BASE_URL` in frontend env.
- During route cutover, set `VITE_API_BASE_URL_FALLBACK=https://bcpletcher-api.bcpletcher.workers.dev`.
- Keep `VITE_CLOUDFLARE_PROJECTS_API_URL` empty unless you intentionally want static JSON override.

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

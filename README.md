# bcpletcher.com

<p>
  <img src="frontend/src/assets/images/logo.svg" alt="bcpletcher.com logo" width="96" height="96" />
</p>

### Status
[![Deploy to Firebase Hosting (prod)](https://github.com/bcpletcher/bcpletcher.com/actions/workflows/firebase-hosting-prod.yml/badge.svg)](https://github.com/bcpletcher/bcpletcher.com/actions/workflows/firebase-hosting-prod.yml)
[![CI](https://github.com/bcpletcher/bcpletcher.com/actions/workflows/ci.yml/badge.svg)](https://github.com/bcpletcher/bcpletcher.com/actions/workflows/ci.yml)
[![Live Site](https://img.shields.io/badge/live-www.bcpletcher.com-0ea5e9?logo=firebase&logoColor=white)](https://www.bcpletcher.com)
[![Last Commit](https://img.shields.io/github/last-commit/bcpletcher/bcpletcher.com)](https://github.com/bcpletcher/bcpletcher.com/commits/main)

### Tech stack
![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-f7d336?logo=pinia&logoColor=111827)
![Vue Router](https://img.shields.io/badge/Vue_Router-5-42b883?logo=vue.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Cloud Functions](https://img.shields.io/badge/Firebase_Functions-Node_22-FFCA28?logo=firebase&logoColor=black)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=0b0b0b)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?logo=prettier&logoColor=111827)

Personal portfolio site powered by Vue 3 + Vite and backed by Firebase (Firestore/Storage + Cloud Functions).

## Repository structure
- `frontend/`: Frontend application (Vite)
- `firebase/functions/`: Firebase Cloud Functions
- `firebase.json`: Firebase Hosting + Functions configuration

## Prerequisites
- **Node.js 22** (standardized via `.nvmrc`)
- **npm**
- **Firebase CLI** (`firebase-tools`) for deploy/emulators

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

cd ../firebase/functions
npm install
```

### 2) Run the frontend
```bash
cd frontend
npm run serve
```

### 3) (Optional) Run Firebase emulators
```bash
cd firebase/functions
npm run serve
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

Then fill in the Firebase values.

> `frontend/.env.example` is tracked. Any `.env*.local` file is ignored by git.

### Required Firebase/Vite values
| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID |

### Feature flags
| Variable | Type | Default | Notes |
|---|---:|---:|---|
| `VITE_USE_EMULATOR` | boolean | `false` | Connects Firebase SDK to local emulators when `true`. |
| `VITE_CACHE_ENABLED` | boolean | `true` | Enables client caching (IndexedDB via `idb`). |
| `VITE_CACHE_TTL_MINUTES` | number | `60` | Cache freshness window before refetch. |
| `VITE_SIMULATE_BOOT_ERROR` | boolean | `false` | Forces the boot overlay into error mode (dev only). |

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
```

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
Firebase Hosting is configured to serve `frontend/dist`.

Typical flow:
```bash
cd frontend
npm run build

cd ..
firebase deploy
```

## Performance notes
### `/resume`
The `/resume` route is optimized for fast direct loads:
- Does **not** wait for projects APIs
- Does **not** show the fullscreen boot loader
- Skips loading the Font Awesome kit on `/resume` (loaded dynamically on other routes)

## Troubleshooting
### Boot loader shows maintenance message
- Confirm Firestore/Functions are reachable (or emulators are running if `VITE_USE_EMULATOR=true`).
- Ensure `VITE_SIMULATE_BOOT_ERROR=false`.

### Caching issues / stale data
- Set `VITE_CACHE_ENABLED=false` to disable caching.
- Use the Admin dropdown: **Clear Cache** to clear IndexedDB cache.

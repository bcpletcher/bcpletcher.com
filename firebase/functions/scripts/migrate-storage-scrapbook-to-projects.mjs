#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * Migrates Firebase Storage objects from Scrapbook/ -> Projects/ (archival-safe).
 *
 * - Copies objects; does NOT delete the originals (Scrapbook remains as archive).
 * - Optionally updates Firestore documents (scrapbook collection) to point to the new URLs.
 * - Designed for one-off execution from your local machine.
 *
 * Requirements:
 * - gcloud auth / ADC available (or service account):
 *     gcloud auth application-default login
 * - Set env:
 *     GOOGLE_CLOUD_PROJECT=pletcher-portfolio-app
 *     STORAGE_BUCKET=pletcher-portfolio-app.firebasestorage.app   (or your bucket)
 *
 * Usage:
 *   node migrate-storage-scrapbook-to-projects.mjs --dry-run
 *   node migrate-storage-scrapbook-to-projects.mjs --apply
 *
 * Options:
 *   --copy-all-storage   Also copy every object under Scrapbook/** to Projects/** (recommended).
 */

import process from "node:process";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";

const argvList = process.argv.slice(2);
const argv = new Set(argvList);

if (argv.has("--help") || argv.has("-h")) {
  console.log(`
Usage:
  node scripts/migrate-storage-scrapbook-to-projects.mjs --dry-run
  node scripts/migrate-storage-scrapbook-to-projects.mjs --apply

Environment:
  GOOGLE_CLOUD_PROJECT=<gcp-project-id>
  STORAGE_BUCKET=<bucket-name>

Options:
  --copy-all-storage   Copy every object under Scrapbook/** to Projects/**
  --dry-run            No writes (default)
  --apply              Perform copies + Firestore updates
`);
  process.exit(0);
}

const DRY_RUN = argv.has("--dry-run") || !argv.has("--apply");
const APPLY = argv.has("--apply");
const COPY_ALL_STORAGE = argv.has("--copy-all-storage");

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.PROJECT_ID;

const BUCKET_NAME =
  process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;

if (!PROJECT_ID) {
  console.error(
    "Missing env GOOGLE_CLOUD_PROJECT (e.g. pletcher-portfolio-app)"
  );
  process.exit(1);
}

if (!BUCKET_NAME) {
  console.error(
    "Missing env STORAGE_BUCKET (e.g. pletcher-portfolio-app.firebasestorage.app)"
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
    storageBucket: BUCKET_NAME,
  });
}

const firestore = getFirestore();
const storage = getStorage();
const bucket = storage.bucket(BUCKET_NAME);

function parseStoragePathFromDownloadUrl(url) {
  if (!url || typeof url !== "string") return null;

  // Handles:
  // 1) https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media
  // 2) https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
  const marker = "/o/";
  const i = url.indexOf(marker);
  if (i !== -1) {
    const after = url.slice(i + marker.length);
    const encodedPath = after.split("?")[0];
    if (!encodedPath) return null;
    try {
      return decodeURIComponent(encodedPath);
    } catch {
      return encodedPath;
    }
  }

  // Some code paths might store gs://bucket/path URLs.
  if (url.startsWith("gs://")) {
    const withoutScheme = url.slice("gs://".length);
    const slash = withoutScheme.indexOf("/");
    if (slash === -1) return null;
    return withoutScheme.slice(slash + 1);
  }

  return null;
}

function toProjectsPath(scrapbookPath) {
  if (!scrapbookPath?.startsWith("Scrapbook/")) return null;
  return `Projects/${scrapbookPath.slice("Scrapbook/".length)}`;
}

function buildAltMediaUrl(bucketName, storagePath) {
  // This relies on public reads; if you keep tokenized URLs instead, skip this.
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath
  )}?alt=media`;
}

async function copyObject(srcPath, destPath) {
  const src = bucket.file(srcPath);
  const dest = bucket.file(destPath);

  const [exists] = await src.exists();
  if (!exists) return { ok: false, reason: "source_missing" };

  const [destExists] = await dest.exists();
  if (destExists) return { ok: true, copied: false, skipped: "dest_exists" };

  if (DRY_RUN) return { ok: true, copied: false, skipped: "dry_run" };

  await src.copy(dest);
  return { ok: true, copied: true };
}

async function copyAllStorageUnderScrapbook() {
  // Copy every object under Scrapbook/** to Projects/**.
  // This is the most reliable way to ensure resized variants exist.
  let pageToken = undefined;
  let copied = 0;
  let considered = 0;

  do {
    const [files, , resp] = await bucket.getFiles({
      prefix: "Scrapbook/",
      autoPaginate: false,
      pageToken,
    });

    for (const f of files) {
      considered += 1;
      const srcPath = f.name;
      const destPath = toProjectsPath(srcPath);
      if (!destPath) continue;

      const res = await copyObject(srcPath, destPath);
      if (res.ok && res.copied) copied += 1;
    }

    pageToken = resp?.nextPageToken;
  } while (pageToken);

  return { considered, copied };
}

async function migrate() {
  if (COPY_ALL_STORAGE) {
    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}Copying all storage objects under Scrapbook/** -> Projects/** ...`
    );
    const { considered, copied } = await copyAllStorageUnderScrapbook();
    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}Storage scan complete: considered=${considered} copied=${copied}`
    );
  }

  // Fetch scrapbook projects
  const snap = await firestore.collection("scrapbook").get();
  console.log(`Found ${snap.size} scrapbook docs`);

  let updatedDocs = 0;
  let copiedFiles = 0;

  // Avoid copying the same srcPath repeatedly across docs/fields.
  const copiedPathCache = new Set();

  for (const doc of snap.docs) {
    const data = doc.data() || {};

    const allUrls = [];
    if (typeof data.hero === "string" && data.hero) allUrls.push(data.hero);
    if (Array.isArray(data.images)) {
      data.images.forEach((u) => typeof u === "string" && u && allUrls.push(u));
    }

    // Build mapping: oldUrl -> newUrl
    const urlMap = new Map();

    for (const url of allUrls) {
      const srcPath = parseStoragePathFromDownloadUrl(url);
      if (!srcPath || !srcPath.startsWith("Scrapbook/")) continue;

      const destPath = toProjectsPath(srcPath);
      if (!destPath) continue;

      if (!copiedPathCache.has(srcPath)) {
        // Copy storage object
        const res = await copyObject(srcPath, destPath);
        if (res.ok && res.copied) copiedFiles += 1;
        copiedPathCache.add(srcPath);
      }

      // Update URL to new location
      const newUrl = buildAltMediaUrl(BUCKET_NAME, destPath);
      urlMap.set(url, newUrl);
    }

    if (!urlMap.size) continue;

    // Apply replacements in doc
    const next = { ...data };

    if (typeof next.hero === "string" && urlMap.has(next.hero)) {
      next.hero = urlMap.get(next.hero);
    }

    if (Array.isArray(next.images)) {
      next.images = next.images.map((u) => (urlMap.has(u) ? urlMap.get(u) : u));
    }

    // New schema direction: hero is implicitly the first image.
    // Keep legacy `hero` updated to avoid confusion in admin tooling / older data.

    if (DRY_RUN) {
      console.log(`[dry-run] Would update doc ${doc.id}`, {
        changed: urlMap.size,
      });
      continue;
    }

    if (APPLY) {
      await doc.ref.set(next, { merge: true });
      updatedDocs += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        copiedFiles,
        updatedDocs,
      },
      null,
      2
    )
  );
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});

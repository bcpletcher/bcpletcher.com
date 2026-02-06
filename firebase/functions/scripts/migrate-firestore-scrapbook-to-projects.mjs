#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * One-time Firestore migration: copy `scrapbook` -> `projects` (keeps scrapbook as archive)
 *
 * - Does NOT delete anything.
 * - Writes projects docs using the same doc IDs.
 * - Normalizes images into canonical shape:
 *     images: Array<{ path: string, url?: string }>
 *   where `path` points at `Projects/<docId>/<file>`.
 * - `hero` is not stored; the UI should treat `images[0]` as the implicit hero.
 *
 * Requirements:
 *   gcloud auth application-default login
 *   GOOGLE_CLOUD_PROJECT=pletcher-portfolio-app
 *
 * Optional env:
 *   STORAGE_BUCKET=pletcher-portfolio-app.firebasestorage.app
 *
 * Usage:
 *   node scripts/migrate-firestore-scrapbook-to-projects.mjs --dry-run
 *   node scripts/migrate-firestore-scrapbook-to-projects.mjs --apply
 *   node scripts/migrate-firestore-scrapbook-to-projects.mjs --apply --force
 */

import process from "node:process";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const argvList = process.argv.slice(2);
const argv = new Set(argvList);

if (argv.has("--help") || argv.has("-h")) {
  console.log(`\nUsage:\n  node scripts/migrate-firestore-scrapbook-to-projects.mjs --dry-run\n  node scripts/migrate-firestore-scrapbook-to-projects.mjs --apply\n  node scripts/migrate-firestore-scrapbook-to-projects.mjs --apply --force\n`);
  process.exit(0);
}

const DRY_RUN = argv.has("--dry-run") || !argv.has("--apply");
const FORCE = argv.has("--force");

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.PROJECT_ID;

const BUCKET =
  process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "";

if (!PROJECT_ID) {
  console.error("Missing env GOOGLE_CLOUD_PROJECT");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const firestore = getFirestore();

function parseStoragePathFromDownloadUrl(url) {
  if (!url || typeof url !== "string") return null;

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

  if (url.startsWith("gs://")) {
    const withoutScheme = url.slice("gs://".length);
    const slash = withoutScheme.indexOf("/");
    if (slash === -1) return null;
    return withoutScheme.slice(slash + 1);
  }

  return null;
}

function toProjectsPathFromAny(pathOrUrlPath, docId) {
  if (!pathOrUrlPath || typeof pathOrUrlPath !== "string") return null;

  if (pathOrUrlPath.startsWith("Projects/")) return pathOrUrlPath;

  if (pathOrUrlPath.startsWith("Scrapbook/")) {
    // Best effort: change top-level folder only (keeps subfolders/filenames)
    return `Projects/${pathOrUrlPath.slice("Scrapbook/".length)}`;
  }

  // If it was just a filename, put it in doc folder.
  if (!pathOrUrlPath.includes("/")) {
    return `Projects/${docId}/${pathOrUrlPath}`;
  }

  // Fallback: keep as-is (but this likely won't work for your FE).
  return pathOrUrlPath;
}

function buildAltMediaUrl(bucket, storagePath) {
  if (!bucket || !storagePath) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    storagePath
  )}?alt=media`;
}

function normalizeImagesFromScrapbookDoc(docId, data) {
  const raw = [];

  if (Array.isArray(data.images)) raw.push(...data.images);
  if (typeof data.hero === "string" && data.hero) raw.unshift(data.hero);

  // De-dupe while preserving order
  const seen = new Set();
  const deduped = raw.filter((x) => {
    const key = typeof x === "string" ? x : JSON.stringify(x);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const out = [];

  for (const item of deduped) {
    if (!item) continue;

    // Already object w/ path
    if (typeof item === "object" && typeof item.path === "string") {
      const nextPath = toProjectsPathFromAny(item.path, docId);
      if (!nextPath) continue;
      out.push({
        path: nextPath,
        ...(BUCKET ? { url: buildAltMediaUrl(BUCKET, nextPath) } : {}),
      });
      continue;
    }

    // String URL or string path
    if (typeof item === "string") {
      const parsedPath = parseStoragePathFromDownloadUrl(item) || item;
      const nextPath = toProjectsPathFromAny(parsedPath, docId);
      if (!nextPath) continue;

      out.push({
        path: nextPath,
        ...(BUCKET ? { url: buildAltMediaUrl(BUCKET, nextPath) } : {}),
      });
    }
  }

  return out;
}

async function run() {
  console.log(
    `[migrate-firestore-scrapbook-to-projects] project=${PROJECT_ID} bucket=${BUCKET || "(none)"} mode=${DRY_RUN ? "dry-run" : "apply"} force=${FORCE}`
  );

  const snap = await firestore.collection("scrapbook").get();
  console.log(`Found ${snap.size} scrapbook docs`);

  let scanned = 0;
  let wouldWrite = 0;
  let written = 0;
  let skippedExisting = 0;

  for (const doc of snap.docs) {
    scanned += 1;

    const data = doc.data() || {};
    const targetRef = firestore.collection("projects").doc(doc.id);

    const existing = await targetRef.get();
    if (existing.exists && !FORCE) {
      skippedExisting += 1;
      continue;
    }

    const images = normalizeImagesFromScrapbookDoc(doc.id, data);

    const next = {
      ...data,
      // Canonical fields
      images,
      // Note: `hero` is no longer stored; the UI should treat images[0] as the hero image.
    };

    wouldWrite += 1;

    if (DRY_RUN) {
      console.log(`[dry-run] Would write projects/${doc.id}`, {
        images: images.length,
      });
      continue;
    }

    await targetRef.set(next, { merge: true });
    written += 1;
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        scanned,
        wouldWrite,
        written,
        skippedExisting,
      },
      null,
      2
    )
  );
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

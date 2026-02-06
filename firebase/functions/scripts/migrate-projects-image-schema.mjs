#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * One-time Firestore migration: projects images from string[] -> [{path,url}]
 *
 * - Does NOT delete any Storage objects.
 * - Reads from Firestore collection: `projects`
 * - Writes back to the same doc: `images` array of objects.
 *
 * Canonical result:
 * - `images` becomes: [{ path: "Projects/<id>/<file>", url: "https://...alt=media" }]
 * - `hero` is NOT needed; if present it will be set to images[0] (same object)
 *
 * Requirements:
 *   gcloud auth application-default login
 *   GOOGLE_CLOUD_PROJECT=pletcher-portfolio-app
 *
 * Optional env:
 *   STORAGE_BUCKET=pletcher-portfolio-app.firebasestorage.app
 *
 * Usage:
 *   node scripts/migrate-projects-image-schema.mjs --dry-run
 *   node scripts/migrate-projects-image-schema.mjs --apply
 *   node scripts/migrate-projects-image-schema.mjs --dry-run --limit=5
 */

import process from "node:process";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const argvList = process.argv.slice(2);
const argv = new Set(argvList);

function getArgValue(prefix) {
  const hit = argvList.find((a) => a.startsWith(prefix));
  if (!hit) return null;
  const [, v] = hit.split("=");
  return v ?? null;
}

if (argv.has("--help") || argv.has("-h")) {
  console.log(`\nUsage:\n  node scripts/migrate-projects-image-schema.mjs --dry-run\n  node scripts/migrate-projects-image-schema.mjs --apply\n  node scripts/migrate-projects-image-schema.mjs --dry-run --limit=5\n`);
  process.exit(0);
}

const DRY_RUN = argv.has("--dry-run") || !argv.has("--apply");
const LIMIT = Number(getArgValue("--limit")) || null;

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
  if (i === -1) return null;

  const after = url.slice(i + marker.length);
  const encodedPath = after.split("?")[0];
  if (!encodedPath) return null;

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}

function buildAltMediaUrl(bucket, storagePath) {
  if (!bucket || !storagePath) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    storagePath
  )}?alt=media`;
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];

  // If it's already objects (canonical), just return as-is.
  if (
    images.every(
      (x) => x && typeof x === "object" && typeof x.path === "string"
    )
  ) {
    return images;
  }

  // If it contains strings, convert.
  return images
    .map((x) => {
      if (x && typeof x === "object" && typeof x.path === "string") return x;
      if (typeof x !== "string") return null;

      const path = parseStoragePathFromDownloadUrl(x);
      if (!path) return null;

      const url = BUCKET ? buildAltMediaUrl(BUCKET, path) : x;
      return { path, url };
    })
    .filter(Boolean);
}

function isCanonicalImages(images) {
  return (
    Array.isArray(images) &&
    images.length > 0 &&
    images.every((x) => x && typeof x === "object" && typeof x.path === "string")
  );
}

async function run() {
  console.log(
    `[migrate-projects-image-schema] project=${PROJECT_ID} bucket=${BUCKET || "(none)"} mode=${DRY_RUN ? "dry-run" : "apply"}${LIMIT ? ` limit=${LIMIT}` : ""}`
  );

  const query = LIMIT
    ? firestore.collection("projects").limit(LIMIT)
    : firestore.collection("projects");

  const snap = await query.get();
  console.log(`Found ${snap.size} project docs`);

  let scanned = 0;
  let wouldUpdate = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    scanned += 1;
    const data = doc.data() || {};

    const nextImages = normalizeImages(data.images);

    const alreadyCanonical =
      isCanonicalImages(data.images) &&
      isCanonicalImages(nextImages) &&
      data.images.length === nextImages.length &&
      data.images.every((x, i) => x.path === nextImages[i].path);

    if (alreadyCanonical) continue;

    wouldUpdate += 1;

    // Enforce: hero should just be images[0] if you keep the field.
    const nextHero = nextImages[0] || null;

    if (DRY_RUN) {
      console.log(`[dry-run] Would update ${doc.id}`, {
        beforeType: Array.isArray(data.images) ? typeof data.images[0] : null,
        afterType: nextImages[0] ? typeof nextImages[0] : null,
        images: nextImages.length,
        hero: Boolean(nextHero),
      });
      continue;
    }

    await doc.ref.set(
      {
        images: nextImages,
        // Keep hero only as an object pointing at first image (optional field, but consistent)
        ...(nextHero ? { hero: nextHero } : {}),
      },
      { merge: true }
    );

    updated += 1;
  }

  const summary = {
    dryRun: DRY_RUN,
    scanned,
    wouldUpdate,
    updated,
  };

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

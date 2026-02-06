#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * One-time Firestore migration for `projects` collection:
 * - Normalize date to canonical ISO date-only: YYYY-MM-DD
 *   - Accepts legacy MM/DD/YYYY
 * - Normalize images to canonical: Array<{ path: string }> (remove url)
 *
 * Does NOT delete any Storage objects.
 *
 * Requirements:
 *   gcloud auth application-default login
 *   GOOGLE_CLOUD_PROJECT=pletcher-portfolio-app
 *
 * Usage:
 *   node scripts/migrate-projects-date-and-images.mjs --dry-run
 *   node scripts/migrate-projects-date-and-images.mjs --apply
 */

import process from "node:process";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const argv = new Set(process.argv.slice(2));
const DRY_RUN = argv.has("--dry-run") || !argv.has("--apply");

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.PROJECT_ID;

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

const db = getFirestore();

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isValidYMD(y, m, d) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (y < 1900 || y > 2100) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function normalizeDate(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const iso = /^\d{4}-\d{2}-\d{2}$/.exec(raw);
  if (iso) {
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(5, 7));
    const d = Number(raw.slice(8, 10));
    return isValidYMD(y, m, d) ? raw : null;
  }

  const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (legacy) {
    const m = Number(legacy[1]);
    const d = Number(legacy[2]);
    const y = Number(legacy[3]);
    if (!isValidYMD(y, m, d)) return null;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  return null;
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return null;
  const out = [];
  for (const img of images) {
    if (!img) continue;
    if (typeof img === "object" && typeof img.path === "string" && img.path.trim()) {
      out.push({ path: img.path.trim() });
    }
  }
  return out;
}

async function run() {
  console.log(
    `[migrate-projects-date-and-images] project=${PROJECT_ID} mode=${DRY_RUN ? "dry-run" : "apply"}`
  );

  const snap = await db.collection("projects").get();
  console.log(`Found ${snap.size} projects docs`);

  let scanned = 0;
  let wouldUpdate = 0;
  let updated = 0;
  let invalidDates = 0;

  let batch = db.batch();
  let batchOps = 0;

  async function commit(force = false) {
    if (!batchOps) return;
    if (!force && batchOps < 450) return;
    if (!DRY_RUN) await batch.commit();
    batch = db.batch();
    batchOps = 0;
  }

  for (const doc of snap.docs) {
    scanned += 1;
    const data = doc.data() || {};

    const patch = {};
    let changed = false;

    // Date
    if (Object.prototype.hasOwnProperty.call(data, "date")) {
      const normalized = normalizeDate(data.date);
      if (data.date && !normalized) invalidDates += 1;
      if (normalized !== data.date) {
        patch.date = normalized; // may set to null
        changed = true;
      }
    }

    // Images: strip url and any extra keys
    if (Object.prototype.hasOwnProperty.call(data, "images")) {
      const normalizedImages = normalizeImages(data.images);
      if (normalizedImages) {
        // Compare only by path sequence
        const currentPaths = Array.isArray(data.images)
          ? data.images
              .filter((x) => x && typeof x === "object" && x.path)
              .map((x) => String(x.path))
          : [];
        const nextPaths = normalizedImages.map((x) => x.path);

        const same =
          currentPaths.length === nextPaths.length &&
          currentPaths.every((p, i) => p === nextPaths[i]);

        // If any image had url/extra props, this will still set to strip them.
        const hasExtras = Array.isArray(data.images)
          ? data.images.some((x) => x && typeof x === "object" && ("url" in x || Object.keys(x).some((k) => k !== "path")))
          : false;

        if (!same || hasExtras) {
          patch.images = normalizedImages;
          changed = true;
        }
      } else {
        // If it was something else, delete it (optional). We'll keep it and let the UI normalize on save.
      }
    }

    // If you want to remove image.url field even when images is missing, no-op.

    if (!changed) continue;

    wouldUpdate += 1;

    if (DRY_RUN) {
      console.log(`[dry-run] Would update projects/${doc.id}`, Object.keys(patch));
      continue;
    }

    batch.set(doc.ref, patch, { merge: true });
    batchOps += 1;
    updated += 1;

    await commit(false);
  }

  await commit(true);

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        scanned,
        wouldUpdate,
        updated,
        invalidDates,
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

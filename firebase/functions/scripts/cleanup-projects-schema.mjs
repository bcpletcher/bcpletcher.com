#!/usr/bin/env node
/* eslint-disable no-undef */
/**
 * One-time Firestore cleanup for `projects` docs.
 *
 * - Removes legacy/unused fields: hero, order, sourceCollection, sourceId, migratedAt
 * - Renames: deleted -> hidden (and removes deleted)
 * - Does not touch Storage.
 *
 * Requirements:
 *   gcloud auth application-default login
 *   GOOGLE_CLOUD_PROJECT=pletcher-portfolio-app
 *
 * Usage:
 *   node scripts/cleanup-projects-schema.mjs --dry-run
 *   node scripts/cleanup-projects-schema.mjs --apply
 */

import process from "node:process";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const argvList = process.argv.slice(2);
const argv = new Set(argvList);

if (argv.has("--help") || argv.has("-h")) {
  console.log(`\nUsage:\n  node scripts/cleanup-projects-schema.mjs --dry-run\n  node scripts/cleanup-projects-schema.mjs --apply\n`);
  process.exit(0);
}

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

const firestore = getFirestore();

async function run() {
  console.log(
    `[cleanup-projects-schema] project=${PROJECT_ID} mode=${DRY_RUN ? "dry-run" : "apply"}`
  );

  const snap = await firestore.collection("projects").get();
  console.log(`Found ${snap.size} projects docs`);

  let scanned = 0;
  let wouldUpdate = 0;
  let updated = 0;

  // Firestore batches are limited to 500 operations.
  let batch = firestore.batch();
  let batchOps = 0;

  async function commitBatchIfNeeded(force = false) {
    if (!batchOps) return;
    if (!force && batchOps < 450) return;
    if (DRY_RUN) {
      batch = firestore.batch();
      batchOps = 0;
      return;
    }
    await batch.commit();
    batch = firestore.batch();
    batchOps = 0;
  }

  for (const doc of snap.docs) {
    scanned += 1;
    const data = doc.data() || {};

    const patch = {};
    let changed = false;

    // Rename deleted -> hidden
    if (Object.prototype.hasOwnProperty.call(data, "deleted")) {
      patch.hidden = Boolean(data.deleted);
      patch.deleted = FieldValue.delete();
      changed = true;
    }

    // Rename year -> date (01/01/YEAR)
    if (Object.prototype.hasOwnProperty.call(data, "year")) {
      const yRaw = data.year;
      const y =
        typeof yRaw === "number"
          ? String(yRaw)
          : typeof yRaw === "string"
            ? yRaw.trim()
            : "";

      // Keep it simple and consistent: 01/01/<year> if year looks usable; otherwise just delete year.
      if (y) {
        patch.date = `01/01/${y}`;
      }
      patch.year = FieldValue.delete();
      changed = true;
    }

    // Remove unused fields
    for (const k of [
      "hero",
      "order",
      "sourceCollection",
      "sourceId",
      "migratedAt",
    ]) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        patch[k] = FieldValue.delete();
        changed = true;
      }
    }

    if (!changed) continue;

    wouldUpdate += 1;

    if (DRY_RUN) {
      console.log(`[dry-run] Would update projects/${doc.id}`, {
        keys: Object.keys(patch),
      });
      continue;
    }

    batch.set(doc.ref, patch, { merge: true });
    batchOps += 1;
    updated += 1;

    await commitBatchIfNeeded(false);
  }

  await commitBatchIfNeeded(true);

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        scanned,
        wouldUpdate,
        updated,
      },
      null,
      2
    )
  );
}

run().catch((e) => {
  console.error("Cleanup failed:", e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Remove legacy fields from projects collection after you’ve confirmed the migration:
 * - Deletes `eyebrow` and `title`
 *
 * Destructive (Firestore only):
 * - Does NOT touch Storage
 *
 * Usage:
 *   node firebase/functions/scripts/remove-legacy-project-fields.mjs --project <firebaseProjectId>
 *
 * Optional:
 *   --dry-run         Print what would change without writing
 *   --limit <n>       Process at most n docs
 */

import process from "node:process";

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function parseArgs(argv) {
  const args = {
    project: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "",
    dryRun: false,
    limit: 0,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project") args.project = argv[++i] || "";
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--limit") args.limit = Number(argv[++i] || 0);
  }

  return args;
}

const { project, dryRun, limit } = parseArgs(process.argv);

if (!project) {
  console.error("Missing --project <firebaseProjectId> (or set FIREBASE_PROJECT_ID)");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: project,
});

const db = getFirestore();

console.log(`[remove-legacy] Project: ${project}`);
console.log(`[remove-legacy] Dry run: ${dryRun}`);
console.log(`[remove-legacy] Limit: ${limit || "(none)"}`);

const snap = await db.collection("projects").get();
const docs = snap.docs;

let processed = 0;
let updated = 0;

const BATCH_LIMIT = 400;
let batch = db.batch();
let batchOps = 0;

async function commitBatch() {
  if (!batchOps) return;
  if (!dryRun) await batch.commit();
  batch = db.batch();
  batchOps = 0;
}

for (const doc of docs) {
  if (limit && processed >= limit) break;
  processed++;

  const data = doc.data() || {};

  const hasLegacy =
    Object.prototype.hasOwnProperty.call(data, "eyebrow") ||
    Object.prototype.hasOwnProperty.call(data, "title");

  if (!hasLegacy) continue;

  const next = {
    eyebrow: FieldValue.delete(),
    title: FieldValue.delete(),
  };

  // Optional updatedAt bump
  if (Object.prototype.hasOwnProperty.call(data, "updatedAt")) {
    next.updatedAt = FieldValue.serverTimestamp();
  }

  console.log(`[remove-legacy] ${doc.id}: delete eyebrow,title`);
  updated++;

  if (!dryRun) {
    batch.set(doc.ref, next, { merge: true });
    batchOps++;
    if (batchOps >= BATCH_LIMIT) {
      await commitBatch();
    }
  }
}

await commitBatch();

console.log(`\n[remove-legacy] Processed: ${processed}`);
console.log(`[remove-legacy] Updated:   ${updated}`);
console.log("[remove-legacy] Done.");


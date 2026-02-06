#!/usr/bin/env node
/**
 * Seed Firestore emulator imports from production.
 *
 * This repo keeps a single local import directory:
 *   firebase/.databases/imports/firestore/latest/
 *
 * Workflow:
 * 1) Export prod Firestore to GCS (we do this here via gcloud)
 * 2) Download export into the local import directory (overwrite)
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function sh(cmd, { stdio = "inherit" } = {}) {
  execSync(cmd, { stdio, env: process.env });
}

const projectId = process.env.FIREBASE_PROJECT_ID || "pletcher-portfolio-app";
const bucket = process.env.FIRESTORE_EXPORT_BUCKET || "pletcher-portfolio-app.firebasestorage.app";
const exportStamp = new Date().toISOString().replace(/[:.]/g, "").replace(/[-]/g, "").slice(0, 15);
const exportUri = `gs://${bucket}/firestore-exports/${projectId}/${exportStamp}`;

const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const importsRoot = join(repoFirebaseDir, ".databases", "imports", "firestore");
const destDir = join(importsRoot, "latest");

mkdirSync(importsRoot, { recursive: true });

// Always overwrite the single import directory.
if (existsSync(destDir)) {
  rmSync(destDir, { recursive: true, force: true });
}
mkdirSync(destDir, { recursive: true });

console.log(`\n[seed] Exporting prod Firestore...`);
console.log(`[seed] Project: ${projectId}`);
console.log(`[seed] Bucket: ${bucket}`);
console.log(`[seed] Export URI: ${exportUri}`);

// Export prod -> GCS (requires gcloud auth + permissions)
sh(`gcloud firestore export "${exportUri}" --project "${projectId}"`);

console.log(`\n[seed] Downloading export into: ${destDir}`);

// Prefer gcloud storage cp; fallback to gsutil.
try {
  sh(`gcloud storage cp -r "${exportUri}/*" "${destDir}/"`);
} catch {
  console.warn("[seed] gcloud storage cp failed; trying gsutil...\n");
  sh(`gsutil -m cp -r "${exportUri}/*" "${destDir}/"`);
}

console.log("\n[seed] Done. Import dir ready:\n");
console.log(`  ${destDir}\n`);

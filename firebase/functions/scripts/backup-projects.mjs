#!/usr/bin/env node
/**
 * Backup project images from Firebase Storage in the canonical (Firestore) order.
 *
 * Reads:
 *  - Firestore collection: projects
 *  - For each doc, uses `images` array order
 *
 * Downloads:
 *  - Only original images referenced by `images[].path`
 *  - By default, skips anything not starting with `Projects/<docId>/`
 *
 * Output filenames:
 *  <order>__<projectId>__<originalFileName>
 *    order is 001, 002, ... based on Firestore array order
 *
 * Output directory structure:
 *  <OUT_DIR>/<projectId>/<order>__<projectId>__<originalFileName>
 *  <OUT_DIR>/<projectId>/project.json
 *
 * Env:
 *  - FIREBASE_PROJECT_ID (default: pletcher-portfolio-app)
 *  - FIREBASE_STORAGE_BUCKET (required)
 *  - GOOGLE_APPLICATION_CREDENTIALS or application default credentials
 *
 * Options (env):
 *  - OUT_DIR (default: <repo-root>/.backups/<date-time>)
 *  - INCLUDE_HIDDEN (default: 1)   (downloads even hidden projects)
 *  - OVERWRITE (default: 0)        (skip existing files unless set to 1)
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectId = process.env.FIREBASE_PROJECT_ID || "pletcher-portfolio-app";
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
const includeHidden = (process.env.INCLUDE_HIDDEN ?? "1") !== "0";
const overwrite = (process.env.OVERWRITE ?? "0") === "1";

if (!bucketName) {
  console.error("Missing FIREBASE_STORAGE_BUCKET env var");
  process.exit(1);
}

// Default OUT_DIR: repo-root/.backups/<date-time>
const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const repoRoot = join(repoFirebaseDir, "..", "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "").replace(/[-]/g, "").slice(0, 15);
const defaultOut = join(repoRoot, ".backups", stamp);
const outDir = process.env.OUT_DIR || defaultOut;

initializeApp({ projectId, credential: applicationDefault() });
const db = getFirestore();
const bucket = getStorage().bucket(bucketName);

function sanitizeSegment(s) {
  return String(s || "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 160);
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function downloadObjectToFile(objectName, destPath) {
  await mkdir(join(destPath, ".."), { recursive: true });
  const file = bucket.file(objectName);

  if (!overwrite && (await exists(destPath))) {
    return { skipped: true, reason: "exists" };
  }

  // Stream download -> file
  const rs = file.createReadStream();
  const ws = createWriteStream(destPath);
  await pipeline(rs, ws);
  return { downloaded: true };
}

console.log("\n[backup-images]");
console.log(" Project:", projectId);
console.log(" Bucket:", bucketName);
console.log(" Out dir:", outDir);
console.log(" Include hidden:", includeHidden);
console.log(" Overwrite:", overwrite);

const snap = await db.collection("projects").get();
console.log(`\n[backup-images] Found ${snap.size} projects`);

let totalFiles = 0;
let skippedFiles = 0;
let missingPaths = 0;

for (const doc of snap.docs) {
  const entryId = doc.id;
  const data = doc.data() || {};

  if (!includeHidden && data.hidden) continue;

  const images = Array.isArray(data.images) ? data.images : [];
  if (!images.length) continue;

  const safeProjectId = sanitizeSegment(entryId);
  const projectOutDir = join(outDir, safeProjectId);
  await mkdir(projectOutDir, { recursive: true });

  // Build up metadata as we go (ordered).
  const manifest = {
    id: entryId,
    firestore: data,
    images: [],
    generatedAt: new Date().toISOString(),
    bucket: bucketName,
  };

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    const p = img && typeof img === "object" ? img.path : null;
    if (!p || typeof p !== "string") {
      missingPaths += 1;
      continue;
    }

    // Defensive: only download project originals under that project's folder
    const expectedPrefix = `Projects/${entryId}/`;
    if (!p.startsWith(expectedPrefix)) {
      // Still allow, but keep it separated under "_external"
      const order = String(i + 1).padStart(3, "0");
      const fileName = sanitizeSegment(p.split("/").pop() || `image-${order}`);
      const dest = join(projectOutDir, "_external", `${order}__${safeProjectId}__${fileName}`);
      try {
        const res = await downloadObjectToFile(p, dest);
        totalFiles += 1;
        if (res.skipped) skippedFiles += 1;

        manifest.images.push({
          order: i + 1,
          storagePath: p,
          localPath: join("_external", `${order}__${safeProjectId}__${fileName}`),
        });
      } catch (e) {
        console.warn("[backup-images] Failed to download", p, "->", dest, e?.message || e);
      }
      continue;
    }

    const order = String(i + 1).padStart(3, "0");
    const originalFileName = p.split("/").pop() || `image-${order}`;
    const destFileName = `${order}__${safeProjectId}__${sanitizeSegment(originalFileName)}`;
    const destPath = join(projectOutDir, destFileName);

    try {
      const res = await downloadObjectToFile(p, destPath);
      totalFiles += 1;
      if (res.skipped) skippedFiles += 1;

      manifest.images.push({
        order: i + 1,
        storagePath: p,
        localPath: destFileName,
      });
    } catch (e) {
      console.warn("[backup-images] Failed to download", p, "->", destPath, e?.message || e);
    }
  }

  // Write per-project manifest (always overwrite; it should reflect state even if images are skipped).
  try {
    await writeFile(
      join(projectOutDir, "project.json"),
      JSON.stringify(manifest, null, 2) + "\n",
      "utf8"
    );
  } catch (e) {
    console.warn("[backup-images] Failed to write project.json for", entryId, e?.message || e);
  }
}

console.log("\n[backup-images] Done.");
console.log(" Total images processed:", totalFiles);
console.log(" Skipped (already existed):", skippedFiles);
console.log(" Missing/invalid paths:", missingPaths);


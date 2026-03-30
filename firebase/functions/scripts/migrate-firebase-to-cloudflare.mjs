#!/usr/bin/env node
/**
 * Firestore/Callable + Firebase Storage -> Cloudflare D1 + R2 migration helper.
 *
 * What it does:
 * - Reads projects from one source:
 *   - Firestore admin API (default)
 *   - Public callable endpoint
 *   - Local JSON snapshot file
 * - Downloads each referenced `images[].path` object from Firebase Storage:
 *   - via Firebase Admin SDK
 *   - or via public HTTP Storage API URL
 * - Optionally uploads objects to R2 (same key by default).
 * - Generates:
 *   - migration-manifest.json
 *   - d1-seed.sql (schema + inserts)
 *
 * Safe defaults:
 * - APPLY_D1=0 (does not write to D1 unless enabled)
 * - UPLOAD_R2=0 (does not upload to R2 unless enabled)
 *
 * Required env:
 * - FIREBASE_STORAGE_BUCKET (defaults to pletcher-portfolio-app.firebasestorage.app)
 *
 * Optional env:
 * - FIREBASE_PROJECT_ID (default: pletcher-portfolio-app)
 * - FIRESTORE_COLLECTION (default: projects)
 * - SOURCE_MODE (default: firestore) [firestore|callable|json]
 * - DOWNLOAD_MODE (default: firebase-admin) [firebase-admin|http]
 * - CALLABLE_URL (default based on project + getProjectsCollection)
 * - INPUT_JSON (required when SOURCE_MODE=json)
 * - MAX_PROJECTS (optional integer for smoke tests)
 * - INCLUDE_HIDDEN (default: 1)
 * - OUT_DIR (default: <repo-root>/.backups/cloudflare-migration/<stamp>)
 * - FIREBASE_STORAGE_PUBLIC_BASE (default: https://firebasestorage.googleapis.com)
 * - R2_PREFIX (default: "")
 * - R2_PUBLIC_BASE_URL (used to rewrite image.url in exported JSON)
 * - CLOUDFLARE_R2_BUCKET (required when UPLOAD_R2=1)
 * - CLOUDFLARE_D1_DATABASE (required when APPLY_D1=1)
 * - UPLOAD_R2 (default: 0)
 * - APPLY_D1 (default: 0)
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectId = process.env.FIREBASE_PROJECT_ID || "pletcher-portfolio-app";
const firestoreCollection = process.env.FIRESTORE_COLLECTION || "projects";
const bucketName =
  process.env.FIREBASE_STORAGE_BUCKET || "pletcher-portfolio-app.firebasestorage.app";
const includeHidden = (process.env.INCLUDE_HIDDEN ?? "1") !== "0";
const sourceMode = process.env.SOURCE_MODE || "firestore";
const downloadMode = process.env.DOWNLOAD_MODE || "firebase-admin";
const callableUrl =
  process.env.CALLABLE_URL ||
  `https://us-central1-${projectId}.cloudfunctions.net/getProjectsCollection`;
const inputJson = process.env.INPUT_JSON || "";
const maxProjects = Number(process.env.MAX_PROJECTS || "0");
const firebaseStoragePublicBase =
  process.env.FIREBASE_STORAGE_PUBLIC_BASE || "https://firebasestorage.googleapis.com";

const uploadR2 = (process.env.UPLOAD_R2 ?? "0") === "1";
const applyD1 = (process.env.APPLY_D1 ?? "0") === "1";
const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET;
const d1Database = process.env.CLOUDFLARE_D1_DATABASE;
const r2Prefix = (process.env.R2_PREFIX || "").replace(/^\/+|\/+$/g, "");
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL || "";

const validSourceModes = new Set(["firestore", "callable", "json"]);
const validDownloadModes = new Set(["firebase-admin", "http"]);
if (!validSourceModes.has(sourceMode)) {
  console.error(`Invalid SOURCE_MODE: ${sourceMode}`);
  process.exit(1);
}
if (!validDownloadModes.has(downloadMode)) {
  console.error(`Invalid DOWNLOAD_MODE: ${downloadMode}`);
  process.exit(1);
}
if (sourceMode === "json" && !inputJson) {
  console.error("SOURCE_MODE=json requires INPUT_JSON");
  process.exit(1);
}
if (uploadR2 && !r2Bucket) {
  console.error("UPLOAD_R2=1 requires CLOUDFLARE_R2_BUCKET");
  process.exit(1);
}
if (applyD1 && !d1Database) {
  console.error("APPLY_D1=1 requires CLOUDFLARE_D1_DATABASE");
  process.exit(1);
}

const repoFirebaseDir = fileURLToPath(new URL("../..", import.meta.url));
const repoRoot = resolve(repoFirebaseDir, "..");
const stamp = new Date().toISOString().replace(/[:.]/g, "").replace(/[-]/g, "").slice(0, 15);
const outDir =
  process.env.OUT_DIR || join(repoRoot, ".backups", "cloudflare-migration", stamp);
const imageOutDir = join(outDir, "images");
const manifestPath = join(outDir, "migration-manifest.json");
const seedSqlPath = join(outDir, "d1-seed.sql");
const schemaPath = fileURLToPath(new URL("./cloudflare-d1-schema.sql", import.meta.url));

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function boolToInt(value) {
  return value ? 1 : 0;
}

function runOrThrow(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function normalizeR2Key(storagePath) {
  const cleanPath = String(storagePath || "").replace(/^\/+/, "");
  return r2Prefix ? `${r2Prefix}/${cleanPath}` : cleanPath;
}

function encodeStoragePathForUrl(path) {
  return encodeURIComponent(path);
}

function toFirebaseStorageMediaUrl(storagePath) {
  const base = firebaseStoragePublicBase.replace(/\/+$/, "");
  return `${base}/v0/b/${bucketName}/o/${encodeStoragePathForUrl(storagePath)}?alt=media`;
}

function toPublicUrl(r2Key) {
  if (!r2PublicBaseUrl) return null;
  const base = r2PublicBaseUrl.replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(r2Key).replace(/%2F/g, "/")}`;
}

async function ensureParentDir(path) {
  await mkdir(dirname(path), { recursive: true });
}

async function loadProjectsFromJsonFile(path) {
  const { readFile } = await import("node:fs/promises");
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed.map((row, i) => ({
      id: String(row?.id || `row-${i + 1}`),
      data: row?.data || row,
    }));
  }
  if (parsed && typeof parsed === "object") {
    if (parsed.result && typeof parsed.result === "object") {
      return Object.entries(parsed.result).map(([id, data]) => ({ id, data }));
    }
    if (parsed.projects && Array.isArray(parsed.projects)) {
      return parsed.projects.map((p, i) => ({
        id: String(p?.id || `project-${i + 1}`),
        data: p?.data || p,
      }));
    }
    return Object.entries(parsed).map(([id, data]) => ({ id, data }));
  }
  throw new Error("Unsupported INPUT_JSON format");
}

async function loadProjectsFromCallable() {
  const response = await fetch(callableUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      origin: "https://www.bcpletcher.com",
    },
    body: JSON.stringify({ data: {} }),
  });
  if (!response.ok) {
    throw new Error(`Callable request failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  const result = payload?.result;
  if (!result || typeof result !== "object") {
    throw new Error("Callable response missing result object");
  }
  return Object.entries(result).map(([id, data]) => ({ id, data }));
}

async function downloadImageToFile({ storagePath, localPath, storageBucket }) {
  if (downloadMode === "firebase-admin") {
    await storageBucket.file(storagePath).download({ destination: localPath });
    return;
  }

  const url = toFirebaseStorageMediaUrl(storagePath);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const { writeFile } = await import("node:fs/promises");
  await writeFile(localPath, bytes);
}

console.log("\n[cloudflare-migrate]");
console.log(" Firebase project:", projectId);
console.log(" Firestore collection:", firestoreCollection);
console.log(" Firebase bucket:", bucketName);
console.log(" Source mode:", sourceMode);
console.log(" Download mode:", downloadMode);
if (sourceMode === "callable") console.log(" Callable URL:", callableUrl);
if (sourceMode === "json") console.log(" Input JSON:", inputJson);
console.log(" Output dir:", outDir);
console.log(" Include hidden:", includeHidden);
if (maxProjects > 0) console.log(" Max projects:", maxProjects);
console.log(" Upload to R2:", uploadR2);
console.log(" Apply to D1:", applyD1);

await mkdir(outDir, { recursive: true });
await mkdir(imageOutDir, { recursive: true });

let bucket = null;
if (downloadMode === "firebase-admin" || sourceMode === "firestore") {
  initializeApp({ projectId, credential: applicationDefault() });
  bucket = getStorage().bucket(bucketName);
}

let projectRows = [];
if (sourceMode === "json") {
  projectRows = await loadProjectsFromJsonFile(inputJson);
} else if (sourceMode === "callable") {
  projectRows = await loadProjectsFromCallable();
} else {
  const db = getFirestore();
  try {
    const snap = await db.collection(firestoreCollection).get();
    projectRows = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() || {} }));
  } catch (error) {
    console.error("\nFailed to read Firestore collection.");
    console.error(
      "If you see invalid_grant, use SOURCE_MODE=callable or SOURCE_MODE=json until auth is restored."
    );
    throw error;
  }
}

if (maxProjects > 0) {
  projectRows = projectRows.slice(0, maxProjects);
}

console.log(`[cloudflare-migrate] Found ${projectRows.length} project docs`);

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceMode,
  downloadMode,
  callableUrl: sourceMode === "callable" ? callableUrl : null,
  inputJson: sourceMode === "json" ? inputJson : null,
  firestoreCollection,
  firebaseProjectId: projectId,
  firebaseStorageBucket: bucketName,
  cloudflareR2Bucket: r2Bucket || null,
  cloudflareD1Database: d1Database || null,
  r2Prefix,
  outDir,
  projects: [],
};

const sqlRowsProjects = [];
const sqlRowsProjectImages = [];
let totalImagesSeen = 0;
let totalImagesDownloaded = 0;
let totalImagesUploaded = 0;

for (const row of projectRows) {
  const data = row.data || {};
  if (!includeHidden && data.hidden) continue;

  const projectIdValue = row.id;
  const images = Array.isArray(data.images) ? data.images : [];
  const migratedImages = [];
  const migratedData = structuredClone(data);
  migratedData.images = [];

  for (let index = 0; index < images.length; index += 1) {
    totalImagesSeen += 1;
    const image = images[index];
    const storagePath = image && typeof image === "object" ? image.path : null;

    if (!storagePath || typeof storagePath !== "string") {
      migratedData.images.push(image);
      continue;
    }

    const r2Key = normalizeR2Key(storagePath);
    const localPath = join(imageOutDir, r2Key);
    await ensureParentDir(localPath);

    try {
      await downloadImageToFile({
        storagePath,
        localPath,
        storageBucket: bucket,
      });
      totalImagesDownloaded += 1;
    } catch (error) {
      console.warn(
        `[cloudflare-migrate] Failed download for ${storagePath}:`,
        error?.message || error
      );
      migratedData.images.push(image);
      continue;
    }

    if (uploadR2) {
      runOrThrow("npx", [
        "wrangler",
        "r2",
        "object",
        "put",
        `${r2Bucket}/${r2Key}`,
        "--remote",
        "--file",
        localPath,
      ]);
      totalImagesUploaded += 1;
    }

    const publicUrl = toPublicUrl(r2Key);
    const migratedImage = {
      ...(typeof image === "object" && image ? image : {}),
      path: r2Key,
      ...(publicUrl ? { url: publicUrl } : {}),
    };
    migratedImages.push({
      imageIndex: index,
      originalStoragePath: storagePath,
      r2Key,
      publicUrl,
      localPath,
    });
    migratedData.images.push(migratedImage);

    sqlRowsProjectImages.push({
      projectId: projectIdValue,
      imageIndex: index,
      storagePath,
      r2Key,
      publicUrl,
    });
  }

  sqlRowsProjects.push({
    id: projectIdValue,
    hidden: boolToInt(Boolean(migratedData.hidden)),
    imageCount: migratedImages.length,
    dataJson: JSON.stringify(migratedData),
    migratedAt: new Date().toISOString(),
  });

  manifest.projects.push({
    id: projectIdValue,
    hidden: Boolean(data.hidden),
    imageCount: migratedImages.length,
    migratedImages,
    data: migratedData,
  });
}

const sqlParts = [];
const { readFile } = await import("node:fs/promises");
const schemaSql = await readFile(schemaPath, "utf8");
sqlParts.push(schemaSql.trim());
sqlParts.push("DELETE FROM project_images;");
sqlParts.push("DELETE FROM projects;");

for (const row of sqlRowsProjects) {
  sqlParts.push(
    [
      "INSERT INTO projects (id, hidden, image_count, data_json, migrated_at)",
      `VALUES ('${sqlEscape(row.id)}', ${row.hidden}, ${row.imageCount}, '${sqlEscape(
        row.dataJson
      )}', '${sqlEscape(row.migratedAt)}');`,
    ].join(" ")
  );
}

for (const row of sqlRowsProjectImages) {
  const publicUrlSql = row.publicUrl
    ? `'${sqlEscape(row.publicUrl)}'`
    : "NULL";
  sqlParts.push(
    [
      "INSERT INTO project_images (project_id, image_index, storage_path, r2_key, public_url)",
      `VALUES ('${sqlEscape(row.projectId)}', ${row.imageIndex}, '${sqlEscape(
        row.storagePath
      )}', '${sqlEscape(row.r2Key)}', ${publicUrlSql});`,
    ].join(" ")
  );
}

const seedSql = sqlParts.join("\n") + "\n";
await writeFile(seedSqlPath, seedSql, "utf8");
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

if (applyD1) {
  runOrThrow("npx", [
    "wrangler",
    "d1",
    "execute",
    d1Database,
    "--remote",
    "--file",
    seedSqlPath,
  ]);
}

console.log("\n[cloudflare-migrate] Done.");
console.log(" Projects exported:", manifest.projects.length);
console.log(" Images found:", totalImagesSeen);
console.log(" Images downloaded:", totalImagesDownloaded);
console.log(" Images uploaded to R2:", totalImagesUploaded);
console.log(" Manifest:", manifestPath);
console.log(" D1 seed SQL:", seedSqlPath);
if (!uploadR2 || !applyD1) {
  console.log(
    " Note: this run is partial/dry unless both UPLOAD_R2=1 and APPLY_D1=1 are set."
  );
}

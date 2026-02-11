// Use only v2 entrypoints so firebase-functions v1 (and functions.config()) is never loaded.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs/promises");
const sharp = require("sharp");

setGlobalOptions({ region: "us-central1" });

// Standard Admin SDK init pattern (safe for hot reload / emulator).
if (!getApps().length) {
  initializeApp();
}

// Admin SDK will automatically connect to the Firestore emulator when
// FIRESTORE_EMULATOR_HOST is set (Firebase Emulator Suite sets this for the
// functions runtime).

const firestore = getFirestore();
const database = require("./functions/database");

const storage = getStorage();

function isProjectOriginalUpload(objectName) {
  // Convert only files under Projects/<entryId>/... but skip resized outputs.
  if (!objectName || typeof objectName !== "string") return false;
  if (!objectName.startsWith("Projects/")) return false;
  if (objectName.includes("/resized/")) return false;
  return true;
}

function callable(handler) {
  return onCall(
    {
      // Image processing can spike memory usage; 512MiB is a safer floor for sharp.
      // (Previously deployed default 256MiB was OOMing.)
      memory: "512MiB",
      timeoutSeconds: 120,
    },
    async (request) => {
      try {
        return await handler(request);
      } catch (err) {
        // Always surface predictable errors to clients.
        if (err instanceof HttpsError) throw err;

        console.error("Unhandled callable error:", err);
        throw new HttpsError(
          "internal",
          err && err.message ? err.message : "Internal error"
        );
      }
    }
  );
}

exports.getProjectsCollection = callable(({ data, auth }) => {
  const context = { auth };
  return database.getCollection(data, context, firestore, "projects");
});

exports.createProjectDocument = callable(({ data, auth }) => {
  const context = { auth };
  return database.createDocument(data, context, firestore, "projects");
});

exports.updateProjectDocument = callable(({ data, auth }) => {
  const context = { auth };
  return database.updateDocument(data, context, firestore, "projects");
});

// Callable: convert a just-uploaded project image to WebP and generate resized variants.
// Why callable instead of Storage trigger?
// - Your deploy is failing with: Eventarc SA missing storage.buckets.get on the bucket.
// - Callable avoids Eventarc entirely and runs with Admin SDK privileges.
//
// Input:
// { bucket?: string, path: string }
// - `path` must be under Projects/ and must not be inside /resized/
// - GIFs are skipped (returned as-is)
//
// Output:
// { ok: true, canonicalPath: string, skipped?: boolean, reason?: string }
exports.convertProjectImageToWebp = callable(async ({ data, auth }) => {
  if (!auth) throw new HttpsError("unauthenticated", "Auth required");
  const objectName = data?.path;
  const bucketName = data?.bucket || process.env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new HttpsError(
      "invalid-argument",
      "Missing bucket. Pass {bucket} or ensure FIREBASE_STORAGE_BUCKET is available."
    );
  }
  if (!objectName || typeof objectName !== "string") {
    throw new HttpsError("invalid-argument", "Missing image path");
  }
  if (!isProjectOriginalUpload(objectName)) {
    throw new HttpsError("invalid-argument", "Path must be under Projects/ and not /resized/");
  }

  const ext = (path.extname(objectName) || "").toLowerCase();
  if (ext === ".gif") {
    return { ok: true, canonicalPath: objectName, skipped: true, reason: "gif" };
  }
  if (ext === ".webp") {
    return { ok: true, canonicalPath: objectName, skipped: true, reason: "already-webp" };
  }

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectName);

  // Download to temp filesystem
  const tmpIn = path.join(os.tmpdir(), path.basename(objectName));
  const base = objectName.slice(0, -path.extname(objectName).length);
  const webpObjectName = `${base}.webp`;
  const tmpOut = path.join(os.tmpdir(), path.basename(webpObjectName));

  const webpFile = bucket.file(webpObjectName);
  const [webpExists] = await webpFile.exists();
  if (!webpExists) {
    await file.download({ destination: tmpIn });

    await sharp(tmpIn)
      .rotate()
      // Lossless WebP so we never reduce quality; resizing/optimization is handled by the extension.
      .webp({ lossless: true })
      .toFile(tmpOut);

    await bucket.upload(tmpOut, {
      destination: webpObjectName,
      metadata: {
        contentType: "image/webp",
        cacheControl: "public,max-age=31536000,immutable",
      },
    });
  }

  // Best-effort delete original
  try {
    await file.delete();
  } catch (e) {
    console.warn("Failed to delete original after WebP conversion", objectName, e);
  }

  await Promise.allSettled([fs.unlink(tmpIn), fs.unlink(tmpOut)]);

  return { ok: true, canonicalPath: webpObjectName };
});

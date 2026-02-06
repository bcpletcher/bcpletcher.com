// Utilities to derive resized image variants from existing Firebase Storage download URLs.
//
// Canonical (2026): Firestore stores images as objects: { path, url? }
// We no longer support legacy string download URLs at runtime.
//
// Why:
// - Today Firestore stores full Firebase Storage download URLs.
// - The Firebase "Resize Images" extension can generate deterministic resized objects.
// - These helpers let the frontend emit srcset/sizes without migrating Firestore data.
//
// Assumptions (configurable):
// - Originals are uploaded under:   Projects/<entryId>/<file>
// - Resized outputs are written to: Projects/<entryId>/resized/<file> (same filename)
// - Resized filename convention (Firebase Resize Images extension): append `_{width}x{height}` before extension
//   e.g. `foo.webp` -> `foo_720x9999.webp`

// Resize Images extension setting: "Cloud Storage path for resized images".
// This is a *relative* folder created under the original image's folder.
const DEFAULT_RESIZED_SUBFOLDER = "resized";

// No backward-compat: only support the new canonical Projects/ structure.
const DEFAULT_ORIGINAL_PREFIXES = ["Projects/"];

/**
 * Build a resized storage object path from an original storage path.
 */
export function buildResizedStoragePath(
  originalStoragePath,
  {
    resizedSubfolder = DEFAULT_RESIZED_SUBFOLDER,
    width,
    height,
  }
) {
  if (!originalStoragePath || typeof originalStoragePath !== "string") return null;
  if (!width || typeof width !== "number") return null;

  const matchedPrefix = DEFAULT_ORIGINAL_PREFIXES.find((p) =>
    originalStoragePath.startsWith(p)
  );
  if (!matchedPrefix) return null;

  const rel = originalStoragePath.slice(matchedPrefix.length);

  // Preserve folder structure and filename.
  const parts = rel.split("/");
  const filename = parts.pop();
  if (!filename) return null;

  const { base, ext } = splitExt(filename);
  const resizedFilename = `${base}_${getExtensionSizeToken({ width, height })}${ext}`;

  // Place resized files inside the same directory as the original, under <dir>/<resizedSubfolder>/
  const dir = parts.length ? parts.join("/") + "/" : "";
  return `${matchedPrefix}${dir}${resizedSubfolder}/${resizedFilename}`;
}

function encodeStoragePathForUrl(path) {
  // Firebase Storage expects '/' encoded in the URL path segment.
  return encodeURIComponent(path);
}

/**
 * Construct a public download URL for a storage object path.
 * NOTE: this uses `alt=media` and relies on public read access (recommended for portfolios).
 */
export function buildAltMediaUrl(bucket, storagePath) {
  if (!bucket || !storagePath) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeStoragePathForUrl(
    storagePath
  )}?alt=media`;
}

/**
 * Given an original storage object path, produce src/srcset candidates.
 */
export function buildResponsiveImageSourcesFromPath(originalStoragePath, {
  bucket,
  widths = [480, 720, 1080],
  height = 9999,
  resizedSubfolder = DEFAULT_RESIZED_SUBFOLDER,
  preferWidth = null,
} = {}) {
  if (!originalStoragePath || typeof originalStoragePath !== "string") {
    return {
      src: "",
      srcset: "",
      originalPath: null,
      resizedPaths: [],
    };
  }

  const resizedPaths = widths
    .map((w) =>
      buildResizedStoragePath(originalStoragePath, {
        resizedSubfolder,
        width: w,
        height,
      })
    )
    .filter(Boolean);

  const src =
    bucket && resizedPaths.length
      ? buildAltMediaUrl(
          bucket,
          (() => {
            if (preferWidth && widths.includes(preferWidth)) {
              const idx = widths.indexOf(preferWidth);
              return resizedPaths[idx] || resizedPaths[resizedPaths.length - 1];
            }
            // Default: a middle-sized src to balance quality/bytes.
            return resizedPaths[Math.floor(widths.length / 2)] || resizedPaths[0];
          })()
        )
      : bucket
        ? buildAltMediaUrl(bucket, originalStoragePath)
        : "";

  const srcset = bucket
    ? resizedPaths
        .map((p) => {
          const w = Number((p.match(/_(\d+)x(\d+)(\.|$)/) || [])[1]);
          if (!w) return null;
          return `${buildAltMediaUrl(bucket, p)} ${w}w`;
        })
        .filter(Boolean)
        .join(", ")
    : "";

  return { src, srcset, originalPath: originalStoragePath, resizedPaths };
}

/**
 * Image object (canonical): { path: string, url?: string }
 * We no longer support legacy string download URLs.
 */

export function getDownloadUrlFromImageValue(image) {
  if (!image || typeof image !== "object") return "";
  return image.url || "";
}

export function getStoragePathFromImageValue(image) {
  if (!image || typeof image !== "object") return null;
  return image.path || null;
}

/**
 * Given an image object, build responsive sources.
 */
export function buildResponsiveImageSourcesFromImageValue(image, options = {}) {
  const storagePath = getStoragePathFromImageValue(image);
  if (!storagePath) {
    return { src: "", srcset: "", originalPath: null, resizedPaths: [] };
  }

  return buildResponsiveImageSourcesFromPath(storagePath, options);
}

// NOTE: extractStoragePathFromDownloadUrl and buildResponsiveImageSources(downloadUrl, ...) are legacy.
// They are intentionally kept for migrations/scripts only and should not be used by runtime UI.

/**
 * Legacy-only (migration scripts): Extract the storage object path from a Firebase Storage download URL.
 */
export function extractStoragePathFromDownloadUrl(url) {
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

// Remove/disable legacy runtime builder
export function buildResponsiveImageSources() {
  throw new Error(
    "buildResponsiveImageSources(downloadUrl, ...) is legacy-only. Use buildResponsiveImageSourcesFromImageValue({path,url}, ...) instead."
  );
}

function splitExt(filename) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return { base: filename, ext: "" };
  return {
    base: filename.slice(0, lastDot),
    ext: filename.slice(lastDot),
  };
}

function getExtensionSizeToken({ width, height }) {
  // Match Firebase Resize Images extension naming.
  return `${width}x${height}`;
}

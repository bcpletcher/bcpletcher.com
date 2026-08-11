// Cloudflare R2 media path helpers used by the public and admin UI.
//
// Canonical image values are objects shaped like { path: "Projects/..." }.
// The Worker serves those paths from R2 at /api/media, or a configured public
// media base URL can be used for a custom domain/CDN.

const DEFAULT_RESIZED_SUBFOLDER = "resized";
const DEFAULT_ORIGINAL_PREFIXES = ["Projects/"];

/**
 * Build a resized R2 object path from an original project image path.
 */
export function buildResizedStoragePath(
  originalStoragePath,
  {
    resizedSubfolder = DEFAULT_RESIZED_SUBFOLDER,
    width,
    height = 9999,
  } = {},
) {
  if (!originalStoragePath || typeof originalStoragePath !== "string") return null;
  if (!Number.isFinite(width) || width <= 0) return null;

  const matchedPrefix = DEFAULT_ORIGINAL_PREFIXES.find((prefix) =>
    originalStoragePath.startsWith(prefix),
  );
  if (!matchedPrefix) return null;

  const rel = originalStoragePath.slice(matchedPrefix.length);
  const parts = rel.split("/");
  const filename = parts.pop();
  if (!filename) return null;

  const { base, ext } = splitExt(filename);
  const resizedFilename = `${base}_${getSizeToken({ width, height })}${ext}`;
  const dir = parts.length ? `${parts.join("/")}/` : "";
  return `${matchedPrefix}${dir}${resizedSubfolder}/${resizedFilename}`;
}

function encodePathSegments(pathValue) {
  return String(pathValue)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getMediaBaseUrl() {
  const explicitMediaBase = String(import.meta.env.VITE_MEDIA_BASE_URL || "").replace(
    /\/+$/,
    "",
  );
  if (explicitMediaBase) return explicitMediaBase;

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  if (apiBase) return `${apiBase}/api/media`;

  const apiFallbackBase = String(import.meta.env.VITE_API_BASE_URL_FALLBACK || "").replace(
    /\/+$/,
    "",
  );
  if (apiFallbackBase) return `${apiFallbackBase}/api/media`;

  return "/api/media";
}

/**
 * Construct the public URL for an R2 object path.
 */
export function buildMediaUrl(storagePath) {
  if (!storagePath || typeof storagePath !== "string") return null;
  return `${getMediaBaseUrl()}/${encodePathSegments(storagePath)}`;
}

/**
 * Given an original R2 object path, produce src/srcset candidates.
 */
export function buildResponsiveImageSourcesFromPath(
  originalStoragePath,
  {
    widths = [480, 960],
    height = 9999,
    resizedSubfolder = DEFAULT_RESIZED_SUBFOLDER,
  } = {},
) {
  if (!originalStoragePath || typeof originalStoragePath !== "string") {
    return { src: "", srcset: "", originalPath: null, resizedPaths: [] };
  }

  const resizedPaths = widths
    .map((width) =>
      buildResizedStoragePath(originalStoragePath, {
        resizedSubfolder,
        width,
        height,
      }),
    )
    .filter(Boolean);

  const src = buildMediaUrl(originalStoragePath) || "";
  const enableResponsiveSrcset = import.meta.env.VITE_ENABLE_RESPONSIVE_SRCSET === "true";
  const srcset = enableResponsiveSrcset
    ? resizedPaths
      .map((path) => {
        const width = Number((path.match(/_(\d+)x(\d+)(\.|$)/) || [])[1]);
        const url = width ? buildMediaUrl(path) : null;
        return url ? `${url} ${width}w` : null;
      })
      .filter(Boolean)
      .join(", ")
    : "";

  return { src, srcset, originalPath: originalStoragePath, resizedPaths };
}

/**
 * Build responsive sources from the canonical image object stored in D1.
 */
export function buildResponsiveImageSourcesFromImageValue(image, options = {}) {
  const storagePath = getStoragePathFromImageValue(image);
  if (!storagePath) {
    return { src: "", srcset: "", originalPath: null, resizedPaths: [] };
  }

  return buildResponsiveImageSourcesFromPath(storagePath, options);
}

export function getStoragePathFromImageValue(image) {
  if (!image || typeof image !== "object") return null;
  return typeof image.path === "string" ? image.path : null;
}

function splitExt(filename) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return { base: filename, ext: "" };
  return {
    base: filename.slice(0, lastDot),
    ext: filename.slice(lastDot),
  };
}

function getSizeToken({ width, height }) {
  return `${width}x${height}`;
}

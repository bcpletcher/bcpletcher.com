// Client-side image resize helper for uploads.
//
// Contract:
// - Input: File (png/jpg/webp/etc)
// - Output: File resized/cropped to 1920x1080 (cover) as a chosen mimeType.
// - GIFs should be passed through without modification (handled by caller).
// - Uses Canvas; quality setting is configurable.

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Resize and crop to target aspect ratio using "cover" behavior.
 */
export async function resizeImageFileToCover(file, {
  width = 1920,
  height = 1080,
   mimeType = "image/png",
   quality = undefined,
  fileName = null,
} = {}) {
  if (!(file instanceof File)) {
    throw new Error("resizeImageFileToCover requires a File");
  }

  const img = await loadImageFromBlob(file);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new Error("Could not determine image dimensions");

  // Compute cover crop rectangle
  const targetRatio = width / height;
  const srcRatio = srcW / srcH;

  let cropW = srcW;
  let cropH = srcH;
  let cropX = 0;
  let cropY = 0;

  if (srcRatio > targetRatio) {
    // Source is wider -> crop left/right
    cropH = srcH;
    cropW = Math.round(srcH * targetRatio);
    cropX = Math.round((srcW - cropW) / 2);
    cropY = 0;
  } else if (srcRatio < targetRatio) {
    // Source is taller -> crop top/bottom
    cropW = srcW;
    cropH = Math.round(srcW / targetRatio);
    cropX = 0;
    cropY = Math.round((srcH - cropH) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, width, height);

  const blob = await new Promise((resolve) => {
    // Some browsers ignore quality for PNG; keep it optional.
    if (typeof quality === "number") {
      canvas.toBlob(resolve, mimeType, quality);
    } else {
      canvas.toBlob(resolve, mimeType);
    }
  });
  if (!blob) throw new Error("Failed to generate resized image blob");

  const outName = fileName || (file.name ? file.name.replace(/\.[^.]+$/, "") : "image");
  const ext = mimeType === "image/webp" ? "webp" : mimeType === "image/png" ? "png" : "jpg";
  const finalName = `${outName}-${width}x${height}.${ext}`;

  return new File([blob], finalName, { type: mimeType, lastModified: Date.now() });
}

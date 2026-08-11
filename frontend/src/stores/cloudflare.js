import { defineStore } from "pinia";

import { dataGetCollection } from "./actions/data/dataGetCollection";
import { dataCreateDocument } from "@/stores/actions/data/dataCreateDocument.js";
import { dataUpdateDocument } from "@/stores/actions/data/dataUpdateDocument.js";
import {
  buildMediaUrl,
  buildResizedStoragePath,
} from "@/utils/mediaStorageImages.js";
import {
  apiFetch,
  getStoredAdminUser,
  setStoredAdminSession,
  clearStoredAdminSession,
} from "@/utils/cloudflareApi.js";

function generateUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function extFromFile(file) {
  return (file?.name?.split(".")?.pop() || "jpg").toLowerCase();
}

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed reading file"));
    reader.readAsDataURL(file);
  });
}

async function loadImageElement(fileOrBlob) {
  const url = URL.createObjectURL(fileOrBlob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed decoding image"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasBlobFromImage(imageEl, { width = null, height = 9999, type = "image/webp", quality = 0.9 } = {}) {
  const sw = imageEl.naturalWidth || imageEl.width;
  const sh = imageEl.naturalHeight || imageEl.height;
  if (!sw || !sh) throw new Error("Invalid source image dimensions");

  let tw = sw;
  let th = sh;
  if (width && sw > width) {
    const ratio = Math.min(width / sw, height / sh);
    tw = Math.max(1, Math.round(sw * ratio));
    th = Math.max(1, Math.round(sh * ratio));
  }

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Unable to create canvas context");
  ctx.drawImage(imageEl, 0, 0, tw, th);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error("Failed creating image blob"));
        else resolve(b);
      },
      type,
      quality
    );
  });

  return blob;
}

function dataUrlToBase64(dataUrl) {
  const idx = dataUrl.indexOf(",");
  if (idx === -1) return "";
  return dataUrl.slice(idx + 1);
}

async function buildUploadObjects(entryId, file) {
  const id = generateUuid();
  const ext = extFromFile(file);
  const isGif = file.type === "image/gif" || ext === "gif";

  const originalUploadPath = `Projects/${entryId}/${id}.${ext}`;
  const canonicalPath = isGif ? originalUploadPath : `Projects/${entryId}/${id}.webp`;

  if (isGif) {
    const dataUrl = await fileToDataURL(file);
    return {
      canonicalPath,
      objects: [
        {
          key: canonicalPath,
          contentType: "image/gif",
          cacheControl: "public,max-age=31536000,immutable",
          base64: dataUrlToBase64(dataUrl),
        },
      ],
    };
  }

  const imageEl = await loadImageElement(file);
  const canonicalBlob = await canvasBlobFromImage(imageEl, {
    type: "image/webp",
    quality: 0.95,
  });

  const objects = [];

  const canonicalDataUrl = await fileToDataURL(canonicalBlob);
  objects.push({
    key: canonicalPath,
    contentType: "image/webp",
    cacheControl: "public,max-age=31536000,immutable",
    base64: dataUrlToBase64(canonicalDataUrl),
  });

  const widths = [480, 960];
  for (const width of widths) {
    const resizedPath = buildResizedStoragePath(canonicalPath, {
      width,
      height: 9999,
    });
    if (!resizedPath) continue;

    const resizedBlob = await canvasBlobFromImage(imageEl, {
      width,
      height: 9999,
      type: "image/webp",
      quality: 0.82,
    });
    const resizedDataUrl = await fileToDataURL(resizedBlob);

    objects.push({
      key: resizedPath,
      contentType: "image/webp",
      cacheControl: "public,max-age=31536000,immutable",
      base64: dataUrlToBase64(resizedDataUrl),
    });
  }

  return { canonicalPath, objects };
}

function createSessionAdapter(getUserRef) {
  const listeners = new Set();

  return {
    onSessionChanged(callback) {
      if (typeof callback !== "function") return () => {};
      listeners.add(callback);
      callback(getUserRef());
      return () => listeners.delete(callback);
    },
    _notify() {
      const user = getUserRef();
      listeners.forEach((cb) => {
        try {
          cb(user);
        } catch {
          // no-op
        }
      });
    },
  };
}

export const useCloudflareStore = defineStore("cloudflare", {
  state: () => {
    const initialUser = getStoredAdminUser();
    const session = createSessionAdapter(() => {
      const user = getStoredAdminUser();
      return user && Object.keys(user).length ? user : null;
    });

    return {
      session,
      user: initialUser,
    };
  },
  actions: {
    async adminSignIn(email, password) {
      const payload = await apiFetch("/api/admin/login", {
        method: "POST",
        body: { email, password },
      });

      const token = payload?.token;
      const user = payload?.user || {};
      if (!token || !user || !user.uid) {
        throw new Error("Invalid login response");
      }

      setStoredAdminSession({ token, user });
      this.user = user;
      this.session._notify();
      return user;
    },

    async adminSignOut() {
      clearStoredAdminSession();
      this.user = {};
      this.session._notify();
    },

    dataGetProjectsCollection() {
      return dataGetCollection("getProjectsCollection");
    },

    dataCreateProjectDocument(document) {
      return dataCreateDocument("createProjectDocument", document);
    },

    dataUpdateProjectDocument(document) {
      return dataUpdateDocument("updateProjectDocument", document);
    },

    async uploadProjectImages(entryId, files) {
      if (!entryId) throw new Error("uploadProjectImages requires a valid entryId");

      const uploaded = [];
      let currentCanonicalPath = "";

      try {
        for (const file of files) {
          const { canonicalPath, objects } = await buildUploadObjects(entryId, file);
          currentCanonicalPath = canonicalPath;

          let response;
          try {
            response = await apiFetch("/api/admin/images/upload", {
              method: "POST",
              auth: true,
              body: { objects },
            });
          } catch (error) {
            // The Worker reports incomplete cleanup when a partial R2 upload
            // could not remove every object from this attempt.
            if (error?.cleanup === "incomplete") {
              uploaded.push({ path: canonicalPath });
            }
            throw error;
          }

          const url = response?.canonicalUrl || buildMediaUrl(canonicalPath) || "";
          uploaded.push({ path: canonicalPath, url });
          currentCanonicalPath = "";
        }

        return uploaded;
      } catch (error) {
        const cleanupTargets = uploaded.filter(
          (item, index, items) => items.findIndex((candidate) => candidate.path === item.path) === index,
        );
        if (currentCanonicalPath && !cleanupTargets.some((item) => item.path === currentCanonicalPath)) {
          cleanupTargets.push({ path: currentCanonicalPath });
        }

        if (cleanupTargets.length) {
          const cleanupResults = await Promise.allSettled(
            cleanupTargets.map((item) => this.deleteProjectImage(item)),
          );
          const cleanupFailures = cleanupResults
            .map((result, index) =>
              result.status === "rejected"
                ? { item: cleanupTargets[index], error: result.reason }
                : null,
            )
            .filter(Boolean);
          error.uploadedMedia = cleanupTargets;
          error.cleanupFailures = cleanupFailures;
        }
        throw error;
      }
    },

    async deleteProjectImageByPath(storagePath) {
      if (!storagePath) return;
      await apiFetch("/api/admin/images/delete", {
        method: "POST",
        auth: true,
        body: { path: storagePath },
      });
    },

    async deleteProjectImage(image) {
      if (!image || typeof image !== "object" || !image.path) return;
      return this.deleteProjectImageByPath(image.path);
    },
  },
});

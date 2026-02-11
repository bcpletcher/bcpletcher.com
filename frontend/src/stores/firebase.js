import { defineStore } from "pinia";
import { initializeApp, setLogLevel } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { httpsCallable } from "firebase/functions";
import {
  ref as storageRef,
  getStorage,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";

// Firebase config (Vite env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(firebaseApp);

setPersistence(auth, browserLocalPersistence).catch(() => {
  // Persist auth session across reloads until explicit sign-out or token invalidation.
  // (If the browser disallows it, Firebase will fall back internally.)
  // no-op: some environments can block persistence
});

const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const functions = getFunctions(firebaseApp);
// const analytics = getAnalytics(firebaseApp);

setLogLevel("silent");

const useEmulator = import.meta.env.VITE_USE_EMULATOR === "true";
if (useEmulator) {
  // Connect to emulators
  console.log("useEmulator", useEmulator);

  // Firebase Functions emulator
  connectFunctionsEmulator(functions, "localhost", 5002);

  // Firestore emulator
  // (Requires explicit connection; otherwise Firestore will read from production)
  const { connectFirestoreEmulator } = await import("firebase/firestore");
  connectFirestoreEmulator(firestore, "localhost", 8080);
}

// Import the actions
import { adminSignIn } from "./actions/admin/adminSignIn";

import { dataGetCollection } from "./actions/data/dataGetCollection";
import { dataCreateDocument } from "@/stores/actions/data/dataCreateDocument.js";
import { dataUpdateDocument } from "@/stores/actions/data/dataUpdateDocument.js";

// Shared image helpers
import {
  buildResizedStoragePath,
} from "@/utils/firebaseStorageImages.js";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStorageObject(ref, {
  timeoutMs = 8000,
  initialDelayMs = 200,
  maxDelayMs = 1200,
} = {}) {
  const started = Date.now();
  let delay = initialDelayMs;

  // Poll by requesting metadata. This is cheaper than download and works with public/private.
  // If it times out, we let the caller decide how to proceed.
  while (true) {
    try {
      await getMetadata(ref);
      return true;
    } catch {
      // Firebase Storage errors can vary; treat any failure as "not ready" during the window.
      if (Date.now() - started >= timeoutMs) return false;
      await sleep(delay);
      delay = Math.min(maxDelayMs, Math.round(delay * 1.5));
    }
  }
}

function generateUuid() {
  // Use native crypto if available (modern browsers).
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback UUID v4-ish for older environments.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Simple in-memory mutex per entry to prevent concurrent uploads generating the same names.
const uploadLocks = new Map();
async function withUploadLock(entryId, fn) {
  const prev = uploadLocks.get(entryId) || Promise.resolve();
  let release;
  const next = new Promise((r) => (release = r));
  uploadLocks.set(entryId, prev.then(() => next));

  try {
    await prev;
    return await fn();
  } finally {
    release();
    // Best-effort cleanup
    if (uploadLocks.get(entryId) === next) uploadLocks.delete(entryId);
  }
}

export const useFirebaseStore = defineStore("firebase", {
  state: () => ({
    auth,
    firestore,
    storage,
    functions,
  }),
  actions: {
    adminSignIn(email, password) {
      return adminSignIn(this.auth, email, password);
    },

    // --- Projects (preferred names) ---
    dataGetProjectsCollection() {
      return dataGetCollection(
        this.functions,
        "getProjectsCollection",
        "projectsCache"
      );
    },
    dataCreateProjectDocument(document) {
      return dataCreateDocument(
        this.functions,
        "createProjectDocument",
        document
      );
    },
    dataUpdateProjectDocument(document) {
      return dataUpdateDocument(
        this.functions,
        "updateProjectDocument",
        document
      );
    },
    // Upload files using UUID filenames (robust against delete/upload reorder conflicts).
    // Existing images (numbered or UUID) continue to work; we only change naming for new uploads.
    async uploadProjectImages(entryId, files) {
      if (!entryId) {
        throw new Error("uploadProjectImages requires a valid entryId");
      }

      return withUploadLock(entryId, async () => {

        // Return a richer object so admin can later delete/reorder robustly.
        // NOTE: We still include `url` for immediate preview/use.
        const uploaded = [];

        for (const file of files) {
          const id = generateUuid();
          const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
          const isGif = file.type === "image/gif" || ext === "gif";
          const uploadFilename = `${id}.${ext}`;
          const uploadPath = `Projects/${entryId}/${uploadFilename}`;

        // Canonical storage format: .webp (except GIFs).
        const canonicalPath = isGif
          ? uploadPath
          : `Projects/${entryId}/${id}.webp`;

        const ref = storageRef(this.storage, uploadPath);
        await uploadBytes(ref, file);

        // If the backend converter runs, it will create the .webp and delete the original.
        // We store the canonical .webp path so the UI always points at the final asset.
        // For GIFs, we keep the original uploadPath.
        const canonicalRef = storageRef(this.storage, canonicalPath);

        if (!isGif) {
          // Server-side conversion (avoids Eventarc Storage trigger permissions issues)
          const convert = httpsCallable(this.functions, "convertProjectImageToWebp");
          await convert({
            path: uploadPath,
            bucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          });

           const ready = await waitForStorageObject(canonicalRef);
           if (!ready) {
             // If conversion is very slow, surface a helpful error instead of a confusing 404.
             // (You can still retry by saving again; the upload already succeeded.)
             throw new Error(
               `Timed out waiting for WebP conversion: ${canonicalPath}`
             );
           }
         }

          const url = await getDownloadURL(canonicalRef);
          uploaded.push({ path: canonicalPath, url });
        }

        return uploaded;
       });
     },
    async deleteProjectImageByPath(storagePath, { widths = [480, 720, 1080], height = 9999 } = {}) {
      if (!storagePath) return;

      // Delete original
      try {
        const ref = storageRef(this.storage, storagePath);
        await deleteObject(ref);
      } catch (e) {
        // If it doesn't exist, continue
        console.warn("Failed to delete original image", storagePath, e);
      }

      // Delete resized variants (best-effort)
      const resizedPaths = widths
        .map((w) =>
          buildResizedStoragePath(storagePath, {
            width: w,
            height,
          })
        )
        .filter(Boolean);

      await Promise.all(
        resizedPaths.map(async (p) => {
          try {
            const ref = storageRef(this.storage, p);
            await deleteObject(ref);
          } catch (e) {
            console.warn("Failed to delete resized image", p, e);
          }
        })
      );
    },
    async deleteProjectImage(image) {
      // Canonical only: { path, url? }
      if (!image || typeof image !== "object" || !image.path) return;
      return this.deleteProjectImageByPath(image.path);
    },
  },
});

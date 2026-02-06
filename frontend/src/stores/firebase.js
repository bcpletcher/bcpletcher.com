import { defineStore } from "pinia";
import { initializeApp, setLogLevel } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import {
  ref as storageRef,
  getStorage,
  uploadBytes,
  getDownloadURL,
  deleteObject,
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
    async uploadProjectImages(entryId, files, existingCount = 0) {
      if (!entryId) {
        throw new Error("uploadProjectImages requires a valid entryId");
      }

      // Return a richer object so admin can later delete/reorder robustly.
      // NOTE: We still include `url` for immediate preview/use.
      const uploaded = [];
      let index = existingCount;

      for (const file of files) {
        index += 1;
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const padded = String(index).padStart(3, "0");
        const filename = `${entryId}_${padded}.${ext}`;
        const path = `Projects/${entryId}/${filename}`;

        const ref = storageRef(this.storage, path);
        await uploadBytes(ref, file);

        const url = await getDownloadURL(ref);
        uploaded.push({ path, url });
      }

      return uploaded;
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

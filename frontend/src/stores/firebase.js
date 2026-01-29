import { defineStore } from "pinia";
import { initializeApp, setLogLevel } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import {
  ref as storageRef,
  getStorage,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey) {
  console.error(
    "[FirebaseConfig] Missing VITE_FIREBASE_API_KEY; Firebase Auth will fail."
  );
}

const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const functions = getFunctions(firebaseApp);
// const analytics = getAnalytics(firebaseApp);

setLogLevel("silent");

const useEmulator = import.meta.env.VITE_USE_EMULATOR === "true";
if (useEmulator) {
  // Connect to emulators
  console.log("useEmulator", useEmulator);

  connectFunctionsEmulator(functions, "localhost", 5001);
  // connectFirestoreEmulator(firestore, "localhost", 8080);
}

// Import the actions
import { adminSignIn } from "./actions/admin/adminSignIn";

import { dataGetCollection } from "./actions/data/dataGetCollection";
import { dataCreateDocument } from "@/stores/actions/data/dataCreateDocument.js";
import { dataUpdateScrapbookDocumentOrder } from "@/stores/actions/data/dataUpdateScrapbookDocumentOrder.js";
import { dataUpdateDocument } from "@/stores/actions/data/dataUpdateDocument.js";

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
    dataGetResourcesCollection() {
      return dataGetCollection(
        this.functions,
        "getResourcesCollection",
        "resourcesCache"
      );
    },
    dataGetScrapbookCollection() {
      return dataGetCollection(
        this.functions,
        "getScrapbookCollection",
        "contentScrapbook"
      );
    },
    dataCreateScrapbookDocument(document) {
      return dataCreateDocument(
        this.functions,
        "createScrapbookDocument",
        document
      );
    },
    dataUpdateScrapbookDocument(document) {
      return dataUpdateDocument(
        this.functions,
        "updateScrapbookDocument",
        document
      );
    },
    dataUpdateScrapbookDocumentOrder(documents) {
      return dataUpdateScrapbookDocumentOrder(
        this.functions,
        "updateScrapbookDocumentOrder",
        documents
      );
    },
    async uploadScrapbookImages(entryId, files, existingCount = 0) {
      if (!entryId) {
        throw new Error("uploadScrapbookImages requires a valid entryId");
      }
      const uploadedUrls = [];
      let index = existingCount;
      for (const file of files) {
        index += 1;
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const padded = String(index).padStart(3, "0");
        const filename = `${entryId}_${padded}.${ext}`;
        const path = `Scrapbook/${entryId}/${filename}`;
        const ref = storageRef(this.storage, path);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        uploadedUrls.push(url);
      }
      return uploadedUrls;
    },
    async deleteScrapbookImageByUrl(url) {
      if (!url) return;
      try {
        const ref = storageRef(this.storage, url);
        await deleteObject(ref);
      } catch (e) {
        console.error("Failed to delete scrapbook image from storage", e);
      }
    },
  },
});

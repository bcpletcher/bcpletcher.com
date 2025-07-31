import { defineStore } from "pinia";
import { initializeApp, setLogLevel } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

console.log("API Key:", import.meta.env.VITE_FIREBASE_API_KEY);


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
// import { dataUpdateDcoument } from "./actions/data/dataUpdateDocument";

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
    // dataUpdateContentDocument(updates) {
    //   return dataUpdateDocument(this.functions, "updateContent", updates);
    // },

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
    dataUpdateScrapbookDocumentOrder(documents) {
      return dataUpdateScrapbookDocumentOrder(
        this.functions,
        "updateScrapbookDocumentOrder",
        documents
      );
    },
  },
});

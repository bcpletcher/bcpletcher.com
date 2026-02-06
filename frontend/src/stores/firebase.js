import { defineStore } from "pinia";
import { initializeApp, setLogLevel } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

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
const firestore = getFirestore(firebaseApp);

setLogLevel("silent");

async function fetchCollectionAsArray(
  colName,
  { orderByField = "order" } = {}
) {
  const colRef = collection(firestore, colName);
  const q = orderByField ? query(colRef, orderBy(orderByField, "asc")) : colRef;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export const useFirebaseStore = defineStore("firebase", {
  state: () => ({
    firestore,
  }),
  actions: {
    async dataGetResourcesCollection() {
      // resources are likely keyed by order as well; if not, remove orderBy.
      return fetchCollectionAsArray("resources", { orderByField: "order" });
    },
    async dataGetScrapbookCollection() {
      return fetchCollectionAsArray("2024-archive-projects", {
        orderByField: "order",
      });
    },
  },
});

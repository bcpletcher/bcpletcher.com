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

const CACHE_PREFIX = "bcpletcher:v2:firestore:";
const CACHE_TTL_MS = (() => {
  const raw = import.meta.env.VITE_FIRESTORE_CACHE_TTL_HOURS;
  const hours =
    raw === undefined || raw === null || raw === "" ? 24 * 7 : Number(raw);
  return Number.isFinite(hours) && hours > 0
    ? hours * 60 * 60 * 1000
    : 24 * 7 * 60 * 60 * 1000;
})();

function getCacheKey(collectionName) {
  return `${CACHE_PREFIX}${collectionName}`;
}

function loadFromCache(collectionName) {
  try {
    const raw = localStorage.getItem(getCacheKey(collectionName));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const { ts, data } = parsed;
    if (typeof ts !== "number") return null;

    const age = Date.now() - ts;
    if (age < 0 || age > CACHE_TTL_MS) return null;

    return data ?? null;
  } catch {
    return null;
  }
}

function saveToCache(collectionName, data) {
  try {
    // Ensure we don't accidentally try to serialize non-plain objects.
    const plain = JSON.parse(JSON.stringify(data ?? null));
    const payload = JSON.stringify({ ts: Date.now(), data: plain });
    localStorage.setItem(getCacheKey(collectionName), payload);
  } catch {
    // Best-effort cache; ignore quota/JSON failures.
  }
}

async function fetchCollectionAsArray(
  colName,
  { orderByField = "order", cache = true } = {}
) {
  if (cache) {
    const cached = loadFromCache(colName);
    if (cached) return cached;
  }

  const colRef = collection(firestore, colName);
  const q = orderByField ? query(colRef, orderBy(orderByField, "asc")) : colRef;
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (cache) saveToCache(colName, data);
  return data;
}

export const useFirebaseStore = defineStore("firebase", {
  state: () => ({
    firestore,
  }),
  actions: {
    async dataGetScrapbookCollection() {
      return fetchCollectionAsArray("v2-projects", {
        orderByField: "order",
        cache: true,
      });
    },
  },
});

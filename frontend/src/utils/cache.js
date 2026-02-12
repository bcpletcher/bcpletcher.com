import { openDB } from "idb";

// App-wide client caching utilities.
//
// - Uses IndexedDB for large JSON payloads (async + bigger limits than Web Storage).
// - Stores multiple cache keys in a single DB.
// - Exposes a single API surface so we can expand caching over time.

const DB_NAME = "bcpletcher-cache";
const DB_VERSION = 2;

const STORES = {
  data: "data",
  meta: "meta",
};

const KEYS = {
  projectsAll: "projects:all",
  projectsUpdatedAt: "projects:updatedAt",
  cacheEpoch: "cache:epoch",
};

// Deploy-controlled cache buster.
// Set this in your build env (e.g., CI) to a new value on each deploy.
// Example: VITE_CACHE_EPOCH=2026-02-11T1200Z
export const CACHE_EPOCH = (import.meta.env.VITE_CACHE_EPOCH || "").toString();

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Ensure expected stores exist (handles fresh installs and older versions).
      // This also covers edge cases where a previous version was created without all stores.
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    },
  });
}

// -----------------------
// Projects caching
// -----------------------
export async function loadProjectsFromCache() {
  const db = await getDb();
  const [all, updatedAt, storedEpoch] = await Promise.all([
    db.get(STORES.data, KEYS.projectsAll),
    db.get(STORES.meta, KEYS.projectsUpdatedAt),
    db.get(STORES.meta, KEYS.cacheEpoch),
  ]);

  // If the deploy epoch changed, treat cache as invalid.
  // This lets you force a refresh even while TTL is still valid.
  if (CACHE_EPOCH && storedEpoch !== CACHE_EPOCH) {
    return {
      all: null,
      updatedAt: null,
      reason: "epoch-mismatch",
    };
  }

  return {
    all: all || null,
    updatedAt: typeof updatedAt === "number" ? updatedAt : null,
    reason: null,
  };
}

export async function saveProjectsToCache(allProjects) {
  const db = await getDb();
  const tx = db.transaction([STORES.data, STORES.meta], "readwrite");

  // IndexedDB uses the structured clone algorithm; Vue proxies and certain objects
  // can throw DataCloneError. Normalize to plain JSON first.
  const plainAll = JSON.parse(JSON.stringify(allProjects || null));

  const now = Date.now();

  await Promise.all([
    tx.objectStore(STORES.data).put(plainAll, KEYS.projectsAll),
    tx.objectStore(STORES.meta).put(now, KEYS.projectsUpdatedAt),
    // Persist the current deploy epoch (if any) so we can compare on next boot.
    ...(CACHE_EPOCH
      ? [tx.objectStore(STORES.meta).put(CACHE_EPOCH, KEYS.cacheEpoch)]
      : []),
    tx.done,
  ]);

  return { updatedAt: now };
}

export async function clearProjectsCache() {
  const db = await getDb();
  const tx = db.transaction([STORES.data, STORES.meta], "readwrite");

  await Promise.all([
    tx.objectStore(STORES.data).delete(KEYS.projectsAll),
    tx.objectStore(STORES.meta).delete(KEYS.projectsUpdatedAt),
    tx.objectStore(STORES.meta).delete(KEYS.cacheEpoch),
    tx.done,
  ]);
}
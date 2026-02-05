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
};

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
  const [all, updatedAt] = await Promise.all([
    db.get(STORES.data, KEYS.projectsAll),
    db.get(STORES.meta, KEYS.projectsUpdatedAt),
  ]);

  return {
    all: all || null,
    updatedAt: typeof updatedAt === "number" ? updatedAt : null,
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
    tx.done,
  ]);
}
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
  scrapbookAll: "scrapbook:all",
  scrapbookFeatured: "scrapbook:featured",
  scrapbookUpdatedAt: "scrapbook:updatedAt",
};

function buildFeaturedIndex(allScrapbook) {
  if (!allScrapbook || typeof allScrapbook !== "object") return {};

  const entries = Object.entries(allScrapbook)
    .filter(([, item]) => item && !item.deleted)
    .filter(([, item]) => !!item.featured)
    .sort(([, a], [, b]) => {
      const orderA = a && a.order != null ? Number(a.order) : 0;
      const orderB = b && b.order != null ? Number(b.order) : 0;
      return (orderA || 0) - (orderB || 0);
    });

  return entries.reduce((acc, [id, item]) => {
    acc[id] = item;
    return acc;
  }, {});
}

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
// Scrapbook caching
// -----------------------
export async function loadScrapbookFromCache() {
  const db = await getDb();
  const [all, featured, updatedAt] = await Promise.all([
    db.get(STORES.data, KEYS.scrapbookAll),
    db.get(STORES.data, KEYS.scrapbookFeatured),
    db.get(STORES.meta, KEYS.scrapbookUpdatedAt),
  ]);

  return {
    all: all || null,
    featured: featured || null,
    updatedAt: typeof updatedAt === "number" ? updatedAt : null,
  };
}

export async function saveScrapbookToCache(allScrapbook) {
  const db = await getDb();
  const tx = db.transaction([STORES.data, STORES.meta], "readwrite");

  const featured = buildFeaturedIndex(allScrapbook);
  const now = Date.now();

  await Promise.all([
    tx.objectStore(STORES.data).put(allScrapbook, KEYS.scrapbookAll),
    tx.objectStore(STORES.data).put(featured, KEYS.scrapbookFeatured),
    tx.objectStore(STORES.meta).put(now, KEYS.scrapbookUpdatedAt),
    tx.done,
  ]);

  return { featured, updatedAt: now };
}

export async function saveFeaturedScrapbookToCache(featuredScrapbook) {
  const db = await getDb();
  const tx = db.transaction([STORES.data, STORES.meta], "readwrite");

  const now = Date.now();
  await Promise.all([
    tx
      .objectStore(STORES.data)
      .put(featuredScrapbook || null, KEYS.scrapbookFeatured),
    // We still update updatedAt so we can reason about staleness even if only featured was fetched.
    tx.objectStore(STORES.meta).put(now, KEYS.scrapbookUpdatedAt),
    tx.done,
  ]);

  return { updatedAt: now };
}

export async function clearScrapbookCache() {
  const db = await getDb();
  const tx = db.transaction([STORES.data, STORES.meta], "readwrite");

  await Promise.all([
    tx.objectStore(STORES.data).delete(KEYS.scrapbookAll),
    tx.objectStore(STORES.data).delete(KEYS.scrapbookFeatured),
    tx.objectStore(STORES.meta).delete(KEYS.scrapbookUpdatedAt),
    tx.done,
  ]);
}

// -----------------------
// App cache (all modules)
// -----------------------

export async function clearAppCache() {
  await clearScrapbookCache();
}

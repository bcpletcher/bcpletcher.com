import { httpsCallable } from "firebase/functions";

const safeJsonParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export async function dataGetCollection(functions, functionName, cookieName) {
  const cacheMinutes = parseInt(import.meta.env.VITE_CACHE_MINUTES, 10) || 0; // Disables cache by default
  const cacheDuration = cacheMinutes * 60 * 1000; // Cache duration in milliseconds (e.g., 5 minutes)
  const currentTime = Date.now();

  const isProjectsKey = cookieName === "bcpletcherProjects";

  // Retrieve cached data from localStorage (with one-time migration from legacy keys)
  let cachedData = safeJsonParse(localStorage.getItem(cookieName));

  if (isProjectsKey && !cachedData) {
    const legacyTimestamped = safeJsonParse(
      localStorage.getItem("contentScrapbook")
    );
    if (legacyTimestamped && typeof legacyTimestamped === "object") {
      cachedData = legacyTimestamped;
      localStorage.setItem(cookieName, JSON.stringify(legacyTimestamped));
      localStorage.removeItem("contentScrapbook");
    }
  }

  if (isProjectsKey && !cachedData) {
    const legacyRaw = safeJsonParse(localStorage.getItem("scrapbookCache"));
    if (legacyRaw && typeof legacyRaw === "object") {
      const migrated = Object.assign(
        {},
        { data: legacyRaw },
        { timestamp: currentTime }
      );
      cachedData = migrated;
      localStorage.setItem(cookieName, JSON.stringify(migrated));
      localStorage.removeItem("scrapbookCache");
    }
  }

  // Check if cached data exists and is still valid
  if (cachedData && currentTime - cachedData.timestamp < cacheDuration) {
    console.warn(`Returning cached ${cookieName}`);
    return cachedData.data;
  }

  // Fetch new data if cache is expired or doesn't exist
  try {
    const getFunction = httpsCallable(functions, functionName);
    const functionResult = await getFunction();

    let data = functionResult.data;

    // Backwards-compat normalization for scrapbook/projects entries
    if (
      (cookieName === "contentScrapbook" || isProjectsKey) &&
      data &&
      typeof data === "object"
    ) {
      Object.keys(data).forEach((key) => {
        const item = data[key];
        if (!item || typeof item !== "object") return;

        // Default new fields
        if (item.summary === undefined || item.summary === null)
          item.summary = "";
        if (item.featured === undefined || item.featured === null)
          item.featured = false;

        // Ensure description exists for UI textareas/counters
        if (item.description === undefined || item.description === null)
          item.description = "";
      });
    }

    // Cache the result and timestamp in localStorage
    const cacheToStore = {
      data,
      timestamp: currentTime,
    };
    localStorage.setItem(cookieName, JSON.stringify(cacheToStore));

    return data;
  } catch (error) {
    console.error(`Error fetching ${functionName}:`, error);
    throw error;
  }
}

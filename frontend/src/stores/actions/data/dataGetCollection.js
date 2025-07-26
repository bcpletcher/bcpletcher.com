import { httpsCallable } from "firebase/functions";

export async function dataGetCollection(functions, functionName, cookieName) {
  const cacheMinutes = parseInt(import.meta.env.VITE_CACHE_MINUTES, 10) || 0; // Disables cache by default
  const cacheDuration = cacheMinutes * 60 * 1000; // Cache duration in milliseconds (e.g., 5 minutes)
  const currentTime = Date.now();

  // Retrieve cached data from localStorage
  const cachedData = JSON.parse(localStorage.getItem(cookieName));

  // Check if cached data exists and is still valid
  if (cachedData && currentTime - cachedData.timestamp < cacheDuration) {
    console.warn(`Returning cached ${cookieName}`);
    return cachedData.data;
  }

  // Fetch new data if cache is expired or doesn't exist
  try {
    const getFunction = httpsCallable(functions, functionName);
    const functionResult = await getFunction();

    // Cache the result and timestamp in localStorage
    const cacheToStore = {
      data: functionResult.data,
      timestamp: currentTime,
    };
    localStorage.setItem(cookieName, JSON.stringify(cacheToStore));

    return functionResult.data;
  } catch (error) {
    console.error(`Error fetching ${functionName}:`, error);
    throw error;
  }
}

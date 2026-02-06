import { httpsCallable } from "firebase/functions";

export async function dataGetCollection(functions, functionName, ..._ignored) { // eslint-disable-line no-unused-vars
  // Cache has been intentionally disabled.
  try {
    const getFunction = httpsCallable(functions, functionName);
    const functionResult = await getFunction();

    const data = functionResult.data;

    // If the backend returns { error }, treat it as a failure so callers don't silently render empty pages.
    if (data && typeof data === "object" && data.error) {
      throw new Error(data.error);
    }

    // Generic normalization for entries
    if (data && typeof data === "object") {
      Object.keys(data).forEach((key) => {
        const item = data[key];
        if (!item || typeof item !== "object") return;

        if (item.summary === undefined || item.summary === null) item.summary = "";
        if (item.featured === undefined || item.featured === null) item.featured = false;
        if (item.description === undefined || item.description === null) item.description = "";
      });
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${functionName}:`, error);
    throw error;
  }
}

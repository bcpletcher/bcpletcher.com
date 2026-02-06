import { httpsCallable } from "firebase/functions";

export async function dataGetCollection(functions, functionName) {
  // Cache has been intentionally disabled.
  try {
    const getFunction = httpsCallable(functions, functionName);
    const functionResult = await getFunction();

    const data = functionResult.data;

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

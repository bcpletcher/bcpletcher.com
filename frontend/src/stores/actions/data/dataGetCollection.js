import { httpsCallable } from "firebase/functions";

export async function dataGetCollection(functions, functionName, cookieName) {
  // Cache has been intentionally disabled.
  // We still accept cookieName to avoid changing call sites.
  try {
    const getFunction = httpsCallable(functions, functionName);
    const functionResult = await getFunction();

    let data = functionResult.data;

    const isProjectsKey = cookieName === "bcpletcherProjects";

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

    return data;
  } catch (error) {
    console.error(`Error fetching ${functionName}:`, error);
    throw error;
  }
}

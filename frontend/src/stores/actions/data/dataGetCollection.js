import { apiFetch } from "@/utils/cloudflareApi.js";

function normalizeCollectionPayload(data) {
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
}

export async function dataGetCollection(operation) {
  try {
    const payload = await apiFetch("/api/projects");
    if (payload && typeof payload === "object" && payload.result) {
      return normalizeCollectionPayload(payload.result);
    }
    return normalizeCollectionPayload(payload);
  } catch (error) {
    console.error(`Error fetching ${operation}:`, error);
    throw error;
  }
}

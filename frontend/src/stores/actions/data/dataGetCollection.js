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

async function fetchProjectsFromCloudflare() {
  const apiUrl = import.meta.env.VITE_CLOUDFLARE_PROJECTS_API_URL;
  if (!apiUrl) return null;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Cloudflare projects request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload && typeof payload === "object" && payload.result && typeof payload.result === "object") {
    return payload.result;
  }
  if (payload && typeof payload === "object") {
    return payload;
  }
  throw new Error("Cloudflare projects payload must be a JSON object");
}

export async function dataGetCollection(operation) {
  try {
    if (operation === "getProjectsCollection") {
      const cloudflareData = await fetchProjectsFromCloudflare();
      if (cloudflareData) return normalizeCollectionPayload(cloudflareData);
    }
    const fallback = await apiFetch("/api/projects");
    if (fallback && typeof fallback === "object" && fallback.result) {
      return normalizeCollectionPayload(fallback.result);
    }
    return normalizeCollectionPayload(fallback);
  } catch (error) {
    console.error(`Error fetching ${operation}:`, error);
    throw error;
  }
}

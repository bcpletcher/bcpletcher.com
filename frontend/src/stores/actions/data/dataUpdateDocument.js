import { apiFetch } from "@/utils/cloudflareApi.js";

export async function dataUpdateDocument(operation, document) {
  try {
    if (operation !== "updateProjectDocument") {
      throw new Error(`Unsupported update operation: ${operation}`);
    }
    return apiFetch("/api/admin/projects/upsert", {
      method: "POST",
      auth: true,
      body: { mode: "update", document },
    });
  } catch (error) {
    console.error(`Error updating ${operation}:`, error);
    throw error;
  }
}

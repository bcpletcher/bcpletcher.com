import { apiFetch } from "@/utils/cloudflareApi.js";

export async function dataCreateDocument(operation, document) {
  try {
    if (operation !== "createProjectDocument") {
      throw new Error(`Unsupported create operation: ${operation}`);
    }
    return apiFetch("/api/admin/projects/upsert", {
      method: "POST",
      auth: true,
      body: { mode: "create", document },
    });
  } catch (error) {
    console.error(`Error creating ${operation}:`, error);
    throw error;
  }
}

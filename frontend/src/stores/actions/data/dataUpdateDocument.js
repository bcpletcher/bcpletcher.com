import { apiFetch } from "@/utils/cloudflareApi.js";

export async function dataUpdateDocument(functions, functionName, document) {
  try {
    if (functionName !== "updateProjectDocument") {
      throw new Error(`Unsupported update function: ${functionName}`);
    }
    return apiFetch("/api/admin/projects/upsert", {
      method: "POST",
      auth: true,
      body: { mode: "update", document },
    });
  } catch (error) {
    console.error(`Error updating ${functionName}:`, error);
    throw error;
  }
}

import { apiFetch } from "@/utils/cloudflareApi.js";

export async function dataCreateDocument(functions, functionName, document) {
  try {
    if (functionName !== "createProjectDocument") {
      throw new Error(`Unsupported create function: ${functionName}`);
    }
    return apiFetch("/api/admin/projects/upsert", {
      method: "POST",
      auth: true,
      body: { mode: "create", document },
    });
  } catch (error) {
    console.error(`Error creating ${functionName}:`, error);
    throw error;
  }
}

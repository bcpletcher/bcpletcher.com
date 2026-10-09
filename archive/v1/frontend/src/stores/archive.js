import { defineStore } from "pinia";

// The v1 portfolio used to read the Firestore "v1-projects" collection and
// Firebase Storage. It is now preserved in Cloudflare D1 (archive_projects) and
// R2 (Archive/v1/...) and served by the same-origin Worker API.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function toMediaUrl(value) {
  if (typeof value !== "string" || !value.startsWith("Archive/")) return value;
  const encoded = value.split("/").map(encodeURIComponent).join("/");
  return `${API_BASE}/api/media/${encoded}`;
}

export const useArchiveStore = defineStore("archive", {
  actions: {
    async dataGetScrapbookCollection() {
      const response = await fetch(`${API_BASE}/api/archive/v1/projects`);
      if (!response.ok) {
        throw new Error(`Archive request failed (${response.status})`);
      }
      const { result } = await response.json();
      return (Array.isArray(result) ? result : []).map((project) => ({
        ...project,
        hero: toMediaUrl(project.hero),
        images: Array.isArray(project.images)
          ? project.images.map(toMediaUrl)
          : project.images,
      }));
    },
  },
});

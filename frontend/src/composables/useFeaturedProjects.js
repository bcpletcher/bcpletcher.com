import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings.js";
import { normalizeProjectDate } from "@/utils/projectDate.js";

// How many featured projects the home "Selected work" band shows. The home
// "More projects" list picks up from here, so nothing is listed twice.
export const SELECTED_WORK_COUNT = 3;

// Featured, visible projects that have at least one image, newest first.
export function useFeaturedProjects() {
  const settingsStore = useSettingsStore();

  const featured = computed(() => {
    const all = settingsStore.projects;
    if (!all) return [];

    return (
      Object.values(all)
        .filter((p) => !p?.hidden)
        .filter((p) => !!p?.featured)
        .map((p) => {
          const images = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
          const projectName = p?.projectName || p?.title || "Untitled";

          return {
            hero: images[0] || "",
            images,
            projectName,
            summary: p?.summary || "",
            technology: p?.technology || [],
            url: p?.url || null,
            date: normalizeProjectDate(p?.date) || null,
            meta: p.meta,
          };
        })
        // Date is required, but keep a safe fallback so the section doesn't explode on legacy entries.
        .sort((a, b) => {
          const ad = a.date || "";
          const bd = b.date || "";
          if (ad !== bd) return bd.localeCompare(ad);
          return (a.projectName || "").localeCompare(b.projectName || "");
        })
        .filter((p) => Boolean(p.hero))
    );
  });

  const selected = computed(() => featured.value.slice(0, SELECTED_WORK_COUNT));
  const remaining = computed(() => featured.value.slice(SELECTED_WORK_COUNT));

  return { featured, selected, remaining };
}

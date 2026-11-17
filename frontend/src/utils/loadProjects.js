import { useCloudflareStore } from "@/stores/cloudflare.js";
import { useSettingsStore } from "@/stores/settings.js";
import { saveProjectsToCache } from "@/utils/cache.js";
import { withTimeout } from "@/utils/asyncTimeout.js";

// Default: cache enabled unless explicitly set to false.
export const isProjectsCacheEnabled = () =>
  String(import.meta.env.VITE_CACHE_ENABLED).toLowerCase() !== "false";

/**
 * Fetch the projects collection into the settings store.
 *
 * Sets `settings.projectsError` instead of throwing, so the UI can show an inline
 * error with a retry. Returns true on success.
 *
 * `quiet` is for a background refresh of a list that is already on screen: a failure then
 * leaves the current list alone instead of replacing it with an error.
 */
export async function loadProjects({
  persist = isProjectsCacheEnabled(),
  quiet = false,
} = {}) {
  const settingsStore = useSettingsStore();
  const cloudflareStore = useCloudflareStore();

  if (!quiet) settingsStore.projectsError = false;

  try {
    if (
      String(import.meta.env.VITE_SIMULATE_BOOT_ERROR).toLowerCase() === "true"
    ) {
      throw new Error("[boot-test] Simulated boot error");
    }

    const fresh = await cloudflareStore.dataGetProjectsCollection();
    settingsStore.projects = fresh;

    if (persist) {
      withTimeout(
        saveProjectsToCache(fresh),
        1000,
        "Projects cache write timed out",
      ).catch((e) => {
        console.warn("Failed to persist projects cache", e);
      });
    }
    return true;
  } catch (err) {
    console.error("Projects load failed:", err);
    if (!quiet) settingsStore.projectsError = true;
    return false;
  }
}

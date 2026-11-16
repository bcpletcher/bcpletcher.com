import { onMounted } from "vue";

import { useCloudflareStore } from "@/stores/cloudflare.js";
import { useSettingsStore } from "@/stores/settings.js";
import {
  clearProjectsCache,
  loadProjectsFromCache,
} from "@/utils/cache.js";
import { isProjectsCacheEnabled, loadProjects } from "@/utils/loadProjects.js";

/**
 * App boot sequence.
 *
 * Contract:
 * - The page renders immediately; nothing blocks on boot.
 * - Hydrates the projects store from cache when fresh (skips the network).
 * - Otherwise fetches the projects collection. Until it lands, project lists show
 *   skeletons; on failure they show an inline error with a retry
 *   (`settingsStore.projectsError`).
 */
export function useAppBoot() {
  const cloudflareStore = useCloudflareStore();
  const settingsStore = useSettingsStore();

  const CACHE_TTL_MINUTES = Number(
    import.meta.env.VITE_CACHE_TTL_MINUTES || 60,
  );
  const CACHE_TTL_MS = Number.isFinite(CACHE_TTL_MINUTES)
    ? Math.max(0, CACHE_TTL_MINUTES) * 60 * 1000
    : 60 * 60 * 1000;

  const boot = async () => {
    // URL overrides for QA/debugging.
    const sp = new URLSearchParams(window.location.search);
    const enabled = (v) => v === "1" || v === "true" || v === "yes";
    const noCache = enabled((sp.get("nocache") || "").toLowerCase());
    const clearCache = enabled((sp.get("clearcache") || "").toLowerCase());

    const cacheEnabledThisBoot = isProjectsCacheEnabled() && !noCache;
    if (noCache) {
      console.log("[boot] nocache=1 -> bypassing projects cache read/write");
    }

    if (cacheEnabledThisBoot && clearCache) {
      try {
        await clearProjectsCache();
        console.log("[boot] projects cache cleared via URL flag");
      } catch (e) {
        console.warn("[boot] failed to clear projects cache", e);
      }
    }

    // Validate a persisted admin session before the cache-first early exit. A
    // definite 401 clears the session; transient failures retain it for later
    // reconciliation instead of logging out.
    try {
      await cloudflareStore.validateAdminSession();
    } catch (error) {
      console.warn(
        "[boot] admin session validation unavailable; retaining local session state",
        error,
      );
    }

    // Cache-first: avoid unnecessary network calls within the TTL.
    if (cacheEnabledThisBoot) {
      try {
        const cached = await loadProjectsFromCache();

        // If the deploy cache epoch changed, wipe the old cache now (not on localhost/dev).
        if (
          Boolean(import.meta.env.VITE_CACHE_EPOCH) &&
          cached?.reason === "epoch-mismatch"
        ) {
          try {
            await clearProjectsCache();
            console.log("[boot] projects cache cleared (epoch mismatch)");
          } catch (e) {
            console.warn("[boot] failed to clear projects cache (epoch mismatch)", e);
          }
        }

        const ageMs = cached?.updatedAt ? Date.now() - cached.updatedAt : Infinity;
        if (Boolean(cached?.all) && ageMs >= 0 && ageMs <= CACHE_TTL_MS) {
          settingsStore.projects = cached.all;
          return;
        }
      } catch (e) {
        // Ignore cache failures (private mode / blocked storage / etc.)
        console.warn("Projects cache unavailable:", e);
      }
    }

    await loadProjects({ persist: cacheEnabledThisBoot });
  };

  onMounted(() => {
    boot();

    // Keep the local admin session state in sync across the app.
    cloudflareStore.session.onSessionChanged((user) => {
      settingsStore.user = user || {};
    });
  });
}

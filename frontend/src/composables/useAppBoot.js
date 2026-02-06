import { computed, onMounted, onUnmounted, ref } from "vue";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import {
  computeLoaderMinMs,
  LOADER_DEFAULTS,
} from "@/constants/loaderTiming.js";
import { useOverlayScrollLock } from "@/composables/useOverlayScrollLock.js";
import {
  clearProjectsCache,
  loadProjectsFromCache,
  saveProjectsToCache,
} from "@/utils/cache.js";
import { withTimeout } from "@/utils/asyncTimeout.js";

/**
 * App boot sequence.
 *
 * Contract:
 * - Hydrates stores from cache when fresh (skips network + loader).
 * - Otherwise fetches featured then full projects collection, writes caches (non-blocking).
 * - Exposes state to drive the fullscreen loader.
 */
export function useAppBoot() {
  const firebaseStore = useFirebaseStore();
  const settingsStore = useSettingsStore();

  const isBootLoading = ref(true);
  const bootError = ref("");
  const showLoader = ref(false);
  const didDecideBoot = ref(false);

  const CACHE_ENABLED = (() => {
    // Support both names (you currently have VITE_CACHE_ENABLED in .env).
    const raw = import.meta.env.VITE_CACHE_ENABLED;

    // Default: enabled unless explicitly set to false.
    return String(raw).toLowerCase() !== "false";
  })();

  const SIMULATE_BOOT_ERROR =
    String(import.meta.env.VITE_SIMULATE_BOOT_ERROR).toLowerCase() === "true";

  const CACHE_TTL_MINUTES = Number(
    import.meta.env.VITE_CACHE_TTL_MINUTES || 60
  );
  const CACHE_TTL_MS = Number.isFinite(CACHE_TTL_MINUTES)
    ? Math.max(0, CACHE_TTL_MINUTES) * 60 * 1000
    : 60 * 60 * 1000;

  const MIN_LOADER_MS = computeLoaderMinMs(LOADER_DEFAULTS);

  const isReady = computed(() => !isBootLoading.value && !bootError.value);
  const hasError = computed(() => Boolean(bootError.value));

  const boot = async () => {
    const bootStart = Date.now();

    // URL overrides for QA/debugging.
    const urlFlags = (() => {
      if (typeof window === "undefined") return { noCache: false, clearCache: false };
      const sp = new URLSearchParams(window.location.search);
      const enabled = (v) => v === "1" || v === "true" || v === "yes";
      return {
        noCache: enabled((sp.get("nocache") || "").toLowerCase()),
        clearCache: enabled((sp.get("clearcache") || "").toLowerCase()),
      };
    })();

    const cacheEnabledThisBoot = CACHE_ENABLED && !urlFlags.noCache;
    if (urlFlags.noCache) {
      console.log("[boot] nocache=1 -> bypassing projects cache read/write");
    }
    if (urlFlags.clearCache) {
      console.log("[boot] clearcache=1 -> clearing projects cache before boot");
    }

    // Prevent scrollbar/layout jitter while the loader is animating.
    // (We keep off until loader fades out OR we early-exit via fresh cache.)
    try {
      // 0) Decide whether we need loader + network boot.
      // We do this before showing the loader to avoid a brief flash.

      // Optional: force-clear cache via URL.
      if (cacheEnabledThisBoot && urlFlags.clearCache) {
        try {
          await clearProjectsCache();
          console.log("[boot] projects cache cleared via URL flag");
        } catch (e) {
          console.warn("[boot] failed to clear projects cache", e);
        }
      }

      // 1) Cache-first: avoid unnecessary network calls within TTL.
      // Controlled via VITE_CACHE_ENABLED (default true).
      if (cacheEnabledThisBoot) {
        let cacheIsFresh = false;
        try {
          const cached = await loadProjectsFromCache();
          const ageMs = cached?.updatedAt
            ? Date.now() - cached.updatedAt
            : Infinity;
          cacheIsFresh =
            Boolean(cached?.all) && ageMs >= 0 && ageMs <= CACHE_TTL_MS;

          if (cacheIsFresh) {
            settingsStore.projects = cached.all;
          }
        } catch (e) {
          // Ignore cache failures (private mode / blocked storage / etc.)
          console.warn("Projects cache unavailable:", e);
        }

        if (cacheIsFresh) {
          // Skip loader + skip network calls entirely.
          didDecideBoot.value = true;
          showLoader.value = false;
          isBootLoading.value = false;
          return;
        }
      }

      // Cache not fresh (or disabled) – we will do an actual boot, so show loader now.
      didDecideBoot.value = true;
      showLoader.value = true;

      // 2) Full fetch (fatal if fails)
      const projectsFresh = await firebaseStore.dataGetProjectsCollection();
      console.log("[boot] projects API resolved", {
        keys: projectsFresh ? Object.keys(projectsFresh).length : 0,
      });

      settingsStore.projects = projectsFresh;

      if (cacheEnabledThisBoot) {
        withTimeout(
          saveProjectsToCache(projectsFresh),
          1000,
          "Projects cache write timed out"
        ).catch((e) => {
          console.warn("Failed to persist projects cache", e);
        });
      }

      if (SIMULATE_BOOT_ERROR) {
        // Don't throw (caught locally) — set the error state directly.
        bootError.value = "[boot-test] Simulated boot error";
      }
    } catch (err) {
      console.error("App boot failed:", err);
      if (!bootError.value) {
        bootError.value =
          "Couldn’t load site content. Please refresh, or try again in a moment.";
      }
    } finally {
      const finishBoot = () => {
        // If a boot error occurred, keep the overlay visible.
        if (bootError.value) return;
        if (!isBootLoading.value) return;
        isBootLoading.value = false;
        console.log("[boot] APIs finished");
      };

      const elapsed = Date.now() - bootStart;
      const remaining = Math.max(0, MIN_LOADER_MS - elapsed);

      if (remaining > 0) setTimeout(finishBoot, remaining);
      else finishBoot();
    }
  };

  const onLoaderDone = () => {
    // If a boot error happened, we intentionally keep the overlay visible.
    if (bootError.value) return;
    showLoader.value = false;
  };

  onMounted(() => {
    // Lock scroll while loader is visible.
    // The loader emits `done` only after its fade-out completes, so this avoids
    // scrollbar/padding changes while the overlay is still on screen.
    useOverlayScrollLock(() => showLoader.value);

    boot();

    // Keep global auth state in sync so admin login persists across refresh
    // until explicit sign out or Firebase invalidation.
    firebaseStore.auth.onAuthStateChanged((user) => {
      settingsStore.user = user || {};
    });
  });

  onUnmounted(() => {
    // no-op: useOverlayScrollLock cleans up on unmount
  });

  return {
    showLoader,
    isBootLoading,
    bootError,
    isReady,
    hasError,
    onLoaderDone,
    didDecideBoot,
  };
}

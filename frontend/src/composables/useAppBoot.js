import { computed, onMounted, onUnmounted, ref } from "vue";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

import { computeLoaderMinMs, LOADER_DEFAULTS } from "@/constants/loaderTiming.js";
import {
  unlockBodyScroll,
  useScrollLock,
} from "@/composables/useScrollLock.js";
import {
  loadScrapbookFromCache,
  saveFeaturedScrapbookToCache,
  saveScrapbookToCache,
} from "@/utils/cache.js";
import { withTimeout } from "@/utils/asyncTimeout.js";

/**
 * App boot sequence.
 *
 * Contract:
 * - Hydrates stores from cache when fresh (skips network + loader).
 * - Otherwise fetches featured then full scrapbook, writes caches (non-blocking).
 * - Exposes state to drive the fullscreen loader.
 */
export function useAppBoot() {
  const firebaseStore = useFirebaseStore();
  const settingsStore = useSettingsStore();

  const isBootLoading = ref(true);
  const bootError = ref("");
  const showLoader = ref(true);

  const CACHE_ENABLED = (() => {
    // Support both names (you currently have VITE_CACHE_ENABLED in .env).
    const raw =
      import.meta.env.VITE_ENABLE_CACHE ?? import.meta.env.VITE_CACHE_ENABLED;

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

    // Prevent scrollbar/layout jitter while the loader is animating.
    // (We keep off until loader fades out OR we early-exit via fresh cache.)
    try {
      // 1) Cache-first: avoid unnecessary network calls within TTL.
      // Controlled via VITE_CACHE_ENABLED (default true).
      if (CACHE_ENABLED) {
        let cacheIsFresh = false;
        try {
          const cached = await loadScrapbookFromCache();
          const ageMs = cached?.updatedAt
            ? Date.now() - cached.updatedAt
            : Infinity;
          cacheIsFresh =
            Boolean(cached?.all) && ageMs >= 0 && ageMs <= CACHE_TTL_MS;

          if (cacheIsFresh) {
            settingsStore.scrapbook = cached.all;
            if (cached.featured) {
              settingsStore.featuredScrapbook = cached.featured;
            }
          }
        } catch (e) {
          // Ignore cache failures (private mode / blocked storage / etc.)
          console.warn("Scrapbook cache unavailable:", e);
        }

        if (cacheIsFresh) {
          // Skip loader + skip network calls entirely.
          showLoader.value = false;
          isBootLoading.value = false;
          unlockBodyScroll();
          return;
        }
      }

      // 2a) Featured-first (non-fatal)
      try {
        const featuredFresh =
          await firebaseStore.dataGetFeaturedScrapbookCollection();
        if (featuredFresh && typeof featuredFresh === "object") {
          settingsStore.featuredScrapbook = featuredFresh;
          if (CACHE_ENABLED) {
            withTimeout(
              saveFeaturedScrapbookToCache(featuredFresh),
              1000,
              "Featured scrapbook cache write timed out"
            ).catch((e) => {
              console.warn("Failed to persist featured scrapbook cache", e);
            });
          }
        }
      } catch (e) {
        console.warn("Failed to fetch featured projects", e);
      }

      // 2b) Full fetch (fatal if fails)
      const scrapbookFresh = await firebaseStore.dataGetScrapbookCollection();
      console.log("[boot] scrapbook API resolved", {
        keys: scrapbookFresh ? Object.keys(scrapbookFresh).length : 0,
      });

      settingsStore.scrapbook = scrapbookFresh;

      if (CACHE_ENABLED) {
        withTimeout(
          saveScrapbookToCache(scrapbookFresh),
          1000,
          "Scrapbook cache write timed out"
        )
          .then(({ featured }) => {
            settingsStore.featuredScrapbook = featured;
          })
          .catch((e) => {
            console.warn("Failed to persist scrapbook cache", e);
          });
      }

      if (SIMULATE_BOOT_ERROR) {
        throw new Error("[boot-test] Simulated boot error");
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
    unlockBodyScroll();
  };

  onMounted(() => {
    // Lock scroll while loader is shown.
    useScrollLock(() => showLoader.value);

    boot();

    // Keep global auth state in sync so admin login persists across refresh
    // until explicit sign out or Firebase invalidation.
    firebaseStore.auth.onAuthStateChanged((user) => {
      settingsStore.user = user || {};
    });
  });

  onUnmounted(() => {
    unlockBodyScroll();
  });

  return {
    showLoader,
    isBootLoading,
    bootError,
    isReady,
    hasError,
    onLoaderDone,
  };
}

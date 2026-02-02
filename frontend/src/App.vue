<template>
  <div class="min-h-screen w-full bg-base-background text-slate-400">
    <!-- App content mounts immediately behind the loader so there's no repaint/jump when loader disappears -->
    <div class="min-h-screen w-full">
      <admin-dropdown />

      <!-- Radial gradient overlay -->
      <div
        class="pointer-events-none fixed inset-0 z-30 transition duration-300"
        :style="{
          background: `radial-gradient(600px at ${mouseX}px ${mouseY}px, rgba(29, 78, 216, 0.05), transparent 50%)`,
        }"
      />

      <!-- Default shell: window scroll, constrained width -->
      <div
        v-if="!isFullWidthRoute"
        class="mx-auto w-full max-w-screen-xl px-6 md:px-12 lg:py-0"
      >
        <router-view />
      </div>

      <!-- Full-width routes (e.g. Resume) -->
      <div v-else class="w-full">
        <router-view />
      </div>

      <div
        aria-live="assertive"
        class="fixed inset-0 flex items-end justify-center pointer-events-none sm:justify-end z-50 p-4"
      >
        <notifications />
      </div>

      <!-- One stable overlay: stays mounted for the whole boot sequence and for bootError -->
      <fullscreen-loader
        v-if="isBootLoading || bootError"
        :is-ready="!isBootLoading && !bootError"
        :has-error="Boolean(bootError)"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useRoute } from "vue-router";

import FullscreenLoader from "@/components/shared/fullscreen-loader.vue";
import Notifications from "@/components/shared/notifications.vue";
import AdminDropdown from "@/components/shared/admin-dropdown.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { computeLoaderMinMs, LOADER_DEFAULTS } from "@/scripts/loaderTiming.js";
import { lockBodyScroll, unlockBodyScroll } from "@/scripts/scrollLock.js";
import {
  loadScrapbookFromCache,
  saveFeaturedScrapbookToCache,
  saveScrapbookToCache,
} from "@/scripts/appCaching.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();

const isBootLoading = ref(true);
const bootError = ref("");

// NOTE: Boot error simulation has been disabled.
// If you need it later, we can re-introduce it behind a build-time flag.

const MIN_LOADER_MS = computeLoaderMinMs(LOADER_DEFAULTS);

const mouseX = ref(window.innerWidth / 2); // Default to center of screen
const mouseY = ref(window.innerHeight / 2);

const updateMousePosition = (event) => {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
};

const route = useRoute();
const isFullWidthRoute = computed(() => Boolean(route.meta?.fullWidth));

onMounted(async () => {
  const bootStart = Date.now();

  // Prevent scrollbar/layout jitter while the loader is animating.
  lockBodyScroll();

  try {
    // (boot-error simulation disabled)

    window.addEventListener("mousemove", updateMousePosition);

    // 1) Fast path: hydrate from IndexedDB cache (repeat visits).
    // This lets Home render featured content quickly while fresh data loads.
    // try {
    //   const cached = await loadScrapbookFromCache();
    //   if (cached?.all) settingsStore.scrapbook = cached.all;
    //   if (cached?.featured) settingsStore.featuredScrapbook = cached.featured;
    // } catch (e) {
    //   // Ignore cache failures (private mode / blocked storage / etc.)
    //   console.warn("Scrapbook cache unavailable:", e);
    // }

    // 2) Network path (featured-first):
    //    a) Fetch the small featured-only payload for a fast Home paint.
    //    b) Fetch the full dataset after and overwrite cache.

    // 2a) Featured-first
    try {
      const featuredFresh =
        await firebaseStore.dataGetFeaturedScrapbookCollection();
      if (featuredFresh && typeof featuredFresh === "object") {
        settingsStore.featuredScrapbook = featuredFresh;
        await saveFeaturedScrapbookToCache(featuredFresh);
      }
    } catch (e) {
      // Non-fatal: we'll still attempt the full fetch.
      console.warn("Failed to fetch featured projects", e);
    }

    // 2b) Full fetch
    const scrapbookFresh = await firebaseStore.dataGetScrapbookCollection();
    settingsStore.scrapbook = scrapbookFresh;
    const { featured } = await saveScrapbookToCache(scrapbookFresh);
    settingsStore.featuredScrapbook = featured;
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
      unlockBodyScroll();
    };

    const requiredMin = MIN_LOADER_MS;
    const elapsed = Date.now() - bootStart;
    const remaining = Math.max(0, requiredMin - elapsed);

    if (remaining > 0) {
      setTimeout(finishBoot, remaining);
    } else {
      finishBoot();
    }
  }

  // Keep global auth state in sync so admin login persists across refresh
  // until explicit sign out or Firebase invalidation.
  firebaseStore.auth.onAuthStateChanged((user) => {
    settingsStore.user = user || {};
  });
});

onUnmounted(() => {
  window.removeEventListener("mousemove", updateMousePosition);
  unlockBodyScroll();
});
</script>

<style lang="scss" scoped>
/*------------- ANIMATION -------------*/

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

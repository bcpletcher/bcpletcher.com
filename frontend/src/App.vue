<template>
  <div class="min-h-screen w-full bg-base-background text-slate-400">
    <!-- App content mounts immediately behind the loader so there's no repaint/jump when loader disappears -->
    <div class="min-h-screen w-full">
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

      <!-- Loader overlays the already-mounted page -->
      <fullscreen-loader v-if="isBootLoading">
        Loading content…
      </fullscreen-loader>

      <!-- Boot error overlays content as well -->
      <fullscreen-loader v-else-if="bootError">
        {{ bootError }}
      </fullscreen-loader>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useRoute } from "vue-router";

import FullscreenLoader from "@/components/shared/fullscreen-loader.vue";
import Notifications from "@/components/shared/notifications.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { computeLoaderMinMs, LOADER_DEFAULTS } from "@/scripts/loaderTiming.js";
import { lockBodyScroll, unlockBodyScroll } from "@/scripts/scrollLock.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();

const isBootLoading = ref(true);
const bootError = ref("");

// Single source of truth: fullscreen-loader.vue uses LOADER_DEFAULTS as its prop defaults.
// If you pass custom timing props into <fullscreen-loader>, also pass the same overrides to computeLoaderMinMs.
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
    window.addEventListener("mousemove", updateMousePosition);

    // Fetch fresh data from Firestore.
    // We run these in parallel to reduce time-to-first-render.
    const [resources, scrapbook] = await Promise.all([
      firebaseStore.dataGetResourcesCollection(),
      firebaseStore.dataGetScrapbookCollection(),
    ]);

    settingsStore.resources = resources;
    settingsStore.scrapbook = scrapbook;
  } catch (err) {
    console.error("App boot failed:", err);
    bootError.value =
      "Couldn’t load site content. Please refresh, or try again in a moment.";
  } finally {
    const elapsed = Date.now() - bootStart;
    const remaining = Math.max(0, MIN_LOADER_MS - elapsed);
    if (remaining > 0) {
      setTimeout(() => {
        isBootLoading.value = false;
        unlockBodyScroll();
      }, remaining);
    } else {
      isBootLoading.value = false;
      unlockBodyScroll();
    }
  }
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

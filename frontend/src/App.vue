<template>
  <div
    v-if="isMounted"
    class="min-h-screen w-full bg-base-background text-slate-400"
  >
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
      class="mx-auto w-full max-w-screen-xl px-6 py-12 md:px-12 md:py-16 lg:py-0"
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, computed } from "vue";
import { useRoute } from "vue-router";

import Notifications from "@/components/shared/notifications.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();

const isMounted = ref(false);

const mouseX = ref(window.innerWidth / 2); // Default to center of screen
const mouseY = ref(window.innerHeight / 2);

const updateMousePosition = (event) => {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
};

const route = useRoute();
const isFullWidthRoute = computed(() => Boolean(route.meta?.fullWidth));

onMounted(async () => {
  await firebaseStore.auth.signOut();

  isMounted.value = true;
  window.addEventListener("mousemove", updateMousePosition);

  // Hydrate scrapbook from localStorage first for faster initial render
  const cachedScrapbook = localStorage.getItem("scrapbookCache");
  if (cachedScrapbook) {
    try {
      settingsStore.scrapbook = JSON.parse(cachedScrapbook);
    } catch (e) {
      console.warn("Failed to parse scrapbookCache from localStorage", e);
      localStorage.removeItem("scrapbookCache");
    }
  }

  // Always fetch fresh data from Firestore and overwrite cache
  settingsStore.resources = await firebaseStore.dataGetResourcesCollection();
  settingsStore.scrapbook = await firebaseStore.dataGetScrapbookCollection();

  // Keep scrapbook cached in localStorage whenever it changes
  watch(
    () => settingsStore.scrapbook,
    (val) => {
      if (val) {
        localStorage.setItem("scrapbookCache", JSON.stringify(val));
      } else {
        localStorage.removeItem("scrapbookCache");
      }
    },
    { deep: true, immediate: true }
  );
});

onUnmounted(() => {
  window.removeEventListener("mousemove", updateMousePosition);
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

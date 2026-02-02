<template>
  <div class="min-h-screen w-full bg-base-background text-slate-400">
    <!-- App content mounts immediately behind the loader so there's no repaint/jump when loader disappears -->
    <div class="min-h-screen w-full">
      <admin-dropdown @cleared-cache="onAdminClearedCache" />

      <!-- Emulator banner (dev visibility). Kept beneath loader. -->
      <emulator-banner
        ref="emulatorBannerRef"
        :is-using-emulator="isUsingEmulator"
      />

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
        v-if="showLoader"
        :is-ready="!isBootLoading && !bootError"
        :has-error="Boolean(bootError)"
        @done="onLoaderDone"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";

import FullscreenLoader from "@/components/shared/fullscreen-loader.vue";
import Notifications from "@/components/shared/notifications.vue";
import AdminDropdown from "@/components/shared/admin-dropdown.vue";
import EmulatorBanner from "@/components/admin/emulator-banner.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useAppBoot } from "@/composables/useAppBoot.js";

useFirebaseStore();
useSettingsStore();

const { showLoader, isBootLoading, bootError, isReady, hasError, onLoaderDone } =
  useAppBoot();

const emulatorBannerRef = ref(null);
const isUsingEmulator =
  String(import.meta.env.VITE_USE_EMULATOR).toLowerCase() === "true";

const mouseX = ref(window.innerWidth / 2); // Default to center of screen
const mouseY = ref(window.innerHeight / 2);

const updateMousePosition = (event) => {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
};

const route = useRoute();
const isFullWidthRoute = computed(() => Boolean(route.meta?.fullWidth));

onMounted(async () => {
  // Boot is handled in useAppBoot()
});

const onAdminClearedCache = () => {
  // Reset the emulator banner dismissal when clearing app cache.
  emulatorBannerRef.value?.reset?.();
};
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

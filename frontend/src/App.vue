<template>
  <div class="min-h-screen w-full bg-surface text-slate-400">
    <!-- App content mounts immediately behind the loader so there's no repaint/jump when loader disappears -->
    <div class="min-h-screen w-full">
      <admin-dropdown />
      <emulator-banner />
      <mouse-glow-overlay />
      <notifications />

      <fullscreen-loader
        v-if="didDecideBoot && showLoader"
        :is-ready="!isBootLoading && !bootError"
        :has-error="Boolean(bootError)"
        @done="onLoaderDone"
      />

      <div
        :class="
          isFullWidthRoute
            ? 'w-full'
            : 'mx-auto w-full max-w-screen-xl px-6 md:px-12 lg:py-0'
        "
      >
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";
import { useRoute } from "vue-router";

import FullscreenLoader from "@/components/shared/fullscreen-loader.vue";
import Notifications from "@/components/shared/notifications.vue";
import AdminDropdown from "@/components/shared/admin-dropdown.vue";
import MouseGlowOverlay from "@/components/shared/mouse-glow-overlay.vue";
import EmulatorBanner from "@/components/admin/emulator-banner.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useAppBoot } from "@/composables/useAppBoot.js";
import { loadFontAwesomeKit } from "@/utils/fontAwesomeKit.js";

useFirebaseStore();
useSettingsStore();

const { showLoader, isBootLoading, bootError, onLoaderDone, didDecideBoot } =
  useAppBoot();

const route = useRoute();
const isFullWidthRoute = computed(() => Boolean(route.meta?.fullWidth));

// Load Font Awesome everywhere except /resume for faster resume direct loads.
watch(
  () => route.path,
  (path) => {
    if (path === "/resume") return;
    loadFontAwesomeKit().catch(() => {
      // Non-fatal: icons may be missing if the kit fails.
    });
  },
  { immediate: true }
);
</script>

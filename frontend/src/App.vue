<template>
  <div class="min-h-screen w-full bg-slate-900 text-slate-400">
    <!-- App content mounts immediately behind the loader so there's no repaint/jump when loader disappears -->
    <div class="min-h-screen w-full">
      <AdminBanner />
      <mouse-glow-overlay />
      <notifications />
      <AdminAdminLoginModal />

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
            : 'mx-auto min-h-screen max-w-7xl px-6 py-12 font-sans md:px-12 md:py-16 lg:py-0'
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
import MouseGlowOverlay from "@/components/shared/mouse-glow-overlay.vue";
import AdminBanner from "@/components/admin/admin-banner.vue";
import AdminAdminLoginModal from "@/components/admin/admin-login-modal.vue";
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
  { immediate: true },
);
</script>

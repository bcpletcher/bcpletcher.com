<template>
  <div class="min-h-screen w-full bg-base-background text-slate-400">
    <!-- App content mounts immediately behind the loader so there's no repaint/jump when loader disappears -->
    <div class="min-h-screen w-full">
      <admin-dropdown />
      <emulator-banner />
      <mouse-glow-overlay />
      <notifications />

      <fullscreen-loader
        v-if="showLoader"
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
import { computed } from "vue";
import { useRoute } from "vue-router";

import FullscreenLoader from "@/components/shared/fullscreen-loader.vue";
import Notifications from "@/components/shared/notifications.vue";
import AdminDropdown from "@/components/shared/admin-dropdown.vue";
import MouseGlowOverlay from "@/components/shared/mouse-glow-overlay.vue";
import EmulatorBanner from "@/components/admin/emulator-banner.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useAppBoot } from "@/composables/useAppBoot.js";

useFirebaseStore();
useSettingsStore();

const { showLoader, isBootLoading, bootError, onLoaderDone } = useAppBoot();

const route = useRoute();
const isFullWidthRoute = computed(() => Boolean(route.meta?.fullWidth));
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

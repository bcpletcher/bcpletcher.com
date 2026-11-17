<template>
  <div class="min-h-screen w-full bg-slate-900 text-slate-300">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-100 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900"
      >Skip to main content</a
    >
    <div class="min-h-screen w-full">
      <AdminDock />
      <mouse-glow-overlay />
      <notifications />
      <AdminAdminLoginModal />

      <main
        id="main"
        tabindex="-1"
        class="mx-auto min-h-screen max-w-7xl px-6 py-12 font-sans md:px-12 md:py-16 lg:py-0"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import Notifications from "@/components/shared/notifications.vue";
import MouseGlowOverlay from "@/components/shared/mouse-glow-overlay.vue";
import AdminDock from "@/components/admin/admin-dock.vue";
import AdminAdminLoginModal from "@/components/admin/admin-login-modal.vue";
import { useCloudflareStore } from "@/stores/cloudflare.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useAppBoot } from "@/composables/useAppBoot.js";

useCloudflareStore();
useSettingsStore();

useAppBoot();

</script>

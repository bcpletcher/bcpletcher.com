<template>
  <div
    v-if="visible"
    class="fixed bottom-4 left-4 z-[55] flex items-start gap-3 rounded-md border border-amber-400/30 bg-amber-950/70 px-4 py-3 text-amber-100 shadow-lg backdrop-blur"
    role="status"
    aria-live="polite"
  >
    <div class="text-sm leading-snug">
      <div class="font-medium">Firebase Emulator Enabled</div>
      <div class="opacity-90">
        You’re using local emulators in this session.
      </div>
    </div>

    <button
      type="button"
      class="-mr-1 -mt-1 rounded p-1 text-amber-100/80 hover:text-amber-50 hover:bg-amber-900/40"
      aria-label="Dismiss emulator notice"
      @click="dismiss"
    >
      ✕
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings.js";

const isUsingEmulator =
  String(import.meta.env.VITE_USE_EMULATOR).toLowerCase() === "true";

const settingsStore = useSettingsStore();

const visible = computed(
  () => isUsingEmulator && Boolean(settingsStore.showEmulationBanner)
);

const dismiss = () => {
  settingsStore.showEmulationBanner = false;
};
</script>

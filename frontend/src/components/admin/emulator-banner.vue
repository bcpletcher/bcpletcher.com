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
import { computed, onMounted, ref } from "vue";

const props = defineProps({
  isUsingEmulator: { type: Boolean, default: false },
});

const EMULATOR_BANNER_KEY = "bcpletcher:hideEmulatorBanner";

const dismissed = ref(false);

const visible = computed(() => props.isUsingEmulator && !dismissed.value);

const dismiss = () => {
  dismissed.value = true;
  try {
    sessionStorage.setItem(EMULATOR_BANNER_KEY, "1");
  } catch {
    // ignore
  }
};

const reset = () => {
  dismissed.value = false;
  try {
    sessionStorage.removeItem(EMULATOR_BANNER_KEY);
  } catch {
    // ignore
  }
};

// Allows parent/admin actions to reset the banner.
defineExpose({ reset });

onMounted(() => {
  try {
    dismissed.value = sessionStorage.getItem(EMULATOR_BANNER_KEY) === "1";
  } catch {
    dismissed.value = false;
  }
});
</script>

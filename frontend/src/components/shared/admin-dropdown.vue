<template>
  <div v-if="isLoggedIn" class="fixed right-4 top-4 z-[55]">
    <div class="relative">
      <button
        class="flex items-center gap-2 rounded-full bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-sky-400"
        type="button"
        @click="toggle"
      >
        Admin
        <span class="text-slate-300" aria-hidden="true">▾</span>
      </button>

      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/90 shadow-lg backdrop-blur"
        role="menu"
        aria-label="Admin menu"
      >
        <button
          class="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800/70"
          type="button"
          role="menuitem"
          @click="logout"
        >
          Logout
        </button>

        <button
          class="block w-full px-4 py-2 text-left text-sm text-slate-100 hover:bg-slate-800/70"
          type="button"
          role="menuitem"
          @click="clearCache"
        >
          Clear Cache
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { signOut } from "firebase/auth";

import { clearAppCache } from "@/utils/cache.js";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();

const isLoggedIn = computed(() => Boolean(settingsStore.user?.uid));
const isOpen = ref(false);

const close = () => {
  isOpen.value = false;
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const logout = async () => {
  close();
  await signOut(firebaseStore.auth);
  // Defensive: ensure UI updates even if auth listener is delayed.
  settingsStore.user = {};
};

const emit = defineEmits(["cleared-cache"]);

const clearCache = async () => {
  close();
  await clearAppCache();

  settingsStore.scrapbook = null;
  settingsStore.featuredScrapbook = null;
  settingsStore.showEmulationBanner = true;

  emit("cleared-cache");
};

const onKeyDown = (e) => {
  if (!isOpen.value) return;
  if (e.key === "Escape") close();
};

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});

// Auto-close the menu when auth state disappears.
watch(isLoggedIn, (val) => {
  if (!val) close();
});
</script>

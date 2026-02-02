<template>
  <button
    v-if="isLoggedIn"
    class="fixed right-4 top-4 z-[55] rounded-full bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur transition hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-sky-400"
    type="button"
    @click="signOutNow"
  >
    Logout
  </button>
</template>

<script setup>
import { computed } from "vue";
import { signOut } from "firebase/auth";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();

const isLoggedIn = computed(() => Boolean(settingsStore.user?.uid));

const signOutNow = async () => {
  await signOut(firebaseStore.auth);
  // Defensive: ensure UI updates even if auth listener is elsewhere.
  settingsStore.user = {};
};
</script>

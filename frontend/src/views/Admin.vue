<template>
  <div
    class="flex h-full w-full"
    :class="[
      isReady ? 'opacity-100' : 'opacity-0',
      { 'pt-16': isBreakpointOrBelow('md') },
    ]"
  >
    <login v-if="!effectiveSignedIn" />
    <div v-else class="w-full flex flex-col gap-4">
      <content v-if="selectedTab === 'Content'" />
      <scrapbook v-else-if="selectedTab === 'Scrapbook'" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useBreakpoints } from "@/composables/breakpoints.js";

import Login from "@/components/admin/login.vue";
import Content from "@/pages/admin/content.vue";
import Scrapbook from "@/pages/admin/scrapbook.vue";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();
const { isBreakpointOrBelow } = useBreakpoints();

const selectedTab = ref("Scrapbook");
const isReady = ref(false);

const effectiveSignedIn = computed(() => {
  return (
    settingsStore.isSignedIn || settingsStore.isAdminSessionValid?.() || false
  );
});

onMounted(() => {
  firebaseStore.auth.onAuthStateChanged((user) => {
    if (user) {
      settingsStore.user = user;
      settingsStore.markAdminSessionActive?.();
    } else {
      settingsStore.user = {};
      settingsStore.clearAdminSession?.();
    }
    setTimeout(() => {
      isReady.value = true;
    }, 100);
  });
});
</script>

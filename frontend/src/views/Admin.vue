<template>
  <div
    class="flex h-full w-full p-4"
    :class="[
      isReady ? 'opacity-100' : 'opacity-0',
      { 'pt-16': isBreakpointOrBelow('md') },
    ]"
  >
    <login v-if="!settingsStore.isSignedIn" />
    <div v-else class="w-full flex flex-col gap-4">
      <base-layout>
        <!--        <template #header>-->
        <!--          <div class="w-full flex gap-4">-->
        <!--            <div class="flex-1">-->
        <!--              <tabs @click="tabChange($event)" />-->
        <!--            </div>-->
        <!--          </div>-->
        <!--        </template>-->
        <div class="h-full pt-4">
          <content v-if="selectedTab === 'Content'" />
          <scrapbook v-else-if="selectedTab === 'Scrapbook'" />
        </div>
      </base-layout>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useBreakpoints } from "@/composables/breakpoints.js";

import Login from "@/components/admin/login.vue";
// import Tabs from "@/components/admin/tabs.vue";
import Content from "@/pages/admin/content.vue";
import Scrapbook from "@/pages/admin/scrapbook.vue";
import BaseLayout from "@/components/shared/base-layout.vue";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();
const { isBreakpointOrBelow } = useBreakpoints();

const selectedTab = ref("Scrapbook");
const isReady = ref(false);

// const tabChange = (tab) => {
//   console.log(tab);
//   selectedTab.value = tab;
// };

onMounted(() => {
  firebaseStore.auth.onAuthStateChanged((user) => {
    if (user) {
      settingsStore.user = user;
    } else {
      settingsStore.user = {};
    }
    setTimeout(() => {
      isReady.value = true;
    }, 100);
  });
});
</script>

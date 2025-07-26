<template>
  <div
    class="flex h-full w-full mt-16 lg:mt-0"
    :class="[isReady ? 'opacity-100' : 'opacity-0']"
  >
    <base-layout :show-footer="false" :show-header="false">
      <object
        v-if="settingsStore.resources"
        class="w-full h-full"
        type="text/html"
        :data="resumeUrl"
      ></object>
    </base-layout>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import BaseLayout from "@/components/shared/base-layout.vue";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();
const isReady = ref(false);

const resumeUrl = computed(() => settingsStore.resources?.files.resume || "");

onMounted(() => {
  setTimeout(() => {
    isReady.value = true;
  }, 100);
});
</script>

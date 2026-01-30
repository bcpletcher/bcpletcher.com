<template>
  <div class="w-full min-h-screen">
    <object
      v-if="resumeUrl"
      class="w-full h-screen"
      type="text/html"
      :data="resumeUrl"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();

const resumeUrl = computed(() => settingsStore.resources?.files.resume || "");
</script>

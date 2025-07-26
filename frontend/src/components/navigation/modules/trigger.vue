<template>
  <div
    class="w-7 h-7 flex flex-col justify-between cursor-pointer transition-standard transform"
    :class="{ 'transform rotate-[-45deg]': settingsStore.expanded }"
  >
    <div
      class="bg-gradient-start rounded-sm h-1 transition-standard origin-right w-1/2 line-menu start"
      :class="{
        'transform rotate-[-90deg] translate-y-[-1.5px]':
          settingsStore.expanded,
      }"
    />
    <div class="bg-gradient-start rounded-sm h-1 transition-standard w-full" />
    <div
      class="bg-gradient-start rounded-sm h-1 transition-standard origin-left w-1/2 self-end line-menu end"
      :class="{
        'transform rotate-[-90deg] translate-y-[1.5px]': settingsStore.expanded,
      }"
    />
  </div>
</template>

<script setup>
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();
</script>

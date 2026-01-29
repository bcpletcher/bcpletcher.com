<template>
  <div
    class="flex h-full w-full mt-16 md:mt-8 lg:mt-0 pl-8"
    :class="[isReady ? 'opacity-100' : 'opacity-0']"
  >
    <base-layout :show-footer="false" :show-header="false">
      <template v-if="settingsStore.alternativeDisplay">
        <div class="max-w-[1000px] mx-auto md:py-8">
          <div class="flex flex-col gap-8 md:gap-16 pr-8">
            <scrapbook-table />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="max-w-[1000px] mx-auto md:py-8">
          <div class="flex flex-col gap-8 md:gap-16 pr-8">
            <template v-for="(item, key) in sortedScrapbook" :key="key">
              <reflection
                :reversed="key % 2 === 0"
                :hero="item.hero"
                :eyebrow="item.eyebrow"
                :title="item.title"
                :description="item.description"
                :technology="item.technology"
                :images="item.images"
                :url="item.url"
              />
            </template>
          </div>
        </div>
      </template>
    </base-layout>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import BaseLayout from "@/components/shared/base-layout.vue";
import Reflection from "@/components/scrapbook/reflection.vue";
import { useSettingsStore } from "@/stores/settings.js";
import ScrapbookTable from "@/components/scrapbook/table.vue";

const settingsStore = useSettingsStore();

const isReady = ref(false);

const sortedScrapbook = computed(() => {
  if (settingsStore.scrapbook === null) return [];
  return Object.values(settingsStore.scrapbook)
    .filter((item) => !item.deleted) // Remove items marked as deleted
    .sort((a, b) => a.order - b.order); // Sort by 'order'
});

onMounted(() => {
  setTimeout(() => {
    isReady.value = true;
  }, 100);
});
</script>

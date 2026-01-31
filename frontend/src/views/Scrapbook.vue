<template>
  <div
    class="flex h-full w-full mt-16 md:mt-8 lg:mt-0"
    :class="[isReady ? 'opacity-100' : 'opacity-0']"
  >
    <div class="w-full">
      <PageHeader title="All Projects" />

      <template v-if="settingsStore.alternativeDisplay">
        <div class="mx-auto w-full max-w-screen-xl md:py-8">
          <div class="flex flex-col gap-8 md:gap-16">
            <scrapbook-table />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="mx-auto w-full max-w-screen-xl md:py-8">
          <div class="flex flex-col gap-8 md:gap-20">
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
                @open-slideshow="openSlideshow"
              />
            </template>
          </div>
        </div>

        <SlideshowModal ref="slideshowModalRef" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import PageHeader from "@/components/shared/page-header.vue";
import Reflection from "@/components/scrapbook/reflection.vue";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import ScrapbookTable from "@/components/scrapbook/table.vue";

const settingsStore = useSettingsStore();

const isReady = ref(false);
const slideshowModalRef = ref(null);

const openSlideshow = (images) => {
  slideshowModalRef.value?.showModal({ images });
};

const sortedScrapbook = computed(() => {
  if (settingsStore.scrapbook === null) return [];
  return Object.values(settingsStore.scrapbook)
    .filter((item) => !item.deleted) // Remove items marked as deleted
    .sort((a, b) => {
      const yearA = Number(a?.year) || 0;
      const yearB = Number(b?.year) || 0;
      if (yearA !== yearB) return yearB - yearA; // Newest first

      const orderA = Number(a?.order) || 0;
      const orderB = Number(b?.order) || 0;
      if (orderA !== orderB) return orderA - orderB;

      const titleA = (a?.title || "").toString();
      const titleB = (b?.title || "").toString();
      return titleA.localeCompare(titleB);
    });
});

onMounted(() => {
  setTimeout(() => {
    isReady.value = true;
  }, 100);
});
</script>

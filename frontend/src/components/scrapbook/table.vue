<template>
  <div>
    <div class="px-4 flex gap-4 text-font-primary/80 text-left">
      <label v-if="props.isAdmin" class="font-bold py-3 w-16"> Order </label>
      <label class="font-bold py-3 w-16">Year</label>
      <label class="font-bold py-3 flex-1">Title</label>
      <template v-if="!isBreakpointOrBelow('md')">
        <label class="font-bold py-3 w-1/4"> Made At </label>
        <label class="font-bold py-3 w-1/4"> Built With </label>
      </template>
      <label class="font-bold py-3 w-14"></label>
      <label v-if="props.isAdmin" class="font-bold py-3 w-16" />
    </div>
    <VueDraggableNext
      v-model="scrapbookItems"
      :disabled="!props.isAdmin"
      @start="dragging = true"
      @end="onDragEnd"
    >
      <div
        v-for="(row, key, index) in scrapbookItems"
        :key="index"
        class="px-4 flex gap-4 text-left transition-standard"
        :class="{ 'hover:bg-gradient-start/10': !dragging }"
      >
        <label
          v-if="props.isAdmin"
          class="my-auto py-3 font-bold text-font-primary/80 w-16"
        >
          {{ row.order }}
        </label>
        <label class="my-auto py-3 font-bold text-font-secondary w-16">
          {{ row.year }}
        </label>
        <label class="my-auto py-3 font-bold text-font-primary flex-1">
          {{ row.title }}
        </label>
        <template v-if="!isBreakpointOrBelow('md')">
          <label class="my-auto py-3 text-font-primary/80 w-1/4">
            {{ row.eyebrow }}
          </label>
          <label class="my-auto py-3 text-font-primary/80 w-1/4">
            {{ row.technology.join(", ") }}
          </label>
        </template>
        <div class="flex gap-4 my-auto py-3 w-14">
          <button
            class="text-font-primary/80 hover:text-gradient-start transition-standard"
            @click="showSlideshowModal(row)"
          >
            <i class="fa-regular fa-images"></i>
          </button>
          <a
            v-if="row.url"
            :href="row.url"
            target="_blank"
            class="text-font-primary/80 hover:text-gradient-start transition-standard"
          >
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
        <template v-if="props.isAdmin">
          <td class="my-auto py-3 w-16">
            <slot />
          </td>
        </template>
      </div>
    </VueDraggableNext>
    <SlideshowModal ref="slideshowModalRef" />
  </div>
</template>

<script setup>
import { onMounted, ref, useTemplateRef, watch } from "vue";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useFirebaseStore } from "@/stores/firebase.js";

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
import { useBreakpoints } from "@/composables/breakpoints.js";
const { isBreakpointOrBelow } = useBreakpoints();

import { VueDraggableNext } from "vue-draggable-next";

const slideshowModalRef = useTemplateRef("slideshowModalRef");
const dragging = ref(false);
const props = defineProps({
  isAdmin: { type: Boolean, default: false },
});

const scrapbookItems = ref([]);

watch(
  () => settingsStore.scrapbook,
  () => {
    if (!settingsStore.scrapbook) {
      scrapbookItems.value = [];
    } else {
      scrapbookItems.value = Object.entries(settingsStore.scrapbook)
        .filter(([item]) => !item.deleted) // Remove items marked as deleted
        .map(([name, item]) => ({ name, ...item })); // Map to preserve the name

      // Sorting logic based on whether the user is admin or not
      if (props.isAdmin) {
        scrapbookItems.value.sort((a, b) => a.order - b.order); // Sort by order
      } else {
        scrapbookItems.value.sort((a, b) => {
          const yearComparison = b.year - a.year; // Sort by year (newest first)
          if (yearComparison !== 0) {
            return yearComparison;
          }
          return a.order - b.order; // Then sort by order
        });
      }
    }
  },
  { immediate: true, deep: true }
);

const onDragEnd = async () => {
  dragging.value = false;

  scrapbookItems.value.forEach((item, index) => {
    item.order = index + 1; // Update the order, assuming 1-based indexing
  });

  settingsStore.scrapbook = getUpdatedScrapbookObject();
  await firebaseStore.dataUpdateScrapbookDocumentOrder(settingsStore.scrapbook);
};

// Function to generate an object from the array
const getUpdatedScrapbookObject = () => {
  return scrapbookItems.value.reduce((obj, { name, ...item }) => {
    obj[name] = item; // Use the name as the key
    return obj;
  }, {});
};

const showSlideshowModal = (row) => {
  slideshowModalRef.value.showModal({
    images: row.images,
    summary: row.summary,
  });
};
onMounted(() => {});
</script>

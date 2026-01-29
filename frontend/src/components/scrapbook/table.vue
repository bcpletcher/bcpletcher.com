<template>
  <div>
    <div class="px-4 flex gap-4 text-font-primary/80 text-left">
      <label v-if="props.isAdmin" class="font-bold py-3 w-6"></label>
      <label class="font-bold py-3 w-16">Year</label>
      <label class="font-bold py-3 flex-1">Title</label>
      <label v-if="!isBreakpointOrBelow('md')" class="font-bold py-3 w-1/4">
        Made At
      </label>
      <label
        v-if="!isBreakpointOrBelow('md') && !props.isAdmin"
        class="font-bold py-3 w-1/4"
      >
        Built With
      </label>
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
        v-for="(row, index) in scrapbookItems"
        :key="index"
        class="px-4 flex gap-4 text-left transition-standard items-stretch"
        :class="[
          { 'hover:bg-gradient-start/10': !dragging },
          props.isAdmin
            ? 'rounded-lg border border-base-border/40 mb-1 bg-black/10'
            : '',
        ]"
      >
        <!-- Drag handle (admin only) -->
        <div
          v-if="props.isAdmin"
          class="w-6 my-auto py-3 flex items-center justify-center cursor-move text-font-primary/60"
        >
          <i class="fa-solid fa-grip-vertical text-xs"></i>
        </div>
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
        </template>
        <template v-if="!isBreakpointOrBelow('md') && !props.isAdmin">
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
            <slot :row="row" :index="index" />
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
      scrapbookItems.value = Object.entries(settingsStore.scrapbook).map(
        ([name, item]) => ({ name, ...item })
      ); // Preserve all items, including deleted

      if (props.isAdmin) {
        // Admin view: active items first by order, then deleted ones by year desc, then order
        scrapbookItems.value.sort((a, b) => {
          const aDeleted = !!a.deleted;
          const bDeleted = !!b.deleted;

          if (aDeleted !== bDeleted) {
            return aDeleted - bDeleted; // false (0) before true (1)
          }

          if (!aDeleted && !bDeleted) {
            // Both active: sort by order
            return (a.order || 0) - (b.order || 0);
          }

          // Both deleted: newest year first, then order
          const yearComparison = (b.year || 0) - (a.year || 0);
          if (yearComparison !== 0) {
            return yearComparison;
          }
          return (a.order || 0) - (b.order || 0);
        });
      } else {
        // Public view: ignore deleted, same behavior as before
        scrapbookItems.value = scrapbookItems.value
          .filter((item) => !item.deleted)
          .sort((a, b) => {
            const yearComparison = (b.year || 0) - (a.year || 0); // Sort by year (newest first)
            if (yearComparison !== 0) {
              return yearComparison;
            }
            return (a.order || 0) - (b.order || 0); // Then sort by order
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
  // Persist updated order to localStorage cache as well
  if (settingsStore.scrapbook) {
    localStorage.setItem(
      "scrapbookCache",
      JSON.stringify(settingsStore.scrapbook)
    );
  }
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
  });
};
onMounted(() => {});
</script>

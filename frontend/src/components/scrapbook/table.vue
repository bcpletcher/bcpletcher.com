<template>
  <div>
    <div class="px-4 flex gap-4 text-font-primary/80 text-left">
      <template v-for="col in visibleColumns" :key="col.key">
        <label
          v-if="col.type === 'header'"
          class="font-bold py-3"
          :class="col.widthClass"
        >
          {{ col.label }}
        </label>
        <label
          v-else-if="col.type === 'spacer'"
          class="font-bold py-3"
          :class="col.widthClass"
        />
      </template>
    </div>

    <ScrapbookTableRow
      v-for="(row, index) in scrapbookItems"
      :key="row.name || index"
      :row="row"
      :index="index"
      :is-admin="false"
      :is-mobile="isBreakpointOrBelow('md')"
      :is-dragging="false"
      :columns="visibleColumns"
      @show-slideshow="showSlideshowModal"
    />

    <SlideshowModal ref="slideshowModalRef" />
  </div>
</template>

<script setup>
import { computed, ref, useTemplateRef, watch } from "vue";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useBreakpoints } from "@/composables/breakpoints.js";
import ScrapbookTableRow from "@/components/scrapbook/table-row.vue";

const settingsStore = useSettingsStore();
const { isBreakpointOrBelow } = useBreakpoints();
const slideshowModalRef = useTemplateRef("slideshowModalRef");

const scrapbookItems = ref([]);

watch(
  () => settingsStore.scrapbook,
  () => {
    if (!settingsStore.scrapbook) {
      scrapbookItems.value = [];
      return;
    }

    scrapbookItems.value = Object.entries(settingsStore.scrapbook)
      .map(([name, item]) => ({ name, ...item }))
      .filter((item) => !item.deleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  { immediate: true }
);

const visibleColumns = computed(() => {
  // Keep the existing public columns used by ScrapbookTableRow.
  return [
    { key: "year", label: "Year", type: "header", widthClass: "w-[70px]" },
    { key: "title", label: "Project", type: "header", widthClass: "flex-1" },
    {
      key: "technology",
      label: "Tech",
      type: "header",
      widthClass: "w-[120px]",
    },
    { key: "actions", label: "", type: "spacer", widthClass: "w-[40px]" },
  ];
});

function showSlideshowModal(images) {
  slideshowModalRef?.value?.open?.(images);
}
</script>

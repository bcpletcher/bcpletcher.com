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

    <div>
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
    </div>

    <SlideshowModal ref="slideshowModalRef" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useBreakpoints } from "@/composables/breakpoints.js";
import ScrapbookTableRow from "@/components/scrapbook/table-row.vue";

const settingsStore = useSettingsStore();
const { isBreakpointOrBelow } = useBreakpoints();
const slideshowModalRef = useTemplateRef("slideshowModalRef");

const scrapbookItems = ref([]);

const sortPublic = (a, b) => {
  const yearA = Number(a?.year) || 0;
  const yearB = Number(b?.year) || 0;
  if (yearA !== yearB) return yearB - yearA;
  return (a?.title || "").toString().localeCompare((b?.title || "").toString());
};

watch(
  () => settingsStore.scrapbook,
  () => {
    if (!settingsStore.scrapbook) {
      scrapbookItems.value = [];
      return;
    }

    const all = Object.entries(settingsStore.scrapbook).map(([name, item]) => ({
      name,
      ...item,
    }));

    scrapbookItems.value = all
      .filter((item) => !item.deleted)
      // Some documents may not have disabled yet; default false
      .filter((item) => !item.disabled)
      .sort(sortPublic);
  },
  { immediate: true, deep: true }
);

const showSlideshowModal = (row) => {
  slideshowModalRef.value.showModal({
    images: row.images,
  });
};

onMounted(() => {});

const baseColumns = computed(() => {
  const isMobile = isBreakpointOrBelow("md");

  const cols = [];

  cols.push({
    key: "year",
    type: "header",
    label: "Year",
    widthClass: "w-16",
  });

  cols.push({
    key: "title",
    type: "header",
    label: "Title",
    widthClass: "flex-1",
  });

  if (!isMobile) {
    cols.push({
      key: "eyebrow",
      type: "header",
      label: "Made At",
      widthClass: "w-1/4",
    });

    cols.push({
      key: "technology",
      type: "header",
      label: "Built With",
      widthClass: "w-1/4",
    });
  }

  cols.push({
    key: "actions",
    type: "spacer",
    widthClass: "w-14",
  });

  return cols;
});

const visibleColumns = computed(() => baseColumns.value);
</script>

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

    <!-- Featured (draggable within group) -->
    <div
      class="px-4 pt-4 pb-2 text-xs font-semibold tracking-widest uppercase text-slate-500"
    >
      Featured
    </div>
    <VueDraggableNext
      v-model="featuredItems"
      :disabled="false"
      :move="onMoveFeatured"
      @start="dragging = true"
      @end="onDragEndFeatured"
    >
      <ScrapbookTableRow
        v-for="(row, index) in featuredItems"
        :key="row.name || index"
        :row="row"
        :index="index"
        :is-admin="true"
        :is-mobile="isBreakpointOrBelow('md')"
        :is-dragging="dragging"
        :columns="visibleColumns"
        :show-featured-outline="false"
        :show-drag-handle="true"
        @show-slideshow="showSlideshowModal"
      >
        <template #admin-actions="slotProps">
          <slot :row="slotProps.row" :index="slotProps.index" />
        </template>
      </ScrapbookTableRow>
    </VueDraggableNext>

    <!-- Normal (featured appear here too, but disabled) -->
    <div
      class="px-4 pt-8 pb-2 text-xs font-semibold tracking-widest uppercase text-slate-500"
    >
      Normal
    </div>
    <div>
      <ScrapbookTableRow
        v-for="(row, index) in normalItems"
        :key="row.name || index"
        :row="row"
        :index="index"
        :is-admin="true"
        :is-mobile="isBreakpointOrBelow('md')"
        :is-dragging="dragging"
        :columns="visibleColumns"
        :is-disabled="!!row.featured"
        :show-drag-handle="false"
        :show-actions="!row.featured"
        @show-slideshow="showSlideshowModal"
      >
        <template #admin-actions="slotProps">
          <slot :row="slotProps.row" :index="slotProps.index" />
        </template>
      </ScrapbookTableRow>
    </div>

    <!-- Deleted (not draggable) -->
    <div
      class="px-4 pt-8 pb-2 text-xs font-semibold tracking-widest uppercase text-slate-500"
    >
      Deleted
    </div>
    <div>
      <ScrapbookTableRow
        v-for="(row, index) in deletedItems"
        :key="row.name || index"
        :row="row"
        :index="index"
        :is-admin="true"
        :is-mobile="isBreakpointOrBelow('md')"
        :is-dragging="dragging"
        :columns="visibleColumns"
        :show-drag-handle="false"
        @show-slideshow="showSlideshowModal"
      >
        <template #admin-actions="slotProps">
          <slot :row="slotProps.row" :index="slotProps.index" />
        </template>
      </ScrapbookTableRow>
    </div>

    <SlideshowModal ref="slideshowModalRef" />
  </div>
</template>

<script setup>
import { computed, ref, useTemplateRef, watch } from "vue";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useBreakpoints } from "@/composables/useBreakpoints.js";
import { VueDraggableNext } from "vue-draggable-next";
import ScrapbookTableRow from "@/components/scrapbook/table-row.vue";
import { saveScrapbookToCache } from "@/utils/cache.js";

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
const { isBreakpointOrBelow } = useBreakpoints();

const slideshowModalRef = useTemplateRef("slideshowModalRef");
const dragging = ref(false);

const featuredItems = ref([]);
const normalItems = ref([]);
const deletedItems = ref([]);

const sortNormal = (a, b) => {
  const yearA = Number(a?.year) || 0;
  const yearB = Number(b?.year) || 0;
  if (yearA !== yearB) return yearB - yearA;
  return (a?.title || "").toString().localeCompare((b?.title || "").toString());
};

const sortDeleted = (a, b) => {
  const yearA = Number(a?.year) || 0;
  const yearB = Number(b?.year) || 0;
  if (yearA !== yearB) return yearB - yearA;
  return (a?.title || "").toString().localeCompare((b?.title || "").toString());
};

watch(
  () => settingsStore.scrapbook,
  () => {
    if (!settingsStore.scrapbook) {
      featuredItems.value = [];
      normalItems.value = [];
      deletedItems.value = [];
      return;
    }

    const all = Object.entries(settingsStore.scrapbook).map(([name, item]) => ({
      name,
      ...item,
    }));

    const active = all.filter((i) => !i.deleted);

    deletedItems.value = all.filter((i) => !!i.deleted).sort(sortDeleted);

    featuredItems.value = active
      .filter((i) => !!i.featured)
      .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));

    // Normal includes ALL active items (including featured as disabled shadow rows)
    normalItems.value = [...active].sort(sortNormal);
  },
  { immediate: true, deep: true }
);

const getUpdatedScrapbookObject = (allRows) => {
  return allRows.reduce((obj, { name, ...item }) => {
    obj[name] = item;
    return obj;
  }, {});
};

const onDragEndFeatured = async () => {
  dragging.value = false;

  // Only Featured items get a meaningful order.
  featuredItems.value.forEach((item, index) => {
    item.order = index + 1;
  });

  // Persist: featured + non-featured active + deleted
  const merged = [
    ...featuredItems.value,
    ...normalItems.value.filter((i) => !i.featured),
    ...deletedItems.value,
  ];
  settingsStore.scrapbook = getUpdatedScrapbookObject(merged);

  // Keep IndexedDB cache in sync with admin changes.
  try {
    const { featured } = await saveScrapbookToCache(settingsStore.scrapbook);
    settingsStore.featuredScrapbook = featured;
  } catch (e) {
    console.warn("Failed to update scrapbook cache", e);
  }

  await firebaseStore.dataUpdateScrapbookDocumentOrder(settingsStore.scrapbook);
};

const onMoveFeatured = (evt) => {
  const dragged = evt.draggedContext?.element;
  const related = evt.relatedContext?.element;

  return (
    !!dragged?.featured &&
    !dragged?.deleted &&
    (related ? !!related?.featured && !related?.deleted : true)
  );
};

const showSlideshowModal = (row) => {
  slideshowModalRef.value.showModal({
    images: row.images,
  });
};

const baseColumns = computed(() => {
  const isMobile = isBreakpointOrBelow("md");

  const cols = [];

  cols.push({ key: "drag", type: "spacer", widthClass: "w-6" });

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
      widthClass: "flex-1",
    });
  }

  cols.push({
    key: "actions",
    type: "spacer",
    widthClass: "w-28",
  });

  return cols;
});

const visibleColumns = computed(() => baseColumns.value);
</script>

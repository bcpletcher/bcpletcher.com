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
    <VueDraggableNext
      v-model="scrapbookItems"
      :disabled="!props.isAdmin"
      :move="onMove"
      @start="dragging = true"
      @end="onDragEnd"
    >
      <ScrapbookTableRow
        v-for="(row, index) in scrapbookItems"
        :key="row.name || index"
        :row="row"
        :index="index"
        :is-admin="props.isAdmin"
        :is-mobile="isBreakpointOrBelow('md')"
        :is-dragging="dragging"
        :columns="visibleColumns"
        @show-slideshow="showSlideshowModal"
      >
        <template #admin-actions="slotProps">
          <slot :row="slotProps.row" :index="slotProps.index" />
        </template>
      </ScrapbookTableRow>
    </VueDraggableNext>
    <SlideshowModal ref="slideshowModalRef" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useBreakpoints } from "@/composables/breakpoints.js";
import { VueDraggableNext } from "vue-draggable-next";
import ScrapbookTableRow from "@/components/scrapbook/table-row.vue";

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
const { isBreakpointOrBelow } = useBreakpoints();
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

// Column configuration shared by header and rows
const baseColumns = computed(() => {
  const isAdmin = props.isAdmin;
  const isMobile = isBreakpointOrBelow("md");

  const cols = [];

  if (isAdmin) {
    cols.push({ key: "drag", type: "spacer", widthClass: "w-6" });
  }

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
      widthClass: isAdmin ? "flex-1" : "w-1/4",
    });

    if (!isAdmin) {
      cols.push({
        key: "technology",
        type: "header",
        label: "Built With",
        widthClass: "w-1/4",
      });
    }
  }

  // Single actions column for both public and admin
  cols.push({
    key: "actions",
    type: "spacer",
    widthClass: isAdmin ? "w-28" : "w-14",
  });

  return cols;
});

const visibleColumns = computed(() => baseColumns.value);

const onMove = (evt) => {
  const dragged = evt.draggedContext?.element;
  return props.isAdmin && !dragged?.deleted;
};
</script>

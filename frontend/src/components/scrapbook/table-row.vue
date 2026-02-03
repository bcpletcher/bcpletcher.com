<template>
  <div
    class="px-4 flex gap-4 text-left transition-standard items-stretch"
    :class="rowClasses"
  >
    <template v-for="col in columns" :key="col.key">
      <!-- Drag handle column (admin only) -->
      <div
        v-if="col.key === 'drag' && isAdmin"
        class="my-auto py-3 flex items-center justify-center"
        :class="col.widthClass"
      >
        <i
          v-if="showDragHandle && !row.deleted"
          class="fa-solid fa-grip-vertical text-xs cursor-move text-font-primary/60"
        ></i>
      </div>

      <!-- Year -->
      <label
        v-else-if="col.key === 'year'"
        class="my-auto py-3 font-bold text-accent"
        :class="col.widthClass"
      >
        {{ row.year }}
      </label>

      <!-- Title -->
      <label
        v-else-if="col.key === 'title'"
        class="my-auto py-3 font-bold text-font-primary flex items-center gap-2"
        :class="col.widthClass"
      >
        <span>{{ row.title }}</span>
      </label>

      <!-- Eyebrow / company -->
      <label
        v-else-if="col.key === 'eyebrow' && !isMobile"
        class="my-auto py-3 text-font-primary/80"
        :class="col.widthClass"
      >
        {{ row.eyebrow }}
      </label>

      <!-- Technology (public view only) -->
      <label
        v-else-if="col.key === 'technology' && !isMobile && !isAdmin"
        class="my-auto py-3 text-font-primary/80"
        :class="col.widthClass"
      >
        {{ row.technology?.join(", ") }}
      </label>

      <div
        v-else-if="col.key === 'actions'"
        class="flex gap-4 my-auto py-3 items-center"
        :class="col.widthClass"
      >
        <template v-if="showActions">
          <button
            v-if="showSlideshowAction"
            class="text-font-primary/80 hover:text-font-primary transition-standard"
            @click="emit('show-slideshow', row)"
          >
            <i class="fa-regular fa-images"></i>
          </button>

          <!-- Reserve space for external link icon even if url is missing -->
          <span
            v-if="showExternalLinkAction"
            class="inline-flex w-4 justify-center"
          >
            <a
              v-if="row.url"
              :href="row.url"
              target="_blank"
              class="text-font-primary/80 hover:text-font-primary transition-standard"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </span>

          <template v-if="isAdmin && showAdminActions">
            <slot name="admin-actions" :row="row" :index="index" />
          </template>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";

const emit = defineEmits(["show-slideshow"]);

const props = defineProps({
  row: { type: Object, required: true },
  index: { type: Number, required: true },
  isAdmin: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false },
  columns: { type: Array, default: () => [] },
  isDisabled: { type: Boolean, default: false },
  showFeaturedOutline: { type: Boolean, default: true },
  showDragHandle: { type: Boolean, default: true },
  showActions: { type: Boolean, default: true },
  showSlideshowAction: { type: Boolean, default: true },
  showExternalLinkAction: { type: Boolean, default: true },
  showAdminActions: { type: Boolean, default: true },
});

const rowClasses = computed(() => {
  const classes = [];
  const isFeatured = !!props.row.featured;

  if (!props.isDragging) {
    classes.push("hover:bg-gradient-start/10");
  }

  if (props.isAdmin) {
    classes.push("rounded-lg border mb-1");

    // Base border
    if (props.showFeaturedOutline && isFeatured && !props.row.deleted) {
      classes.push("border-yellow-400/60 ring-1 ring-yellow-400/30");
    } else {
      classes.push("border-border/40");
    }

    if (props.row.deleted) {
      classes.push("bg-red-500/10");
    } else {
      classes.push("bg-black/10");
    }

    if (props.isDisabled) {
      classes.push("opacity-60");
      classes.push("pointer-events-none");
    }
  }

  return classes;
});
</script>

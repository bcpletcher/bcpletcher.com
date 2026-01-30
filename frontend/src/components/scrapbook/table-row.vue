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
          v-if="!row.deleted"
          class="fa-solid fa-grip-vertical text-xs cursor-move text-font-primary/60"
        ></i>
      </div>

      <!-- Year -->
      <label
        v-else-if="col.key === 'year'"
        class="my-auto py-3 font-bold text-font-secondary"
        :class="col.widthClass"
      >
        {{ row.year }}
      </label>

      <!-- Title -->
      <label
        v-else-if="col.key === 'title'"
        class="my-auto py-3 font-bold text-font-primary"
        :class="col.widthClass"
      >
        {{ row.title }}
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
        <button
          class="text-font-primary/80 hover:text-font-primary transition-standard"
          @click="emit('show-slideshow', row)"
        >
          <i class="fa-regular fa-images"></i>
        </button>
        <!-- Reserve space for external link icon even if url is missing -->
        <span class="inline-flex w-4 justify-center">
          <a
            v-if="row.url"
            :href="row.url"
            target="_blank"
            class="text-font-primary/80 hover:text-font-primary transition-standard"
          >
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </span>
        <template v-if="isAdmin">
          <slot name="admin-actions" :row="row" :index="index" />
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
});

const rowClasses = computed(() => {
  const classes = [];
  if (!props.isDragging) {
    classes.push("hover:bg-gradient-start/10");
  }
  if (props.isAdmin) {
    classes.push("rounded-lg border border-base-border/40 mb-1");
    if (props.row.deleted) {
      classes.push("bg-red-500/10");
    } else {
      classes.push("bg-black/10");
    }
  }
  return classes;
});
</script>

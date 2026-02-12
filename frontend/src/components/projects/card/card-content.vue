<template>
  <div
    class="relative z-20 transition-standard md:col-span-7 md:order-1"
    :class="[
      isHidden ? 'opacity-40' : '',
      isHidden ? 'pointer-events-none select-none' : '',
    ]"
    :aria-disabled="isHidden || undefined"
  >
    <div class="flex flex-col justify-center">
      <div v-if="showTitle" class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <a
            v-if="href && showLink"
            :href="isHidden ? undefined : href"
            :tabindex="isHidden ? -1 : undefined"
            :aria-disabled="isHidden || undefined"
            target="_blank"
            rel="noreferrer noopener"
            class="kbd-focus group/title inline-flex min-w-0 items-start gap-2 text-slate-200 transition-colors motion-reduce:transition-none hover:text-sky-300 focus-visible:text-sky-300"
            :class="isHidden ? 'cursor-default' : ''"
            :aria-label="`${title} (opens in a new tab)`"
          >
            <h3 class="min-w-0 font-medium leading-snug wrap-break-word">
              {{ title }}
            </h3>
            <i
              class="fa-light fa-arrow-up-right mt-0.5 inline-block h-4 w-4 shrink-0 text-current transition-transform motion-reduce:transition-none group-hover/title:-translate-y-0.5 group-hover/title:translate-x-0.5 group-focus-visible/title:-translate-y-0.5 group-focus-visible/title:translate-x-0.5"
              aria-hidden="true"
            />
          </a>

          <h3
            v-else
            class="min-w-0 font-medium leading-snug text-slate-200 wrap-break-word"
          >
            {{ title }}
          </h3>
        </div>

        <span
          v-if="date && showDate"
          class="shrink-0 pt-0.5 text-xs font-semibold tracking-widest text-slate-400"
        >
          {{ date }}
        </span>
      </div>

      <!-- Let only the description panel overlap further into the image column -->
      <div
        v-if="summary && showSummary"
        class="z-4 mt-3 rounded md:bg-slate-950/75 md:border md:border-slate-700 md:p-6 md:backdrop-blur md:-mr-16"
      >
        <p class="text-sm leading-normal">
          {{ summary }}
        </p>
      </div>

      <div
        v-if="showTechnology && sortedTechnology?.length"
        class="mt-2 flex flex-wrap"
        aria-label="Technologies used"
      >
        <div v-for="tag in sortedTechnology" :key="tag" class="mr-1.5 mt-2">
          <div
            class="flex items-center rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium leading-5 text-sky-300"
          >
            {{ tag }}
          </div>
        </div>
      </div>

      <!-- Meta row (bottom) -->
      <template v-if="showFeatured && featured">
        <div class="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <i class="fa-solid fa-star text-yellow-300/60" aria-hidden="true" />
          <span>Featured</span>
        </div>
      </template>

      <div
        v-if="showMeta && meta?.label"
        class="mt-3 flex items-center gap-2 text-xs text-slate-400"
      >
        <i v-if="meta?.iconClass" :class="meta.iconClass" aria-hidden="true" />
        <span v-else class="sr-only">Meta</span>
        <span>{{ meta.label }}</span>
      </div>

      <div v-if="isHidden" class="mt-4 flex items-center gap-3">
        <button
          type="button"
          class="kbd-focus inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-slate-300 hover:text-sky-300 focus-visible:text-sky-300 transition-standard md:hidden"
          :tabindex="-1"
          @click="onOpenGallery(0)"
        >
          <i class="fa-light fa-images" aria-hidden="true" />
          <span>View Gallery</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: "" },
  date: { type: String, default: null },

  href: { type: String, default: null },
  technology: { type: Array, default: () => [] },
  featured: { type: Boolean, default: false },
  meta: { type: Object, default: null },

  // Visibility controls
  showTitle: { type: Boolean, default: true },
  showDate: { type: Boolean, default: true },
  showLink: { type: Boolean, default: true },
  showSummary: { type: Boolean, default: true },
  showTechnology: { type: Boolean, default: true },
  showFeatured: { type: Boolean, default: true },
  showMeta: { type: Boolean, default: true },

  isHidden: { type: Boolean, default: false },
});

const emit = defineEmits(["open-gallery"]);

const sortedTechnology = computed(() => {
  const arr = Array.isArray(props.technology) ? props.technology : [];

  return arr
    .filter((t) => (t ?? "").toString().trim())
    .map((t) => (t ?? "").toString().trim())
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
});

function onOpenGallery(index) {
  emit("open-gallery", index);
}
</script>

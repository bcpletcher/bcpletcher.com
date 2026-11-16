<template>
  <CardWrapper
    :href="href"
    :aria-label="ariaLabel"
    :is-last="isLast"
    :grid-cols-class="
      stacked ? 'grid-cols-1' : 'sm:grid-cols-8 sm:gap-6 md:gap-5'
    "
    @open-gallery="onOpenGallery"
  >
    <!-- Image -->
    <div class="z-10" :class="stacked ? 'mb-5' : 'mb-4 sm:col-span-3 sm:mb-0'">
      <div
        class="overflow-hidden rounded-md border border-white/10 bg-white/5 transition-colors duration-300 motion-reduce:transition-none lg:group-hover:border-sky-300/30 lg:group-focus-within:border-sky-300/30"
        :class="stacked ? '' : 'sm:mt-1'"
      >
        <!-- Zoom lives on a wrapper: v-img-fade owns the <img> transition. -->
        <div
          class="transition-transform duration-500 ease-out motion-reduce:transition-none motion-safe:lg:group-hover:scale-[1.03] motion-safe:lg:group-focus-within:scale-[1.03]"
        >
          <img
            v-img-fade
            class="aspect-video w-full object-cover"
            :src="img.src"
            :srcset="img.srcset || undefined"
            :sizes="sizes"
            :alt="imageAlt"
            width="1280"
            height="720"
            :loading="priority ? 'eager' : 'lazy'"
            :fetchpriority="priority ? 'high' : undefined"
            decoding="async"
            @error="fallbackToOriginalImage"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="z-10" :class="stacked ? '' : 'sm:col-span-5'">
      <div class="flex items-start justify-between gap-4">
        <h3
          class="min-w-0 font-semibold leading-snug text-slate-100 transition-colors wrap-break-word lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300"
          :class="titleClass"
        >
          {{ projectName }}
        </h3>

        <!-- If there is an external url, show the "open in new" icon. -->
        <AppIcon
          v-if="href"
          icon="fa-light fa-arrow-up-right" :class="[
            'ml-1 mt-1 inline-block h-4 w-4 shrink-0',
            'text-slate-200 transition-[transform,color] motion-reduce:transition-none',
            'lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300',
            'lg:group-hover:-translate-y-1 lg:group-hover:translate-x-1',
            'lg:group-focus-within:-translate-y-1 lg:group-focus-within:translate-x-1',
          ]"
          aria-hidden="true"
        />

        <!-- If there is NO url, show a gallery icon button (always visible). -->
        <button
          v-else
          type="button"
          :class="[
            // Keep baseline/size 1:1 with the external-link icon
            'ml-1 mt-1 inline-block h-4 w-4 shrink-0',
            'text-slate-200 transition-[color] motion-reduce:transition-none',
            'lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300',
            // button-specific
            'kbd-focus cursor-pointer',
          ]"
          aria-label="Open gallery"
          @click.stop.prevent="onOpenGallery(0)"
        >
          <AppIcon
            icon="fa-light fa-images" class="gallery-icon-wiggle leading-none"
            aria-hidden="true"
          />
        </button>
      </div>

      <p v-if="summary" class="mt-2 text-sm leading-relaxed text-slate-400">
        {{ summary }}
      </p>

      <TechTags :items="technology" class="mt-4" />

      <div
        v-if="metaDisplay?.label"
        class="mt-3 flex items-center gap-2 text-xs text-slate-400"
      >
        <AppIcon v-if="metaDisplay?.iconClass" :icon="metaDisplay.iconClass" />
        <AppIcon v-else icon="fa-light fa-star" aria-hidden="true" />
        {{ metaDisplay.label }}
      </div>
    </div>
  </CardWrapper>
</template>

<script setup>
import CardWrapper from "@/components/home/content/card-wrapper.vue";
import TechTags from "@/components/shared/tech-tags.vue";
import { computed } from "vue";
import {
  buildResponsiveImageSourcesFromImageValue,
  fallbackToOriginalImage,
} from "@/utils/mediaStorageImages.js";
import { PROJECT_META_OPTIONS } from "@/constants/projectMetaIconOptions.js";

const emit = defineEmits(["open-gallery"]);

const props = defineProps({
  projectName: { type: String, required: true },
  summary: { type: String, default: "" },
  hero: { type: [String, Object], required: true },
  href: { type: String, default: null },
  technology: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: "Project (opens in a new tab)" },
  imageAlt: { type: String, default: "Project screenshot" },
  // Canonical project data stores `meta` as a preset key string.
  meta: { type: [String, null], default: null },
  isLast: { type: Boolean, default: false },
  // First visible card: load its image eagerly so it isn't waiting on lazy-load.
  priority: { type: Boolean, default: false },

  // "row": compact card, image beside the text from sm up.
  // "stacked": image-led card, large screenshot above the text ("Selected work").
  layout: {
    type: String,
    default: "row",
    validator: (v) => ["row", "stacked"].includes(v),
  },
  // Stacked only: the card spans the full column (bigger title, bigger image).
  lead: { type: Boolean, default: false },

  // Needed to open the modal when there is no external URL
  images: { type: Array, default: () => [] },
});

const stacked = computed(() => props.layout === "stacked");

const titleClass = computed(() => {
  if (!stacked.value) return "text-base";
  return props.lead ? "text-lg sm:text-xl" : "text-lg";
});

// Rendered image width per layout, so the browser picks the smallest sufficient candidate.
const sizes = computed(() => {
  if (!stacked.value) return "(min-width: 640px) 16rem, 100vw";
  if (props.lead) return "(min-width: 1024px) 38rem, 100vw";
  return "(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw";
});

const metaDisplay = computed(() => {
  const key = (props.meta ?? "").toString().trim();
  if (!key) return null;
  return PROJECT_META_OPTIONS?.[key] || null;
});

function onOpenGallery(index = 0) {
  const list = Array.isArray(props.images) ? props.images.filter(Boolean) : [];
  if (!list.length) return;

  emit("open-gallery", {
    title: props.projectName,
    images: list,
    index: Number.isFinite(index) ? index : 0,
  });
}

const img = computed(() =>
  buildResponsiveImageSourcesFromImageValue(props.hero, {
    widths: [480, 960],
  }),
);
</script>

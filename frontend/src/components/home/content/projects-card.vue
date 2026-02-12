<template>
  <CardWrapper
    :href="href"
    :aria-label="ariaLabel"
    :is-last="isLast"
    @open-gallery="onOpenGallery"
  >
    <!-- Image column -->
    <div class="z-10 mb-2 sm:col-span-2">
      <img
        class="mt-1 w-full rounded border border-white/10 bg-white/5 object-cover"
        :src="img.src"
        :srcset="img.srcset || undefined"
        sizes="(min-width: 640px) 16rem, 100vw"
        :alt="imageAlt"
        width="1280"
        height="720"
        loading="lazy"
        decoding="async"
      />
    </div>

    <!-- Content column -->
    <div class="z-10 sm:col-span-6">
      <div class="flex items-start justify-between gap-4">
        <h3
          class="font-medium leading-snug text-slate-200 transition-colors lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300"
        >
          {{ projectName }}
        </h3>

        <!-- If there is an external url, show the "open in new" icon. -->
        <i
          v-if="href"
          :class="[
            'fa-light fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
            'text-slate-200 transition-[transform,color] motion-reduce:transition-none',
            'lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300',
            'lg:group-hover:-translate-y-2 lg:group-hover:translate-x-3',
            'lg:group-focus-within:-translate-y-2 lg:group-focus-within:translate-x-3',
          ]"
          aria-hidden="true"
        />

        <!-- If there is NO url, show a gallery icon button (always visible). -->
        <button
          v-else
          type="button"
          :class="[
            // Keep baseline/size 1:1 with the external-link icon
            'ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
            'text-slate-200 transition-[color] motion-reduce:transition-none',
            'lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300',
            // button-specific
            'kbd-focus cursor-pointer',
          ]"
          aria-label="Open gallery"
          @click.stop.prevent="onOpenGallery(0)"
        >
          <i
            class="fa-light fa-images gallery-icon-wiggle leading-none"
            aria-hidden="true"
          />
        </button>
      </div>

      <p v-if="summary" class="mt-2 text-sm leading-normal text-slate-400">
        {{ summary }}
      </p>

      <ul
        v-if="sortedTechnology?.length"
        class="mt-3 flex flex-wrap"
        aria-label="Technologies used"
      >
        <li v-for="tag in sortedTechnology" :key="tag" class="mr-1.5 mt-2">
          <div
            class="flex items-center rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium leading-5 text-sky-300"
          >
            {{ tag }}
          </div>
        </li>
      </ul>

      <div
        v-if="metaDisplay?.label"
        class="mt-3 flex items-center gap-2 text-xs text-font-primary/60"
      >
        <i
          v-if="metaDisplay?.iconClass"
          :class="metaDisplay.iconClass"
          aria-hidden="true"
        />
        <i v-else class="fa-light fa-star" aria-hidden="true" />
        {{ metaDisplay.label }}
      </div>
    </div>
  </CardWrapper>
</template>

<script setup>
import CardWrapper from "@/components/home/content/card-wrapper.vue";
import { computed } from "vue";
import { buildResponsiveImageSourcesFromImageValue } from "@/utils/firebaseStorageImages.js";
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
  // Canonical: Firestore stores `meta` as a preset key string.
  meta: { type: [String, null], default: null },
  isLast: { type: Boolean, default: false },

  // Needed to open the modal when there is no external URL
  images: { type: Array, default: () => [] },
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
    title: props.title,
    images: list,
    index: Number.isFinite(index) ? index : 0,
  });
}

const sortedTechnology = computed(() => {
  const arr = Array.isArray(props.technology) ? props.technology : [];

  return arr
    .filter((t) => (t ?? "").toString().trim())
    .map((t) => (t ?? "").toString().trim())
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
});

const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const img = computed(() =>
  buildResponsiveImageSourcesFromImageValue(props.hero, {
    bucket: storageBucket,
    widths: [480, 720, 1080],
  }),
);
</script>

<template>
  <div>
    <!-- Heading row. Phones: the carousel's page dots sit at the right. lg+ the rail
         navigation names the section, so the heading is screen-reader only there. -->
    <div class="mb-8 flex items-center justify-between gap-4 lg:sr-only">
      <h2 class="text-sm font-bold uppercase tracking-widest text-slate-200">
        Selected work
      </h2>

      <div
        v-if="showDots"
        class="flex items-center gap-2 sm:hidden"
        role="group"
        aria-label="Selected work pages"
      >
        <button
          v-for="(item, idx) in selected"
          :key="'dot-' + item.projectName + '-' + idx"
          type="button"
          class="kbd-focus -my-2 flex h-6 cursor-pointer items-center px-0.5"
          :aria-label="`Show ${item.projectName}`"
          :aria-current="idx === active ? 'true' : undefined"
          @click="goTo(idx)"
        >
          <span
            class="block h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none"
            :class="idx === active ? 'w-6 bg-sky-300' : 'w-1.5 bg-white/25'"
          />
        </button>
      </div>
    </div>

    <ProjectsLoadState
      variant="featured"
      :count="SELECTED_WORK_COUNT"
      :list-class="SKELETON_CLASS"
    >
      <div>
        <!-- Phones: a swipeable snap carousel with the next card peeking. sm+: the grid. -->
        <ol
          ref="listRef"
          class="group/list relative list-none"
          :class="FEATURED_LIST_CLASS"
          @scroll.passive="onScroll"
        >
          <ProjectsCard
            v-for="(item, idx) in selected"
            :key="item.projectName + '-' + idx"
            layout="stacked"
            :lead="isLead(idx)"
            :class="[
              'w-[90%] shrink-0 snap-start sm:w-auto',
              isLead(idx) ? 'sm:col-span-2' : '',
            ]"
            :project-name="item.projectName"
            :summary="item.summary"
            :hero="item.hero"
            :href="item.url"
            :technology="item.technology"
            :images="item.images"
            :meta="item.meta"
            :image-alt="`${item.projectName} screenshot`"
            :aria-label="
              item.url
                ? `${item.projectName} (opens in a new tab)`
                : `${item.projectName} (opens gallery)`
            "
            is-last
            :priority="idx === 0"
            @open-gallery="openGallery"
          />
        </ol>
      </div>
    </ProjectsLoadState>

    <ProjectsGalleryModal
      v-if="galleryMounted"
      :key="galleryShareUrl"
      v-model="isGalleryOpen"
      :title="galleryTitle"
      :images="galleryImages"
      :initial-index="galleryIndex"
      :origin-rect="galleryOriginRect"
      :get-origin-rect="getOriginRect"
      :share-url="galleryShareUrl"
      :case-study-href="galleryCaseStudyHref"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from "vue";

import ProjectsCard from "@/components/home/content/projects-card.vue";
import ProjectsLoadState from "@/components/shared/projects-load-state.vue";
import { useSettingsStore } from "@/stores/settings.js";
import {
  SELECTED_WORK_COUNT,
  useFeaturedProjects,
} from "@/composables/useFeaturedProjects.js";
import {
  ProjectsGalleryModal,
  useProjectGallery,
} from "@/composables/useProjectGallery.js";

// Below sm the list is a horizontal snap carousel that bleeds to the screen edges (the
// app shell pads 1.5rem there); from sm up it is the grid: one lead card across the
// column, the rest two-up.
const FEATURED_LIST_CLASS = [
  "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-6",
  "-mx-6 -my-4 px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  "sm:m-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 sm:overflow-visible sm:p-0",
  "lg:gap-x-12",
].join(" ");

// The loading state mirrors it: a single card at carousel width on phones.
const SKELETON_CLASS = [
  "grid gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:gap-x-12",
  "max-sm:[&>li:not(:first-child)]:hidden max-sm:[&>li:first-child]:w-[90%]",
].join(" ");

const showDots = computed(
  () =>
    !settingsStore.projectsLoading &&
    !settingsStore.projectsError &&
    selected.value.length > 1,
);

const listRef = ref(null);
const active = ref(0);

// Which card is nearest the left edge of the carousel.
let frame = 0;
const onScroll = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const list = listRef.value;
    if (!list) return;
    const pad = parseFloat(getComputedStyle(list).paddingLeft) || 0;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(list.children).forEach((card, i) => {
      const distance = Math.abs(card.offsetLeft - pad - list.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    active.value = best;
  });
};

const goTo = (index) => {
  const list = listRef.value;
  const card = list?.children[index];
  if (!card) return;
  const pad = parseFloat(getComputedStyle(list).paddingLeft) || 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  list.scrollTo({ left: card.offsetLeft - pad, behavior: reduce ? "auto" : "smooth" });
};

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});

const settingsStore = useSettingsStore();
const { selected } = useFeaturedProjects();

// The first card leads; with fewer than three there is no pair to sit side by side.
const isLead = (idx) =>
  idx === 0 || selected.value.length < SELECTED_WORK_COUNT;

const {
  galleryMounted,
  isGalleryOpen,
  galleryTitle,
  galleryImages,
  galleryIndex,
  galleryOriginRect,
  getOriginRect,
  galleryShareUrl,
  galleryCaseStudyHref,
  openGallery,
} = useProjectGallery({ preload: true, deepLink: true });
</script>

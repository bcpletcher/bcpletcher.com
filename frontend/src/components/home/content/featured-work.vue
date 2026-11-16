<template>
  <div>
    <ProjectsLoadState
      variant="featured"
      :count="SELECTED_WORK_COUNT"
      :list-class="FEATURED_GRID_CLASS"
    >
      <ol class="group/list list-none p-0" :class="FEATURED_GRID_CLASS">
        <ProjectsCard
          v-for="(item, idx) in selected"
          :key="item.projectName + '-' + idx"
          layout="stacked"
          :lead="isLead(idx)"
          :class="isLead(idx) ? 'sm:col-span-2' : ''"
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
    </ProjectsLoadState>

    <ProjectsGalleryModal
      v-if="galleryMounted"
      v-model="isGalleryOpen"
      :title="galleryTitle"
      :images="galleryImages"
      :initial-index="galleryIndex"
    />
  </div>
</template>

<script setup>
import ProjectsCard from "@/components/home/content/projects-card.vue";
import ProjectsLoadState from "@/components/shared/projects-load-state.vue";
import {
  SELECTED_WORK_COUNT,
  useFeaturedProjects,
} from "@/composables/useFeaturedProjects.js";
import {
  ProjectsGalleryModal,
  useProjectGallery,
} from "@/composables/useProjectGallery.js";

// One lead card across the column, the rest two-up from sm. Shared with the skeleton
// (via ProjectsLoadState) so the loading state has the same footprint.
const FEATURED_GRID_CLASS = "grid gap-y-12 sm:grid-cols-2 sm:gap-x-8 lg:gap-x-12";

const { selected } = useFeaturedProjects();

// The first card leads; with fewer than three there is no pair to sit side by side.
const isLead = (idx) => idx === 0 || selected.value.length < SELECTED_WORK_COUNT;

const {
  galleryMounted,
  isGalleryOpen,
  galleryTitle,
  galleryImages,
  galleryIndex,
  openGallery,
} = useProjectGallery({ preload: true });
</script>

<template>
  <div>
    <ProjectsLoadState variant="home" :count="2">
      <ol v-if="remaining.length" class="group/list">
        <ProjectsCard
          v-for="(item, idx) in remaining"
          :key="item.projectName + '-' + idx"
          :project-name="item.projectName"
          :summary="item.summary"
          :hero="item.hero"
          :href="item.url"
          :technology="item.technology"
          :images="item.images"
          :meta="item.meta"
          :aria-label="
            item.url
              ? `${item.projectName} (opens in a new tab)`
              : `${item.projectName} (opens gallery)`
          "
          :image-alt="`${item.projectName} screenshot`"
          :is-last="idx === remaining.length - 1"
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
      :origin-rect="galleryOriginRect"
      :get-origin-rect="getOriginRect"
      :share-url="galleryShareUrl"
      :case-study-href="galleryCaseStudyHref"
    />

    <div :class="remaining.length ? 'mt-12' : ''">
      <router-link
        to="/projects"
        class="kbd-focus group/link inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-sky-300 focus-visible:text-sky-300 transition-standard"
      >
        <span>View all projects</span>
        <AppIcon
          icon="fa-light fa-arrow-right"
          class="transition-transform motion-reduce:transition-none group-hover/link:translate-x-1 group-focus-visible/link:translate-x-1"
          aria-hidden="true"
        />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import ProjectsCard from "@/components/home/content/projects-card.vue";
import ProjectsLoadState from "@/components/shared/projects-load-state.vue";
import { useFeaturedProjects } from "@/composables/useFeaturedProjects.js";
import {
  ProjectsGalleryModal,
  useProjectGallery,
} from "@/composables/useProjectGallery.js";

// Featured projects not already shown in the "Selected work" band.
const { remaining } = useFeaturedProjects();

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
} = useProjectGallery();
</script>

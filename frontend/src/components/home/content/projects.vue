<template>
  <div>
    <ol class="group/list">
      <ProjectsCard
        v-for="(item, idx) in items"
        :key="item.title + '-' + idx"
        :title="item.title"
        :summary="item.summary"
        :hero="item.hero"
        :href="item.url"
        :technology="item.technology"
        :images="item.images"
        :aria-label="
          item.url
            ? `${item.title} (opens in a new tab)`
            : `${item.title} (opens gallery)`
        "
        :is-last="idx === items.length - 1"
        @open-gallery="openGallery"
      />
    </ol>

    <ProjectsGalleryModal
      v-model="isGalleryOpen"
      :title="galleryTitle"
      :images="galleryImages"
      :initial-index="galleryIndex"
    />

    <div class="mt-12">
      <router-link
        to="/projects"
        class="kbd-focus group/link inline-flex items-baseline gap-2 text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-sky-300 focus-visible:text-sky-300 transition-standard"
      >
        <span>View all projects</span>
        <i
          class="fa-light fa-arrow-right transition-transform motion-reduce:transition-none group-hover/link:translate-x-1 group-focus-visible/link:translate-x-1"
          aria-hidden="true"
        />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useSettingsStore } from "@/stores/settings.js";

import ProjectsCard from "@/components/home/content/projects-card.vue";
import ProjectsGalleryModal from "@/components/projects/projects-gallery-modal.vue";

const settingsStore = useSettingsStore();

const isGalleryOpen = ref(false);
const galleryTitle = ref("");
const galleryImages = ref([]);
const galleryIndex = ref(0);

function openGallery(payload) {
  if (!payload?.images?.length) return;
  galleryTitle.value = payload.title || "Project Gallery";
  galleryImages.value = payload.images;
  galleryIndex.value = Number.isFinite(payload.index) ? payload.index : 0;
  isGalleryOpen.value = true;
}

const items = computed(() => {
  const all = settingsStore.projects;
  if (!all) return [];

  return Object.values(all)
    .filter((p) => !p?.hidden)
    .filter((p) => !!p?.featured)
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((p) => {
      const images = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
      return {
        hero: images[0] || "",
        images,
        title: p?.title || "Untitled",
        summary: p?.summary || "",
        technology: Array.isArray(p?.technology) ? p.technology : [],
        url: p?.url || null,
      };
    })
    .filter((p) => Boolean(p.hero));
});
</script>

<template>
  <div>
    <ol class="group/list">
      <ProjectsCard
        v-for="(item, idx) in items"
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
import { normalizeProjectDate } from "@/utils/projectDate.js";

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

  return (
    Object.values(all)
      .filter((p) => !p?.hidden)
      .filter((p) => !!p?.featured)
      .map((p) => {
        const images = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
        const projectName = p?.projectName || p?.title || "Untitled";

        return {
          hero: images[0] || "",
          images,
          projectName,
          summary: p?.summary || "",
          technology: p?.technology || [],
          url: p?.url || null,
          date: normalizeProjectDate(p?.date) || null,
          meta: p.meta,
        };
      })
      // Date is required, but keep a safe fallback so the section doesn't explode on legacy entries.
      .sort((a, b) => {
        const ad = a.date || "";
        const bd = b.date || "";
        if (ad !== bd) return bd.localeCompare(ad);
        return (a.projectName || "").localeCompare(b.projectName || "");
      })
      .filter((p) => Boolean(p.hero))
  );
});
</script>

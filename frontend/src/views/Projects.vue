<template>
  <RailLayout :rail-width-rem="16">
    <template #rail>
      <ProjectsRailTimeline
        :years="years"
        :collapse-before-year="2019"
        collapsed-label="Earlier"
      >
        <template #header>
          <PageHeader
            title="All Projects"
            back-label="Benjamin Pletcher"
            :remove-top-padding="true"
          />
        </template>
      </ProjectsRailTimeline>
    </template>

    <template #main>
      <div>
        <div v-for="y in years" :key="y" class="mb-10">
          <!-- Year anchor/section for timeline tracking -->
          <div
            :id="`year-${y}`"
            data-project-year-section
            :data-year="y"
            class="scroll-mt-28"
          />

          <ul class="grid gap-4 list-none p-0 m-0">
            <ProjectsCard
              v-for="(project, idx) in projectsByYear[y]"
              :key="project.id || `${y}-${idx}`"
              :title="project.title"
              :year="project.year"
              :summary="project.description"
              :hero="project.hero"
              :images="project.images"
              :href="project.url"
              :technology="project.technology"
              :featured="project.featured"
              :is-last="idx === projectsByYear[y].length - 1"
            />
          </ul>
        </div>
      </div>
    </template>
  </RailLayout>
</template>

<script setup>
import { computed } from "vue";
import RailLayout from "@/components/shared/rail-layout.vue";
import PageHeader from "@/components/shared/page-header.vue";
import ProjectsRailTimeline from "@/components/projects/projects-rail-timeline.vue";
import ProjectsCard from "@/components/projects/projects-card.vue";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();

// Assumption: projects are currently sourced from the same dataset as Scrapbook.
// We keep this isolated in this view so the existing scrapbook page stays unchanged.
const projects = computed(() => {
  if (settingsStore.scrapbook === null) return [];

  return Object.values(settingsStore.scrapbook)
    .filter((item) => !item.deleted)
    .sort((a, b) => {
      const ay = typeof a.year === "number" ? a.year : Number.NEGATIVE_INFINITY;
      const by = typeof b.year === "number" ? b.year : Number.NEGATIVE_INFINITY;
      if (ay !== by) return by - ay; // newest first

      // Secondary sort: explicit order if present (ascending)
      const ao =
        typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
      const bo =
        typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;

      // Stable-ish fallback
      const at = (a.title || "").toString();
      const bt = (b.title || "").toString();
      return at.localeCompare(bt);
    })
    .map((item) => ({
      id: item.id,
      title: item.title || "Untitled",
      year: item.year ?? null,
      description: item.description || "",
      hero:
        item.hero || (Array.isArray(item.images) ? item.images?.[0] : "") || "",
      images: Array.isArray(item.images) ? item.images : null,
      url: item.url || null,
      technology: item.technology || [],
      featured: Boolean(item.featured),
    }))
    .filter((item) => item.hero);
});

const years = computed(() => {
  const ys = new Set();
  projects.value.forEach((p) => {
    if (p.year) ys.add(Number(p.year));
  });
  return Array.from(ys)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a);
});

const projectsByYear = computed(() => {
  const grouped = {};
  years.value.forEach((y) => {
    grouped[y] = [];
  });

  projects.value.forEach((p) => {
    const y = Number(p.year);
    if (!Number.isFinite(y)) return;
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(p);
  });

  return grouped;
});
</script>

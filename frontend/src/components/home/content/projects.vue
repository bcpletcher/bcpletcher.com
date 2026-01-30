<template>
  <div>
    <ol class="group/list">
      <ProjectsCard
        v-for="(item, idx) in items"
        :key="item.title + '-' + idx"
        :title="item.title"
        :description="item.description"
        :hero="item.hero"
        :href="item.url"
        :technology="item.technology"
        :aria-label="`${item.title} (opens in a new tab)`"
        :is-last="idx === items.length - 1"
      />
    </ol>

    <div class="mt-12">
      <router-link
        to="/projects"
        class="group/link inline-flex items-baseline gap-2 text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-font-secondary focus-visible:text-font-secondary transition-standard"
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
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settings.js";

import ProjectsCard from "@/components/home/content/projects-card.vue";

const settingsStore = useSettingsStore();

const items = computed(() => {
  const raw = settingsStore.scrapbook;
  if (!raw) return [];

  return Object.values(raw)
    .filter((p) => !p?.deleted)
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((p) => ({
      hero: p?.hero || "",
      title: p?.title || "Untitled",
      description: p?.description || "",
      technology: Array.isArray(p?.technology) ? p.technology : [],
      url: p?.url || null,
    }))
    .filter((p) => Boolean(p.hero));
});
</script>

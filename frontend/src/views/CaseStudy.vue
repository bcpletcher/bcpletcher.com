<template>
  <main class="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:py-24">
    <PageHeader
      :title="project?.projectName || (loading ? '' : 'Case study')"
      back-label="Benjamin Pletcher"
      :remove-top-padding="true"
    />

    <ProjectsLoadState v-if="loading || error" variant="page" :count="1" />

    <p v-else-if="!project" class="text-slate-300">
      That project couldn’t be found.
      <router-link
        to="/projects"
        class="text-sky-300 underline-offset-4 hover:underline"
      >
        See all projects
      </router-link>
    </p>

    <article v-else class="flex flex-col gap-12">
      <!-- Stub notice: remove once a real write-up exists. -->
      <p
        class="rounded-md border border-sky-300/20 bg-sky-300/5 px-4 py-3 text-sm text-slate-300"
        role="note"
      >
        Case study in progress. The full write-up will cover the problem, my
        role, the process and the outcome.
      </p>

      <img
        v-if="hero"
        v-img-fade
        class="aspect-video w-full rounded-md border border-white/10 object-cover"
        :src="hero.src"
        :srcset="hero.srcset || undefined"
        sizes="(min-width: 896px) 56rem, 100vw"
        :alt="`${project.projectName} screenshot`"
        width="1280"
        height="720"
        fetchpriority="high"
        decoding="async"
      />

      <p
        v-if="project.summary"
        class="max-w-prose text-lg leading-relaxed text-slate-300"
      >
        {{ project.summary }}
      </p>

      <dl class="grid gap-6 border-y border-white/10 py-6 sm:grid-cols-3">
        <div>
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Role
          </dt>
          <dd class="mt-2 text-slate-300">To be added</dd>
        </div>
        <div>
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Timeline
          </dt>
          <dd class="mt-2 text-slate-300">{{ year || "To be added" }}</dd>
        </div>
        <div>
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Stack
          </dt>
          <dd class="mt-2">
            <TechTags
              v-if="project.technology?.length"
              :items="project.technology"
            />
            <span v-else class="text-slate-300">To be added</span>
          </dd>
        </div>
      </dl>

      <section v-for="s in SECTIONS" :key="s.title" class="max-w-prose">
        <h2 class="text-xl font-semibold tracking-tight text-slate-100">
          {{ s.title }}
        </h2>
        <p class="mt-3 leading-relaxed text-slate-400">{{ s.hint }}</p>
      </section>

      <a
        v-if="project.url"
        :href="project.url"
        target="_blank"
        rel="noopener noreferrer"
        class="kbd-focus inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-sky-300 px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-sky-200 focus-visible:bg-sky-200"
      >
        Visit the project
        <span class="sr-only">(opens in a new tab)</span>
        <AppIcon
          icon="fa-solid fa-arrow-up-right"
          class="h-4 w-4"
          aria-hidden="true"
        />
      </a>
    </article>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, watchEffect } from "vue";
import { useRoute } from "vue-router";

import PageHeader from "@/components/shared/page-header.vue";
import ProjectsLoadState from "@/components/shared/projects-load-state.vue";
import TechTags from "@/components/shared/tech-tags.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { buildResponsiveImageSourcesFromImageValue } from "@/utils/mediaStorageImages.js";
import { setNoIndex, setPageTitle } from "@/utils/pageMeta.js";
import { getYearFromProjectDate } from "@/utils/projectDate.js";
import { slugify } from "@/utils/slug.js";
import { hasCaseStudy } from "@/constants/caseStudies.js";

const SECTIONS = [
  {
    title: "The problem",
    hint: "What needed solving, for whom, and why it mattered.",
  },
  { title: "My role", hint: "What I owned and who I worked with." },
  {
    title: "Process",
    hint: "Research, key decisions, and the trade-offs behind them.",
  },
  { title: "Outcome", hint: "What shipped and the measurable result." },
];

const route = useRoute();
const settingsStore = useSettingsStore();

const loading = computed(() => settingsStore.projectsLoading);
const error = computed(() => settingsStore.projectsError);

const project = computed(() => {
  const all = settingsStore.projects;
  if (!all) return null;
  return (
    Object.values(all).find(
      (p) =>
        !p?.hidden &&
        slugify(p?.projectName || p?.title) === String(route.params.slug || ""),
    ) || null
  );
});

const hero = computed(() => {
  const first = project.value?.images?.filter(Boolean)?.[0];
  return first
    ? buildResponsiveImageSourcesFromImageValue(first, { widths: [480, 960] })
    : null;
});

const year = computed(() => getYearFromProjectDate(project.value?.date) || "");

watchEffect(() => {
  const name = project.value?.projectName;
  setPageTitle(name ? `${name} · Case study · Benjamin Pletcher` : null);
  // Stubs stay out of search results until the project is listed in constants/caseStudies.js.
  setNoIndex(!hasCaseStudy(String(route.params.slug || "")));
});

onBeforeUnmount(() => {
  setPageTitle(null);
  setNoIndex(false);
});
</script>

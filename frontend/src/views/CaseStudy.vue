<template>
  <main class="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:py-24">
    <PageHeader
      :title="project?.projectName || (loading ? '' : 'Case study')"
      back-label="Benjamin Pletcher"
      :remove-top-padding="true"
    />

    <ProjectsLoadState v-if="loading || error || !settingsStore.projects" variant="page" :count="1" />

    <p v-else-if="!project" class="text-slate-300">
      That project couldn’t be found.
      <router-link
        to="/projects"
        class="text-sky-300 underline-offset-4 hover:underline"
      >
        See all projects
      </router-link>
    </p>

    <article v-else class="flex flex-col gap-12 sm:gap-16">
      <div class="flex flex-col gap-6 lg:-mt-8">
        <!-- Stub notice: remove once a real write-up exists. -->
        <p
          class="flex w-fit items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 pl-3.5 pr-4 text-sm leading-relaxed text-slate-400 sm:items-center sm:rounded-full"
          role="note"
        >
          <span
            class="relative mt-1.5 flex h-2 w-2 shrink-0 sm:mt-0"
            aria-hidden="true"
          >
            <span
              class="absolute inline-flex h-full w-full rounded-full bg-sky-300/60 motion-safe:animate-ping"
            />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
          </span>
          <span>
            <span class="font-semibold text-slate-200">
              Case study in progress.
            </span>
            The full write-up will cover the problem, my role, the process and
            the outcome.
          </span>
        </p>

        <p
          v-if="project.summary"
          class="max-w-2xl text-lg leading-relaxed text-pretty text-slate-300 sm:text-xl sm:leading-relaxed"
        >
          {{ project.summary }}
        </p>
      </div>

      <div
        v-if="hero"
        class="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-2xl shadow-black/40 sm:p-2"
      >
        <img
          v-img-fade
          class="aspect-video w-full rounded-xl object-cover ring-1 ring-black/20"
          :src="hero.src"
          :srcset="hero.srcset || undefined"
          sizes="(min-width: 896px) 56rem, 100vw"
          :alt="`${project.projectName} screenshot`"
          width="1280"
          height="720"
          fetchpriority="high"
          decoding="async"
        />
      </div>

      <dl
        class="grid gap-x-8 gap-y-6 border-y border-white/10 py-6 sm:grid-cols-[1fr_1fr_2fr] sm:py-8"
      >
        <div>
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Role
          </dt>
          <dd class="mt-2.5 text-slate-400">To be added</dd>
        </div>
        <div class="sm:border-l sm:border-white/10 sm:pl-8">
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Timeline
          </dt>
          <dd
            class="mt-2.5 tabular-nums"
            :class="year ? 'font-medium text-slate-200' : 'text-slate-400'"
          >
            {{ year || "To be added" }}
          </dd>
        </div>
        <div class="sm:border-l sm:border-white/10 sm:pl-8">
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Stack
          </dt>
          <dd class="mt-2.5">
            <TechTags
              v-if="project.technology?.length"
              :items="project.technology"
            />
            <span v-else class="text-slate-400">To be added</span>
          </dd>
        </div>
      </dl>

      <div class="flex flex-col">
        <section
          v-for="(s, i) in SECTIONS"
          :key="s.title"
          class="grid gap-x-8 gap-y-3 border-t border-white/10 py-8 first:border-t-0 first:pt-0 sm:py-10 md:grid-cols-[14rem_1fr]"
        >
          <div class="flex items-baseline gap-4 md:flex-col md:gap-2">
            <span
              class="text-xs font-bold tabular-nums tracking-widest text-sky-300"
              aria-hidden="true"
            >
              {{ String(i + 1).padStart(2, "0") }}
            </span>
            <h2
              class="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl"
            >
              {{ s.title }}
            </h2>
          </div>
          <p class="max-w-prose leading-relaxed text-slate-400 md:pt-6">
            {{ s.hint }}
          </p>
        </section>
      </div>

      <div
        class="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-8 sm:pt-10"
      >
        <a
          v-if="project.url"
          :href="project.url"
          target="_blank"
          rel="noopener noreferrer"
          class="kbd-focus group/cta inline-flex min-h-12 w-fit items-center gap-2.5 rounded-full bg-sky-300 px-6 text-sm font-semibold text-slate-900 transition-[background-color,scale] duration-200 hover:bg-sky-200 focus-visible:bg-sky-200 motion-reduce:transition-none"
        >
          Visit the project
          <span class="sr-only">(opens in a new tab)</span>
          <AppIcon
            icon="fa-solid fa-arrow-up-right"
            class="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover/cta:translate-none"
            aria-hidden="true"
          />
        </a>
        <router-link
          to="/projects"
          class="kbd-focus inline-flex min-h-11 items-center text-sm font-medium text-slate-300 underline-offset-4 transition-colors duration-200 hover:text-sky-300 hover:underline focus-visible:text-sky-300 motion-reduce:transition-none"
        >
          See all projects
        </router-link>
      </div>
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

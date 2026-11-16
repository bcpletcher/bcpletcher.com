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
          v-if="!content"
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
          v-if="content?.summary || project.summary"
          class="max-w-2xl text-lg leading-relaxed text-pretty text-slate-300 sm:text-xl sm:leading-relaxed"
        >
          {{ content?.summary || project.summary }}
        </p>
      </div>

      <div
        v-if="hero"
        class="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-2xl shadow-black/40 sm:p-2"
      >
        <img
          v-img-fade
          style="view-transition-name: case-hero"
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
          <dd
            class="mt-2.5"
            :class="content?.role ? 'font-medium text-slate-200' : 'text-slate-400'"
          >
            {{ content?.role || "To be added" }}
          </dd>
        </div>
        <div class="sm:border-l sm:border-white/10 sm:pl-8">
          <dt
            class="text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            Timeline
          </dt>
          <dd
            class="mt-2.5"
            :class="
              content?.timeline || year
                ? 'font-medium text-slate-200'
                : 'text-slate-400'
            "
          >
            {{ content?.timeline || year || "To be added" }}
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
          <div class="flex max-w-prose flex-col gap-5 md:pt-6">
            <template v-if="content?.sections?.[s.title]">
              <p
                v-for="(para, pi) in content.sections[s.title].body"
                :key="pi"
                class="leading-relaxed text-slate-300"
              >
                {{ para }}
              </p>
              <dl
                v-if="content.sections[s.title].points?.length"
                class="flex flex-col gap-4"
              >
                <div
                  v-for="pt in content.sections[s.title].points"
                  :key="pt.title"
                  class="border-l-2 border-sky-300/30 pl-4"
                >
                  <dt class="font-semibold text-slate-100">{{ pt.title }}</dt>
                  <dd class="mt-1 leading-relaxed text-slate-400">
                    {{ pt.text }}
                  </dd>
                </div>
              </dl>
            </template>
            <p v-else class="leading-relaxed text-slate-400">{{ s.hint }}</p>
          </div>

          <!-- Screens that illustrate this section. Tapping one opens the lightbox on it. -->
          <div
            v-if="sectionFigures[i]?.length"
            class="grid gap-4 md:col-start-2"
            :class="sectionFigures[i].length > 1 ? 'sm:grid-cols-2' : ''"
          >
            <figure
              v-for="(fig, fi) in sectionFigures[i]"
              :key="fig.index"
              class="flex flex-col gap-3"
            >
              <button
                type="button"
                class="kbd-focus group/fig relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-1 text-left shadow-xl shadow-black/30 transition-[border-color] duration-200 hover:border-sky-300/40 focus-visible:border-sky-300/40 motion-reduce:transition-none"
                :aria-label="`Open screenshot ${fig.index + 1} of ${project.projectName} in the lightbox`"
                @click="openFigure(fig.index)"
              >
                <img
                  v-img-fade
                  class="aspect-video w-full rounded-lg object-cover ring-1 ring-black/20 transition-transform duration-500 ease-out group-hover/fig:scale-[1.02] motion-reduce:transition-none"
                  :src="fig.img.src"
                  :srcset="fig.img.srcset || undefined"
                  :sizes="sectionFigures[i].length > 1 ? '(min-width: 896px) 22rem, 100vw' : '(min-width: 896px) 40rem, 100vw'"
                  :alt="`${project.projectName} screen ${fig.index + 1}`"
                  width="1280"
                  height="720"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  class="pointer-events-none absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-slate-100 opacity-0 backdrop-blur transition-opacity duration-200 group-hover/fig:opacity-100 group-focus-visible/fig:opacity-100 motion-reduce:transition-none"
                  aria-hidden="true"
                >
                  <AppIcon icon="fa-light fa-magnifying-glass-plus" />
                </span>
              </button>
              <figcaption class="text-sm leading-relaxed text-slate-500">
                {{
                  content?.sections?.[s.title]?.captions?.[fi] ||
                  "Caption to be added: what this screen shows and why it matters."
                }}
              </figcaption>
            </figure>
          </div>
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

    <ProjectsGalleryModal
      v-if="galleryMounted"
      v-model="isGalleryOpen"
      :title="galleryTitle"
      :images="galleryImages"
      :initial-index="galleryIndex"
      :origin-rect="galleryOriginRect"
      :get-origin-rect="getOriginRect"
      :autoplay="galleryAutoplay"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, watchEffect } from "vue";
import { useRoute } from "vue-router";

import { ProjectsGalleryModal, useProjectGallery } from "@/composables/useProjectGallery.js";
import PageHeader from "@/components/shared/page-header.vue";
import ProjectsLoadState from "@/components/shared/projects-load-state.vue";
import TechTags from "@/components/shared/tech-tags.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { buildResponsiveImageSourcesFromImageValue } from "@/utils/mediaStorageImages.js";
import { setNoIndex, setPageTitle } from "@/utils/pageMeta.js";
import { getYearFromProjectDate } from "@/utils/projectDate.js";
import { slugify } from "@/utils/slug.js";
import { hasCaseStudy } from "@/constants/caseStudies.js";
import { getCaseStudyContent } from "@/constants/caseStudyContent.js";

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

// Screens woven into the story: Process gets up to two (side by side), Outcome gets one.
// Index 0 is the hero above, so figures start at the second image.
const sectionFigures = computed(() => {
  const imgs = (project.value?.images || []).filter(Boolean);
  const fig = (index) => ({
    index,
    img: buildResponsiveImageSourcesFromImageValue(imgs[index], {
      widths: [480, 960],
    }),
  });
  const byTitle = { Process: [1, 2], Outcome: [3] };
  return SECTIONS.map((s) =>
    (byTitle[s.title] || []).filter((n) => n < imgs.length).map(fig),
  );
});

const {
  galleryMounted,
  isGalleryOpen,
  galleryTitle,
  galleryImages,
  galleryIndex,
  galleryOriginRect,
  galleryAutoplay,
  getOriginRect,
  openGallery,
} = useProjectGallery();

function openFigure(index) {
  const imgs = (project.value?.images || []).filter(Boolean);
  openGallery({
    title: project.value?.projectName || "",
    images: imgs,
    index,
    autoplay: false,
  });
}

const content = computed(() => getCaseStudyContent(String(route.params.slug || "")));

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

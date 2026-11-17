<template>
  <div class="max-w-[34rem]">
    <h2
      class="text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl"
    >
      {{ content.heading }}
    </h2>

    <div class="mt-6 space-y-5">
      <p
        v-for="(item, index) in content.paragraphs"
        :id="index === 1 ? 'about-more' : undefined"
        :key="index"
        :class="[
          index === 0
            ? 'text-lg leading-8 text-slate-300'
            : 'text-base leading-7 text-slate-400',
          index > 0 && !expanded ? 'max-lg:hidden' : '',
        ]"
      >
        <template v-for="(part, i) in item" :key="i">
          <router-link
            v-if="part.link === 'caseStudy' && caseStudyHref"
            :to="caseStudyHref"
            :class="LINK_CLASS"
          >
            {{ part.text }}
          </router-link>
          <a
            v-else-if="part.link === 'coverlabs'"
            :href="COVERLABS_URL"
            target="_blank"
            rel="noopener noreferrer"
            :class="LINK_CLASS"
          >
            {{ part.text }}<span class="sr-only"> (opens in a new tab)</span>
          </a>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </div>

    <!-- Below lg only the opening paragraph shows; the rest is one tap away. -->
    <button
      type="button"
      class="kbd-focus group/more mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold tracking-widest text-slate-400 uppercase transition-standard hover:text-sky-300 focus-visible:text-sky-300 lg:hidden"
      :aria-expanded="expanded"
      aria-controls="about-more"
      @click="expanded = !expanded"
    >
      {{ expanded ? "Show less" : "Read more" }}
      <AppIcon
        icon="fa-light fa-arrow-down"
        class="transition-transform motion-reduce:transition-none"
        :class="expanded ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

import AppIcon from "@/components/shared/app-icon.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { caseStudyHrefFor } from "@/utils/caseStudyData.js";

const expanded = ref(false);

const settingsStore = useSettingsStore();

// The rider-tools link only shows once that case study is published (see caseStudyData).
const caseStudyHref = computed(() =>
  caseStudyHrefFor(settingsStore.projects, "Community Transit"),
);

const COVERLABS_URL = "https://www.coverlabs.studio";
const LINK_CLASS =
  "kbd-focus font-medium text-slate-200 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-sky-300 hover:decoration-sky-300 focus-visible:text-sky-300";

// Copy lives here only. Each paragraph is a list of parts: plain text, or text with a
// `link` key ("caseStudy" -> Community Transit page, "coverlabs" -> the live site).
const t = (text, link) => ({ text, link });

const content = {
  heading: "From technical discovery to launch",
  paragraphs: [
    [
      t(
        "With over a decade in web development, I lead client projects from discovery through launch and ongoing support. I work with stakeholders to define what the project needs, choose the architecture, and guide developers while staying hands-on with the build.",
      ),
    ],
    [
      t("My background in UX shapes how I build software. I’ve worked on accessibility in "),
      t("rider tools", "caseStudy"),
      t(
        ", built interfaces in React and Vue, and connected enterprise CMS sites to other systems using C# and .NET. I help teams carry those decisions through testing and deployment.",
      ),
    ],
    [
      t("Outside client work I build my own products: "),
      t("Coverlabs Studio", "coverlabs"),
      t(
        ", a React editor for creating custom movie and collection posters from templates, and Alcoves, a native iOS reader for books, comics, and PDFs that I’m preparing for release.",
      ),
    ],
  ],
};
</script>

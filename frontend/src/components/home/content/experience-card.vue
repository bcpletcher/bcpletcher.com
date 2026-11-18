<template>
  <CardWrapper :href="href" :aria-label="company" :is-last="isLast" overlay-from-lg>
    <header
      class="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2"
      :aria-label="rangeLabel"
    >
      {{ rangeLabel }}
    </header>

    <!-- Above the full-card link, but clicks fall through to it; only the links and the toggle
         below take clicks (same pattern as the project cards). -->
    <div class="pointer-events-none z-30 sm:col-span-6">
      <div class="flex justify-between items-center">
        <span
          class="font-semibold leading-snug text-slate-100 transition-colors lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300"
        >
          {{ title }}
        </span>
        <span v-if="href" class="hidden items-center lg:inline-flex">
          <AppIcon
            icon="fa-light fa-arrow-up-right" :class="[
              'ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
              'text-slate-200 transition-[transform,color] motion-reduce:transition-none',
              'lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300',
              'lg:group-hover:-translate-y-2 lg:group-hover:translate-x-3',
              'lg:group-focus-within:-translate-y-2 lg:group-focus-within:translate-x-3',
            ]"
            aria-hidden="true"
          />
        </span>
      </div>

      <!-- Below lg only the company name is the link (the full-card link is lg+). -->
      <p class="mt-1 text-sm leading-normal text-slate-200">
        <a
          v-if="href"
          :href="href"
          target="_blank"
          rel="noopener noreferrer"
          class="kbd-focus pointer-events-auto -my-2.5 inline-flex items-center gap-1 py-2.5 transition-colors hover:text-sky-300 lg:hidden"
        >
          {{ company }}
          <AppIcon icon="fa-light fa-arrow-up-right" class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="sr-only">(opens in a new tab)</span>
        </a>
        <span :class="href ? 'max-lg:hidden' : ''">{{ company }}</span>
        <span v-if="location" class="text-slate-500"> · {{ location }}</span>
      </p>

      <!-- Outcomes. Phones: older roles show the first line until expanded. -->
      <ul
        v-if="highlights.length"
        class="mt-3 space-y-2 text-sm leading-normal text-slate-400"
        :aria-label="`${title} highlights`"
      >
        <li
          v-for="(line, i) in highlights"
          :key="i"
          class="relative pl-4"
          :class="collapsed && i >= preview ? 'max-sm:hidden' : ''"
        >
          <span class="absolute left-0 top-[0.7em] h-px w-2 bg-slate-600" aria-hidden="true" />
          {{ line }}
        </li>
      </ul>

      <TechTags
        :items="technology"
        :max-phone="4"
        class="mt-4"
        :class="collapsed ? 'max-sm:hidden' : ''"
      />

      <!-- Keep the project link above the full-card link at lg. -->
      <div
        v-if="projectsLink"
        class="pointer-events-auto relative mt-3"
      >
        <router-link
          :to="projectsLink.to"
          :aria-label="`${projectsLink.label} for ${company}`"
          class="kbd-focus group/rel inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-slate-300 transition-colors hover:text-sky-300 focus-visible:text-sky-300"
        >
          {{ projectsLink.label }}
          <AppIcon
            icon="fa-light fa-arrow-right"
            class="h-3.5 w-3.5 transition-transform motion-reduce:transition-none group-hover/rel:translate-x-0.5"
            aria-hidden="true"
          />
        </router-link>
      </div>

      <!-- Phones: roles show a short summary; the rest is one tap away. -->
      <button
        v-if="collapsible"
        type="button"
        class="kbd-focus pointer-events-auto mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400 uppercase transition-colors hover:text-sky-300 focus-visible:text-sky-300 sm:hidden"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? "Show less" : "Read more" }}
        <AppIcon
          icon="fa-light fa-arrow-down"
          class="h-3.5 w-3.5 transition-transform motion-reduce:transition-none"
          :class="expanded ? 'rotate-180' : ''"
          aria-hidden="true"
        />
      </button>
    </div>
  </CardWrapper>
</template>

<script setup>
import { computed, ref } from "vue";

import CardWrapper from "@/components/home/content/card-wrapper.vue";
import TechTags from "@/components/shared/tech-tags.vue";

const props = defineProps({
  rangeLabel: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: "" },
  href: { type: String, default: null },
  // Short outcome lines (numbers where there are numbers).
  highlights: { type: Array, default: () => [] },
  technology: { type: Array, default: () => [] },
  projectsLink: { type: Object, default: null },
  isLast: { type: Boolean, default: false },
  // Phones: show only the first `preview` lines (and hide the tags) until expanded.
  collapsible: { type: Boolean, default: false },
  preview: { type: Number, default: 1 },
});

const expanded = ref(false);
const collapsed = computed(() => props.collapsible && !expanded.value);
</script>

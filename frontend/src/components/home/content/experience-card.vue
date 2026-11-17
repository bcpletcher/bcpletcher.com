<template>
  <CardWrapper :href="href" :aria-label="company" :is-last="isLast" overlay-from-lg>
    <header
      class="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2"
      :aria-label="rangeLabel"
    >
      {{ rangeLabel }}
    </header>

    <div class="z-10 sm:col-span-6">
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
          class="kbd-focus -my-2.5 inline-flex items-center gap-1 py-2.5 transition-colors hover:text-sky-300 lg:hidden"
        >
          {{ company }}
          <AppIcon icon="fa-light fa-arrow-up-right" class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="sr-only">(opens in a new tab)</span>
        </a>
        <span :class="href ? 'max-lg:hidden' : ''">{{ company }}</span>
      </p>

      <p
        v-if="description"
        class="mt-2 text-sm leading-normal text-slate-400"
        :class="collapsed ? 'max-sm:line-clamp-2' : ''"
      >
        {{ description }}
      </p>

      <TechTags
        :items="technology"
        :max-phone="4"
        class="mt-4"
        :class="collapsed ? 'max-sm:hidden' : ''"
      />

      <!-- Phones: older roles show a short summary; the rest is one tap away. -->
      <button
        v-if="collapsible"
        type="button"
        class="kbd-focus mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400 uppercase transition-colors hover:text-sky-300 focus-visible:text-sky-300 sm:hidden"
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
  href: { type: String, default: null },
  description: { type: String, default: "" },
  technology: { type: Array, default: () => [] },
  isLast: { type: Boolean, default: false },
  // Phones: clamp the description (and hide the tags) until expanded.
  collapsible: { type: Boolean, default: false },
});

const expanded = ref(false);
const collapsed = computed(() => props.collapsible && !expanded.value);
</script>

<template>
  <li class="overflow-visible" :class="isLast ? '' : 'mb-12'">
    <div
      v-intersect-animate="{ once: true, threshold: 0.45 }"
      class="group relative grid overflow-visible pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50"
    >
      <!-- Card hover background -->
      <div
        class="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-y-4 lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"
      />

      <!-- Full-card link overlay -->
      <a
        v-if="href"
        class="absolute -inset-x-4 -inset-y-4 z-20 hidden rounded-md lg:block"
        :href="href"
        target="_blank"
        rel="noreferrer noopener"
        :aria-label="company"
      />

      <header
        class="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2"
        :aria-label="rangeLabel"
      >
        {{ rangeLabel }}
      </header>

      <div class="z-10 sm:col-span-6">
        <div class="flex justify-between items-center">
          <span
            class="font-medium leading-snug text-slate-200 transition-colors lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary"
          >
            {{ title }}
          </span>
          <span class="inline-flex items-center">
            <i
              :class="[
                'fa-light fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
                'text-slate-200 transition-[transform,color] motion-reduce:transition-none',
                'lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary',
                'lg:group-hover:-translate-y-2 lg:group-hover:translate-x-3',
                'lg:group-focus-within:-translate-y-2 lg:group-focus-within:translate-x-3',
              ]"
              aria-hidden="true"
            />
          </span>
        </div>

        <p class="mt-1 text-sm leading-normal text-slate-200">
          {{ company }}
        </p>

        <p v-if="description" class="mt-2 text-sm leading-normal">
          {{ description }}
        </p>

        <ul
          v-if="tech?.length"
          class="mt-2 flex flex-wrap"
          aria-label="Technologies used"
        >
          <li v-for="t in tech" :key="t" class="mr-1.5 mt-2">
            <div
              class="flex items-center rounded-full bg-font-secondary/10 px-3 py-1 text-xs font-medium leading-5 text-font-secondary"
            >
              {{ t }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </li>
</template>

<script setup>
defineProps({
  rangeLabel: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  href: { type: String, default: null },
  description: { type: String, default: "" },
  tech: { type: Array, default: () => [] },
  isLast: { type: Boolean, default: false },
});
</script>

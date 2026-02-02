<template>
  <CardWrapper :href="href" :aria-label="ariaLabel" :is-last="isLast">
    <!-- Image column -->
    <div class="z-10 mb-2 sm:col-span-2">
      <img
        class="mt-1 w-full rounded border border-white/10 bg-white/5 object-cover"
        :src="hero"
        :alt="imageAlt"
        loading="lazy"
        decoding="async"
      />
    </div>

    <!-- Content column -->
    <div class="z-10 sm:col-span-6">
      <div class="flex items-start justify-between gap-4">
        <h3
          class="font-medium leading-snug text-slate-200 transition-colors lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary"
        >
          {{ title }}
        </h3>

        <i
          v-if="href"
          :class="[
            'fa-light fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
            'text-slate-200 transition-[transform,color] motion-reduce:transition-none',
            'lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary',
            'lg:group-hover:-translate-y-2 lg:group-hover:translate-x-3',
            'lg:group-focus-within:-translate-y-2 lg:group-focus-within:translate-x-3',
          ]"
          aria-hidden="true"
        />
      </div>

      <p v-if="summary" class="mt-2 text-sm leading-normal">
        {{ summary }}
      </p>

      <ul
        v-if="technology?.length"
        class="mt-3 flex flex-wrap"
        aria-label="Technologies used"
      >
        <li v-for="tag in technology" :key="tag" class="mr-1.5 mt-2">
          <div
            class="flex items-center rounded-full bg-font-secondary/10 px-3 py-1 text-xs font-medium leading-5 text-font-secondary"
          >
            {{ tag }}
          </div>
        </li>
      </ul>

      <div
        v-if="metaText"
        class="mt-3 flex items-center gap-2 text-xs text-font-primary/60"
      >
        <i class="fa-light fa-star" aria-hidden="true" />
        {{ metaText }}
      </div>
    </div>
  </CardWrapper>
</template>

<script setup>
import CardWrapper from "@/components/home/content/card-wrapper.vue";

defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: "" },
  hero: { type: String, required: true },
  href: { type: String, default: null },
  technology: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: "Project (opens in a new tab)" },
  imageAlt: { type: String, default: "Project screenshot" },
  metaText: { type: String, default: "" },
  isLast: { type: Boolean, default: false },
});
</script>

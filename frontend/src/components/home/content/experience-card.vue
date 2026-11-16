<template>
  <CardWrapper :href="href" :aria-label="company" :is-last="isLast">
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
        <span v-if="href" class="inline-flex items-center">
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

      <p class="mt-1 text-sm leading-normal text-slate-200">
        {{ company }}
      </p>

      <p v-if="description" class="mt-2 text-sm leading-normal text-slate-400">
        {{ description }}
      </p>

      <TechTags :items="technology" class="mt-4" />
    </div>
  </CardWrapper>
</template>

<script setup>
import CardWrapper from "@/components/home/content/card-wrapper.vue";
import TechTags from "@/components/shared/tech-tags.vue";

defineProps({
  rangeLabel: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  href: { type: String, default: null },
  description: { type: String, default: "" },
  technology: { type: Array, default: () => [] },
  isLast: { type: Boolean, default: false },
});
</script>

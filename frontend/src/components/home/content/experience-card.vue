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
          class="font-medium leading-snug text-slate-200 transition-colors lg:group-hover:text-sky-300 lg:group-focus-within:text-sky-300"
        >
          {{ title }}
        </span>
        <span v-if="href" class="inline-flex items-center">
          <i
            :class="[
              'fa-light fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
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

      <p v-if="description" class="mt-2 text-sm leading-normal">
        {{ description }}
      </p>

      <ul
        v-if="tech?.length"
        class="mt-2 flex flex-wrap"
        aria-label="Technologies used"
      >
        <li v-for="item in tech" :key="item" class="mr-1.5 mt-2">
          <div
            class="flex items-center rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium leading-5 text-sky-300"
          >
            {{ item }}
          </div>
        </li>
      </ul>
    </div>
  </CardWrapper>
</template>

<script setup>
import CardWrapper from "@/components/home/content/card-wrapper.vue";

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

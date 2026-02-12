<template>
  <li class="overflow-visible" :class="isLast ? '' : 'mb-12'">
    <div
      v-gsap-reveal="{ once: true, start: gsapStart }"
      class="group relative grid overflow-visible pb-1 transition-all lg:hover:!opacity-100"
      :class="gridColsClass"
    >
      <!-- Full-card link overlay (desktop only) -->
      <a
        v-if="href"
        class="peer card-interactive-link absolute -inset-x-4 -inset-y-4 z-20 hidden rounded-md lg:block"
        :href="href"
        target="_blank"
        rel="noreferrer noopener"
        :aria-label="ariaLabel"
      />

      <!-- Full-card button overlay (desktop only) for opening the gallery when there's no URL -->
      <button
        v-else
        type="button"
        class="peer card-interactive-link absolute -inset-x-4 -inset-y-4 z-20 hidden rounded-md lg:block cursor-pointer"
        :aria-label="ariaLabel"
        @click="$emit('open-gallery', 0)"
      />

      <!-- Card hover background -->
      <div
        class="card-interactive-bg absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-y-4 lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"
      />

      <!-- Screen-reader only label for the full-card action -->
      <span class="sr-only">{{ ariaLabel }}</span>

      <slot />
    </div>
  </li>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  href: { type: String, default: null },
  ariaLabel: { type: String, default: "Opens in a new tab" },
  isLast: { type: Boolean, default: false },
  threshold: { type: Number, default: 0.45 },
  gridColsClass: {
    type: String,
    default: "sm:grid-cols-8 sm:gap-8 md:gap-4",
  },
});

const gsapStart = computed(() => {
  const t = Math.min(1, Math.max(0, Number(props.threshold) || 0.45));
  const pct = Math.round(99 - t * 27);
  return `top ${pct}%`;
});

defineEmits(["open-gallery"]);
</script>

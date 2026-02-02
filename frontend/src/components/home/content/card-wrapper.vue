<template>
  <li class="overflow-visible" :class="isLast ? '' : 'mb-12'">
    <div
      v-gsap-reveal="{ once: true, start: gsapStart }"
      class="group relative grid overflow-visible pb-1 transition-all lg:hover:!opacity-100 lg:group-hover/list:opacity-50"
      :class="gridColsClass"
    >
      <!-- Card hover background -->
      <div
        class="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-y-4 lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"
      />

      <!-- Full-card link overlay (desktop only) -->
      <a
        v-if="href"
        class="absolute -inset-x-4 -inset-y-4 z-20 hidden rounded-md lg:block"
        :href="href"
        target="_blank"
        rel="noreferrer noopener"
        :aria-label="ariaLabel"
      />

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

// Rough mapping: IntersectionObserver threshold -> ScrollTrigger start.
// Higher threshold means "wait until more of it is visible" => start lower in viewport.
const gsapStart = computed(() => {
  const t = Math.min(1, Math.max(0, Number(props.threshold) || 0.45));
  // Reveal sooner:
  // 0.0 => top 99%, 1.0 => top 72%
  const pct = Math.round(99 - t * 27);
  return `top ${pct}%`;
});
</script>

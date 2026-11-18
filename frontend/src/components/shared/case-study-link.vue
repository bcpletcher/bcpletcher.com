<template>
  <RouterLink
    :to="to"
    class="kbd-focus pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-300/30 bg-sky-300/10 px-[11px] py-[3px] text-xs font-semibold leading-5 text-sky-200 transition-[background-color,border-color] hover:border-sky-300/50 hover:bg-sky-300/20 focus-visible:border-sky-300/50 focus-visible:bg-sky-300/20 motion-reduce:transition-none"
    :aria-label="`Read the ${name} case study`"
    @click="onClick"
  >
    <!-- Open book: two solid pages with a gap for the spine, so it keeps detail when filled. -->
    <svg
      viewBox="0 0 24 24"
      class="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 3h5a4 4 0 0 1 3.25 1.7v15.3A4.6 4.6 0 0 0 8 18.5H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M21 3h-5a4 4 0 0 0-3.25 1.7v15.3a4.6 4.6 0 0 1 3.25-1.5h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z" />
    </svg>
    Case study
  </RouterLink>
</template>

<script setup>
import { findCardImage, markSharedHero } from "@/utils/sharedHero.js";

defineProps({
  to: { type: String, required: true },
  name: { type: String, default: "project" },
});

function onClick(e) {
  // Modified clicks open elsewhere, so there is nothing to animate.
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
  markSharedHero(findCardImage(e.currentTarget));
}
</script>

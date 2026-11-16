<template>
  <RouterLink
    :to="to"
    target="_blank"
    rel="noopener"
    class="kbd-focus pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-300/30 bg-sky-300/10 px-[11px] py-[3px] text-xs font-semibold leading-5 text-sky-200 transition-[background-color,border-color] hover:border-sky-300/50 hover:bg-sky-300/20 focus-visible:border-sky-300/50 focus-visible:bg-sky-300/20 motion-reduce:transition-none"
    :aria-label="`Read the ${name} case study (opens in a new tab)`"
  >
    <AppIcon icon="fa-solid fa-book-open" class="h-3.5 w-3.5" aria-hidden="true" />
    Case study
  </RouterLink>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  name: { type: String, default: "project" },
});
</script>

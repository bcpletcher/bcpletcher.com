<template>
  <RouterLink
    :to="to"
    target="_blank"
    rel="noopener"
    class="kbd-focus group/cs pointer-events-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 text-[11px] font-semibold uppercase tracking-widest text-sky-200 transition-[background-color,border-color] hover:border-sky-300/50 hover:bg-sky-300/20 focus-visible:border-sky-300/50 focus-visible:bg-sky-300/20 motion-reduce:transition-none"
    :aria-label="`Read the ${name} case study (opens in a new tab)`"
  >
    Case study
    <AppIcon
      icon="fa-light fa-arrow-right"
      class="h-3 w-3 transition-transform group-hover/cs:translate-x-0.5 motion-reduce:transition-none"
      aria-hidden="true"
    />
  </RouterLink>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  name: { type: String, default: "project" },
});
</script>

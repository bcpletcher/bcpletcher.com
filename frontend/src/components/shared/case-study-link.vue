<template>
  <RouterLink
    :to="to"
    class="kbd-focus group/cs pointer-events-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-sky-300 transition-colors hover:text-sky-200 focus-visible:text-sky-200 motion-reduce:transition-none"
    :aria-label="`Read the ${name} case study`"
  >
    Case study
    <AppIcon
      icon="fa-light fa-arrow-right"
      class="h-3.5 w-3.5 transition-transform group-hover/cs:translate-x-0.5 motion-reduce:transition-none"
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

<template>
  <StickyBar
    :visible="visible"
    :progress="progress"
    max-width-class="max-w-4xl"
  >
    <router-link
      to="/projects"
      class="kbd-focus group/back inline-flex h-11 shrink-0 items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200 motion-reduce:transition-none"
      aria-label="Back to all projects"
    >
      <AppIcon
        icon="fa-light fa-arrow-left"
        class="transition-transform group-hover/back:-translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
      <span class="hidden sm:inline">All projects</span>
    </router-link>

    <span class="h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />

    <p class="min-w-0 truncate text-sm font-semibold text-slate-100">
      {{ title }}
    </p>

    <SectionPills
      v-if="sections.length"
      class="ml-auto hidden md:block"
      :items="sections"
      :active-id="activeId"
      aria-label="Case study sections"
      @select="(id) => $emit('jump', id)"
    />

    <a
      v-if="visitHref"
      :href="visitHref"
      target="_blank"
      rel="noopener noreferrer"
      class="kbd-focus ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-sky-300 px-3.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-sky-200 focus-visible:bg-sky-200 motion-reduce:transition-none md:ml-0"
    >
      Visit
      <span class="sr-only">the project (opens in a new tab)</span>
      <AppIcon
        icon="fa-solid fa-arrow-up-right"
        class="h-3 w-3"
        aria-hidden="true"
      />
    </a>
  </StickyBar>
</template>

<script setup>
import SectionPills from "@/components/shared/section-pills.vue";
import StickyBar from "@/components/shared/sticky-bar.vue";

defineProps({
  title: { type: String, default: "" },
  visitHref: { type: String, default: "" },
  sections: { type: Array, default: () => [] },
  activeId: { type: String, default: null },
  progress: { type: Number, default: 0 },
  visible: { type: Boolean, default: false },
});

defineEmits(["jump"]);
</script>

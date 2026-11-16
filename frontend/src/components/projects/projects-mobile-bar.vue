<template>
  <StickyBar
    class="lg:hidden"
    :visible="visible"
    :progress="progress"
    max-width-class="max-w-7xl"
  >
    <router-link
      to="/"
      class="kbd-focus group/back inline-flex h-11 shrink-0 items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-sky-200 motion-reduce:transition-none"
      aria-label="Back to home"
    >
      <AppIcon
        icon="fa-light fa-arrow-left"
        class="transition-transform group-hover/back:-translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </router-link>

    <span class="h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />

    <SectionPills
      :items="yearItems"
      :active-id="activeId"
      aria-label="Projects by year"
      @select="scrollTo"
    />
  </StickyBar>
</template>

<script setup>
import { computed } from "vue";

import SectionPills from "@/components/shared/section-pills.vue";
import StickyBar from "@/components/shared/sticky-bar.vue";
import { useScrollSpy } from "@/composables/useScrollSpy.js";
import { useStickyBar } from "@/composables/useStickyBar.js";

const props = defineProps({
  // Years that have projects, newest first (each has a section with id `year-<year>`).
  years: { type: Array, default: () => [] },
});

const yearItems = computed(() =>
  props.years.map((y) => ({ id: `year-${y}`, label: String(y) })),
);

const { activeSectionId: activeId, scrollTo } = useScrollSpy({
  sections: () => yearItems.value.map((i) => i.id),
  activationLine: 0.3,
});

const { visible, progress } = useStickyBar({ threshold: 240 });
</script>

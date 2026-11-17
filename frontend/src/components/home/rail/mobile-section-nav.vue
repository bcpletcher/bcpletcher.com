<template>
  <StickyBar
    class="lg:hidden"
    :visible="visible"
    :progress="progress"
    max-width-class="max-w-7xl"
  >
    <!-- Phones: the row fills the bar. Tablet: the lone pill group is centred. -->
    <SectionPills
      class="md:flex-1 md:[&>ul]:justify-center"
      :items="pillItems"
      :active-id="activeSectionId"
      aria-label="Page sections"
      @select="(id) => $emit('nav', id)"
    />
  </StickyBar>
</template>

<script setup>
import { computed } from "vue";

import SectionPills from "@/components/shared/section-pills.vue";
import StickyBar from "@/components/shared/sticky-bar.vue";
import { useStickyBar } from "@/composables/useStickyBar.js";

const props = defineProps({
  navItems: { type: Array, required: true },
  activeSectionId: { type: String, default: null },
});

defineEmits(["nav"]);

const pillItems = computed(() =>
  props.navItems.map((item) => ({ id: item.id, label: item.label })),
);

// Appears once the intro block has scrolled out of view.
const { visible, progress } = useStickyBar({ threshold: 240 });
</script>

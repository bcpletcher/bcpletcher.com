<template>
  <ul
    v-if="sorted.length"
    class="flex flex-wrap gap-2"
    aria-label="Technologies used"
  >
    <li
      v-for="tag in sorted"
      :key="tag"
      class="rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium leading-5 text-sky-300"
    >
      {{ tag }}
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
});

const sorted = computed(() => {
  const arr = Array.isArray(props.items) ? props.items : [];

  return arr
    .map((t) => (t ?? "").toString().trim())
    .filter(Boolean)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
});
</script>

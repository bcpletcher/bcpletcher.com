<template>
  <ul
    v-if="sorted.length"
    class="flex flex-wrap gap-2"
    aria-label="Technologies used"
  >
    <li
      v-for="(tag, i) in sorted"
      :key="tag"
      class="rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium leading-5 text-sky-300"
      :class="capped && i >= maxPhone ? 'max-sm:hidden' : ''"
    >
      {{ tag }}
    </li>
    <li
      v-if="capped && sorted.length > maxPhone"
      class="rounded-full px-1 py-1 text-xs font-medium leading-5 text-slate-500 sm:hidden"
      aria-hidden="true"
    >
      +{{ sorted.length - maxPhone }}
    </li>
  </ul>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
  // Phones only: show this many tags, then "+N". 0 (default) shows them all.
  maxPhone: { type: Number, default: 0 },
});

const capped = computed(() => props.maxPhone > 0);

const sorted = computed(() => {
  const arr = Array.isArray(props.items) ? props.items : [];

  return arr
    .map((t) => (t ?? "").toString().trim())
    .filter(Boolean)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
});
</script>

<template>
  <nav :aria-label="ariaLabel" class="min-w-0">
    <ul ref="listEl" class="flex items-center gap-0.5 overflow-x-auto">
      <li v-for="item in items" :key="item.id" class="shrink-0">
        <!-- 44px tall hit area; the visible pill is the inner span. -->
        <button
          type="button"
          class="kbd-focus group/pill flex min-h-11 cursor-pointer items-center"
          :aria-current="activeId === item.id ? 'true' : undefined"
          @click="$emit('select', item.id)"
        >
          <span
            class="rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors motion-reduce:transition-none"
            :class="
              activeId === item.id
                ? 'bg-white/10 text-slate-100'
                : 'text-slate-400 group-hover/pill:text-slate-100'
            "
          >
            {{ item.label }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";

const props = defineProps({
  items: { type: Array, required: true },
  activeId: { type: String, default: null },
  ariaLabel: { type: String, default: "Sections" },
});

defineEmits(["select"]);

// Keep the active pill in view when the row scrolls horizontally.
const listEl = ref(null);
watch(
  () => props.activeId,
  async () => {
    await nextTick();
    const el = listEl.value?.querySelector('[aria-current="true"]');
    if (!el || !listEl.value) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  },
);
</script>

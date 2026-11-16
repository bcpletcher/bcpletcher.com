<template>
  <nav
    aria-label="Page sections"
    class="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-900/80 backdrop-blur-md transition-[transform,opacity] duration-300 motion-reduce:transition-none lg:hidden"
    :class="
      visible
        ? 'translate-y-0 opacity-100'
        : 'pointer-events-none -translate-y-full opacity-0'
    "
    :inert="!visible || undefined"
  >
    <ul
      ref="listEl"
      class="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 md:px-10"
    >
      <li v-for="item in navItems" :key="item.id" class="shrink-0">
        <!-- 44px tall hit area; the visible pill is the inner span. -->
        <button
          type="button"
          class="kbd-focus group/pill flex min-h-11 cursor-pointer items-center"
          :aria-current="activeSectionId === item.id ? 'true' : undefined"
          @click="$emit('nav', item.id)"
        >
          <span
            class="rounded-full px-2.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors motion-reduce:transition-none sm:px-4 sm:tracking-widest"
            :class="
              activeSectionId === item.id
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
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  navItems: { type: Array, required: true },
  activeSectionId: { type: String, default: null },
});

defineEmits(["nav"]);

// Keep the active pill in view when the bar scrolls horizontally.
const listEl = ref(null);
watch(
  () => props.activeSectionId,
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

// Appears once the intro block has scrolled out of view.
const visible = ref(false);

const update = () => {
  visible.value = window.scrollY > 240;
};

onMounted(() => {
  update();
  window.addEventListener("scroll", update, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", update);
});
</script>

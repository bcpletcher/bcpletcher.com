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
    <ul class="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 md:px-10">
      <li v-for="item in navItems" :key="item.id">
        <button
          type="button"
          class="kbd-focus cursor-pointer rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors motion-reduce:transition-none"
          :class="
            activeSectionId === item.id
              ? 'bg-white/10 text-slate-100'
              : 'text-slate-400 hover:text-slate-100'
          "
          :aria-current="activeSectionId === item.id ? 'true' : undefined"
          @click="$emit('nav', item.id)"
        >
          {{ item.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps({
  navItems: { type: Array, required: true },
  activeSectionId: { type: String, default: null },
});

defineEmits(["nav"]);

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

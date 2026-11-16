<template>
  <div
    class="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-900/80 backdrop-blur-md transition-[transform,opacity] duration-300 motion-reduce:transition-none"
    :class="
      visible
        ? 'translate-y-0 opacity-100'
        : 'pointer-events-none -translate-y-full opacity-0'
    "
    :inert="!visible || undefined"
  >
    <!-- Same side padding and width as the page content below. -->
    <div class="px-6 md:px-12">
      <div class="mx-auto flex h-14 max-w-4xl items-center gap-3 sm:gap-5">
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

      <nav
        v-if="sections.length"
        class="ml-auto hidden items-center gap-0.5 md:flex"
        aria-label="Case study sections"
      >
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          class="kbd-focus rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors motion-reduce:transition-none"
          :class="
            activeId === s.id
              ? 'bg-white/10 text-slate-100'
              : 'text-slate-400 hover:text-slate-100'
          "
          :aria-current="activeId === s.id ? 'true' : undefined"
          @click="$emit('jump', s.id)"
        >
          {{ s.label }}
        </button>
      </nav>

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
      </div>
    </div>

    <!-- Reading progress -->
    <span
      class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-sky-300"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
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

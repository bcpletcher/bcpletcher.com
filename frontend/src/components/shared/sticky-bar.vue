<template>
  <!-- Shared shell for the sticky top bars (home, projects, case studies): same height,
       material, side padding and reading-progress line everywhere. Pass `lg:hidden` etc. as
       a class to limit where it shows. -->
  <div
    class="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-900/80 backdrop-blur-md transition-[transform,opacity] duration-300 motion-reduce:transition-none"
    :class="
      visible
        ? 'translate-y-0 opacity-100'
        : 'pointer-events-none -translate-y-full opacity-0'
    "
    :inert="!visible || undefined"
  >
    <!-- Same side padding as the app shell, so the bar lines up with the page below. -->
    <div class="px-6 md:px-12">
      <div
        class="mx-auto flex h-14 items-center gap-3 sm:gap-5"
        :class="maxWidthClass"
      >
        <slot />
      </div>
    </div>

    <span
      class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-sky-300"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  // Width of the inner row: match the page content (max-w-7xl app shell, max-w-4xl reading).
  maxWidthClass: { type: String, default: "max-w-7xl" },
});
</script>

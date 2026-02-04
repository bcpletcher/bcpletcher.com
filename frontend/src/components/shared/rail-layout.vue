<template>
  <div class="min-h-screen w-full">
    <div
      class="rail-layout-grid grid grid-cols-1 gap-8 lg:gap-16"
      :class="railColsClass"
      :style="
        railColsClass && railColsClass.trim()
          ? undefined
          : { '--rail-w': railWidthRem + 'rem' }
      "
    >
      <!-- Sticky rail column on desktop: stretch to match page height so sticky never releases early -->
      <div class="lg:self-stretch">
        <div class="lg:sticky" :class="stickyTopClass">
          <slot name="rail" />
        </div>
      </div>

      <div class="lg:py-24">
        <slot name="main" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * Tailwind classes for the sticky rail top offset.
   * Defaults to the Home page behavior.
   */
  stickyTopClass: { type: String, default: "lg:top-24" },

  /**
   * Desktop rail width in rem (e.g. 32 -> 32rem rail).
   * Applied via CSS variable at lg+ so it works with Tailwind's class purging.
   */
  railWidthRem: { type: Number, default: 32 },

  /**
   * Optional static Tailwind class to control the desktop grid columns.
   * If provided, it overrides railWidthRem.
   * Example: "lg:grid-cols-[32rem_1fr]".
   */
  railColsClass: { type: String, default: "" },
});
</script>

<style scoped>
.rail-layout-grid {
  --rail-w: 32rem;
}

@media (min-width: 1024px) {
  .rail-layout-grid {
    grid-template-columns: var(--rail-w) 1fr;
  }
}
</style>

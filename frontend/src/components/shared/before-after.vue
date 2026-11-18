<template>
  <div
    class="relative isolate aspect-video w-full select-none overflow-hidden rounded-lg ring-1 ring-black/20"
    :style="{ '--split': split + '%' }"
  >
    <!-- Bottom layer: the "after" screen. Top layer: the "before" screen, clipped to the
         left of the handle. -->
    <img
      class="absolute inset-0 h-full w-full object-cover object-top"
      :src="after"
      :srcset="afterSet || undefined"
      sizes="(min-width: 896px) 56rem, 100vw"
      :alt="afterAlt"
      width="1280"
      height="720"
      loading="lazy"
      decoding="async"
      draggable="false"
    />
    <img
      class="before-layer absolute inset-0 h-full w-full object-cover object-top"
      :src="before"
      :srcset="beforeSet || undefined"
      sizes="(min-width: 896px) 56rem, 100vw"
      :alt="beforeAlt"
      width="1280"
      height="720"
      loading="lazy"
      decoding="async"
      draggable="false"
    />

    <span
      class="pointer-events-none absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-100 backdrop-blur"
      aria-hidden="true"
    >
      {{ beforeLabel }}
    </span>
    <span
      class="pointer-events-none absolute right-3 top-3 rounded-full bg-sky-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-900"
      aria-hidden="true"
    >
      {{ afterLabel }}
    </span>

    <!-- Divider + grip -->
    <div
      class="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.25)]"
      :style="{ left: split + '%' }"
      aria-hidden="true"
    >
      <span
        class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-slate-950/80 text-white shadow-lg backdrop-blur"
        :class="{ 'scale-110': dragging }"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 7-5 5 5 5" />
          <path d="m15 7 5 5-5 5" />
        </svg>
      </span>
    </div>

    <!-- The real control: a native slider, so touch, mouse and keyboard all work. -->
    <input
      v-model.number="split"
      type="range"
      min="0"
      max="100"
      step="0.5"
      class="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
      :aria-label="`Compare ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()}`"
      :aria-valuetext="`${Math.round(split)}% ${beforeLabel.toLowerCase()}`"
      @pointerdown="dragging = true"
      @pointerup="dragging = false"
      @pointercancel="dragging = false"
      @keydown.left.prevent="nudge(-5)"
      @keydown.right.prevent="nudge(5)"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  before: { type: String, required: true },
  after: { type: String, required: true },
  // Optional responsive candidates (src-set strings) for storage-hosted images.
  beforeSet: { type: String, default: "" },
  afterSet: { type: String, default: "" },
  beforeLabel: { type: String, default: "Before" },
  afterLabel: { type: String, default: "After" },
  beforeAlt: { type: String, default: "Before" },
  afterAlt: { type: String, default: "After" },
});

const split = ref(50);
const dragging = ref(false);

function nudge(delta) {
  split.value = Math.min(100, Math.max(0, split.value + delta));
}
</script>

<style scoped>
.before-layer {
  clip-path: inset(0 calc(100% - var(--split)) 0 0);
}
</style>

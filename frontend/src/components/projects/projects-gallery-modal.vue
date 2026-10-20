<template>
  <ModalWrapper
    v-model="internalOpen"
    :labelledby="titleId"
    :describedby="descId"
    z-class="z-200"
    panel-selector="[data-modal-panel]"
    @close="close"
  >
    <div
      ref="panelRef"
      data-modal-panel
      class="relative w-[98vw] max-w-none overflow-hidden rounded-2xl border border-slate-800 bg-base-background/90 shadow-2xl backdrop-blur"
      @click.stop
    >
      <header
        class="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 sm:px-6"
      >
        <div class="min-w-0">
          <p
            :id="titleId"
            class="truncate text-sm tracking-widest text-slate-400"
          >
            {{ title || "Project Gallery" }}
          </p>
          <p :id="descId" class="sr-only">
            Image gallery modal. Use left/right buttons or arrow keys to navigate.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            ref="closeButtonRef"
            type="button"
            class="kbd-focus cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-white/5 text-slate-200 transition-standard hover:bg-white/10 focus-visible:bg-white/10"
            aria-label="Close"
            @click="close"
          >
            <AppIcon icon="fa-light fa-xmark" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div class="relative bg-black/30">
        <!-- Navigation buttons -->
        <button
          type="button"
          class="kbd-focus cursor-pointer absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-black/30 text-slate-100 backdrop-blur transition-standard hover:bg-black/45 focus-visible:bg-black/45"
          aria-label="Previous image"
          @click="slidePrev"
        >
          <AppIcon icon="fa-light fa-chevron-left" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="kbd-focus cursor-pointer absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-black/30 text-slate-100 backdrop-blur transition-standard hover:bg-black/45 focus-visible:bg-black/45"
          aria-label="Next image"
          @click="slideNext"
        >
          <AppIcon icon="fa-light fa-chevron-right" aria-hidden="true" />
        </button>

        <!-- 16:9 stage (size to the largest possible area within the viewport) -->
        <div class="w-full aspect-video max-h-[calc(100vh-11rem)]">
          <!-- Native scroll-snap carousel: touch drag, momentum and edge resistance come from the
               platform (1:1 tracking, interruptible), arrows/keys use the same scroll position. -->
          <div
            ref="trackRef"
            class="gallery-track flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none"
            role="group"
            aria-roledescription="carousel"
            :aria-label="`${title || 'Project'} gallery`"
            tabindex="0"
            @scroll.passive="onScroll"
            @keydown.left.prevent="slidePrev"
            @keydown.right.prevent="slideNext"
            @keydown.home.prevent="goTo(0)"
            @keydown.end.prevent="goTo(images.length - 1)"
          >
            <div
              v-for="(src, i) in images"
              :key="getImageKey(src, i)"
              class="h-full w-full shrink-0 snap-center snap-always"
              role="group"
              aria-roledescription="slide"
              :aria-label="`${i + 1} of ${images.length}`"
            >
              <div class="h-full w-full overflow-hidden">
                <img
                  v-img-fade
                  class="h-full w-full select-none object-contain max-h-[calc(100vh-11rem)]"
                  :src="responsiveFor(src).src"
                  :alt="`${title || 'Project'} image ${i + 1}`"
                  width="1280"
                  height="720"
                  :loading="Math.abs(i - activeIndex) <= 1 ? 'eager' : 'lazy'"
                  decoding="async"
                  draggable="false"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer controls -->
        <footer
          class="flex items-center justify-between gap-4 border-t border-slate-800 px-4 py-3 text-xs text-slate-400 sm:px-6"
        >
          <div class="flex items-center gap-2">
            <span class="tracking-widest">{{ activeIndex + 1 }}</span>
            <span class="opacity-60">/</span>
            <span class="tracking-widest">{{ images.length }}</span>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="kbd-focus cursor-pointer inline-flex items-center gap-2 rounded-full border border-slate-800 bg-white/5 px-4 py-2 text-slate-200 transition-standard hover:bg-white/10 focus-visible:bg-white/10"
              @click="toggleFullscreen"
            >
              <AppIcon icon="fa-light fa-expand" aria-hidden="true" />
              <span class="tracking-widest">FULLSCREEN</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch, computed } from "vue";

import ModalWrapper from "@/components/shared/modal-wrapper.vue";
import {
  buildResponsiveImageSourcesFromImageValue,
  getStoragePathFromImageValue,
  buildMediaUrl,
} from "@/utils/mediaStorageImages.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  images: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue", "close"]);

const panelRef = ref(null);
const closeButtonRef = ref(null);

const trackRef = ref(null);
const activeIndex = ref(0);

const responsiveFor = (img) => {
  const responsive = buildResponsiveImageSourcesFromImageValue(img, {
    widths: [480, 960],
    preferWidth: 960,
  });
  const originalPath = getStoragePathFromImageValue(img);
  const originalUrl = originalPath ? buildMediaUrl(originalPath) : "";
  // The gallery stage is large (up to full viewport), so it always uses the original image.
  // The 480w/960w srcset variants are for the small card thumbnails only; using them here
  // would look soft on large or high-density screens.
  return {
    ...responsive,
    src: originalUrl || responsive.src,
    srcset: "",
  };
};

function getImageKey(img, index) {
  if (!img) return `img-${index}`;
  if (typeof img === "object" && img.path) return `img-path-${img.path}`;
  return `img-${index}`;
}

function close() {
  emit("update:modelValue", false);
  emit("close");
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

let scrollRaf = 0;
function onScroll() {
  // Keep the counter in step with the snap position while dragging (one read per frame).
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    const track = trackRef.value;
    if (!track || !track.clientWidth) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    activeIndex.value = Math.min(Math.max(index, 0), props.images.length - 1);
  });
}

function goTo(index, { instant = false } = {}) {
  const track = trackRef.value;
  if (!track || !props.images.length) return;
  const clamped = Math.min(Math.max(index, 0), props.images.length - 1);
  track.scrollTo({
    left: clamped * track.clientWidth,
    behavior: instant || prefersReducedMotion() ? "auto" : "smooth",
  });
  activeIndex.value = clamped;
}

function slidePrev() {
  goTo(activeIndex.value - 1);
}

function slideNext() {
  goTo(activeIndex.value + 1);
}

// Keep the current slide aligned if the viewport changes size (rotation, fullscreen).
function realign() {
  goTo(activeIndex.value, { instant: true });
}

onBeforeUnmount(() => {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  window.removeEventListener("resize", realign);
});

async function toggleFullscreen() {
  const el = panelRef.value;
  if (!el) return;

  try {
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    // no-op
  }
}

let lastFocusedEl = null;

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    lastFocusedEl = document.activeElement;

    // Start at the requested slide (instantly) when opening.
    await nextTick();
    goTo(props.initialIndex, { instant: true });
    window.addEventListener("resize", realign);
  },
);

watch(
  () => props.modelValue,
  async (isOpen, wasOpen) => {
    if (!wasOpen || isOpen) return;
    window.removeEventListener("resize", realign);

    if (lastFocusedEl && lastFocusedEl.focus) {
      try {
        lastFocusedEl.focus();
      } catch {
        // no-op
      }
    }
  },
);

const titleId = `gallery-title-${Math.random().toString(36).slice(2)}`;
const descId = `gallery-desc-${Math.random().toString(36).slice(2)}`;

const internalOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});
</script>

<style scoped>
.gallery-track {
  scrollbar-width: none;
}

.gallery-track::-webkit-scrollbar {
  display: none;
}
</style>

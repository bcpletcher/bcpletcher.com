<template>
  <ModalWrapper
    v-model="internalOpen"
    :labelledby="titleId"
    :describedby="descId"
    z-class="z-200"
    :panel-selector="flipFrom ? null : '[data-modal-panel]'"
    :close-on-backdrop="false"
    :close-on-escape="false"
    @close="onWrapperClose"
  >
    <!-- Full-screen hit area: a click on the dim area (outside the panel) closes. -->
    <div
      class="flex h-full w-full items-center justify-center"
      @click.self="requestClose"
      @keydown.esc.stop.prevent="requestClose"
    >
      <div
        ref="panelRef"
        data-modal-panel
        class="gallery-panel relative w-[98vw] max-w-[1600px] overflow-hidden rounded-2xl border border-white/10 bg-base-background/90 shadow-2xl backdrop-blur"
        :class="{ 'is-closing': closing, 'is-dragging': dragging }"
        :style="panelStyle"
        @click.stop
      >
        <!-- Stage (image-led: the chrome floats over the image) -->
        <div class="relative bg-black/40">
          <!-- Header overlay -->
          <header
            class="gallery-chrome pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 bg-linear-to-b from-black/80 via-black/40 to-transparent px-4 pb-10 pt-3 sm:px-6"
          >
            <div class="min-w-0 pt-1.5">
              <p
                :id="titleId"
                class="truncate text-sm font-semibold tracking-wide text-slate-100 [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]"
              >
                {{ title || "Project Gallery" }}
              </p>
              <p :id="descId" class="sr-only">
                Image gallery. Use the left and right arrow keys or swipe to
                change images, double-tap to zoom, Escape or swipe down to
                close.
              </p>
            </div>

            <div class="pointer-events-auto flex shrink-0 items-center gap-2">
              <a
                v-if="caseStudyHref"
                :href="caseStudyHref"
                class="kbd-focus hidden h-10 items-center rounded-full border border-white/15 bg-black/40 px-4 text-xs font-semibold uppercase tracking-widest text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60 sm:inline-flex"
                @click.prevent="onCaseStudyClick"
              >
                Case study
              </a>
              <button
                type="button"
                class="kbd-focus hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60 md:inline-flex"
                :aria-pressed="isZoomed"
                :aria-label="isZoomed ? 'Zoom out' : 'Zoom in'"
                @click="toggleZoom()"
              >
                <AppIcon
                  :icon="
                    isZoomed
                      ? 'fa-light fa-magnifying-glass-minus'
                      : 'fa-light fa-magnifying-glass-plus'
                  "
                  aria-hidden="true"
                />
              </button>
              <button
                v-if="shareUrl"
                type="button"
                class="kbd-focus inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 text-xs font-semibold uppercase tracking-widest text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60 sm:px-4"
                aria-label="Copy link to this project"
                @click="copyLink"
              >
                <AppIcon
                  :icon="copied ? 'fa-light fa-check' : 'fa-light fa-link'"
                  aria-hidden="true"
                />
                <span class="hidden sm:inline">{{
                  copied ? "Copied" : "Copy link"
                }}</span>
              </button>
              <button
                type="button"
                class="kbd-focus hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60 md:inline-flex"
                aria-label="Toggle fullscreen"
                @click="toggleFullscreen"
              >
                <AppIcon icon="fa-light fa-expand" aria-hidden="true" />
              </button>
              <button
                ref="closeButtonRef"
                type="button"
                class="kbd-focus inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60"
                aria-label="Close"
                @click="requestClose"
              >
                <AppIcon icon="fa-light fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </header>

          <!-- Previous / next -->
          <button
            type="button"
            class="gallery-chrome kbd-focus absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60 disabled:pointer-events-none disabled:opacity-0 sm:inline-flex"
            aria-label="Previous image"
            :disabled="activeIndex <= 0"
            @click="slidePrev"
          >
            <AppIcon icon="fa-light fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="gallery-chrome kbd-focus absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-100 backdrop-blur transition-standard hover:bg-black/60 focus-visible:bg-black/60 disabled:pointer-events-none disabled:opacity-0 sm:inline-flex"
            aria-label="Next image"
            :disabled="activeIndex >= images.length - 1"
            @click="slideNext"
          >
            <AppIcon icon="fa-light fa-chevron-right" aria-hidden="true" />
          </button>

          <!-- Stage: as large as the viewport allows -->
          <div
            class="gallery-stage aspect-video max-h-[calc(100dvh-1.5rem)] w-full sm:max-h-[calc(100dvh-3rem)]"
            :class="images.length > 1 ? 'md:max-h-[calc(100dvh-8.25rem)]!' : ''"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerCancel"
          >
            <!-- Native scroll-snap carousel: touch drag, momentum and edge resistance come from the
                 platform (1:1 tracking, interruptible); arrows/keys use the same scroll position. -->
            <div
              ref="trackRef"
              class="gallery-track flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none"
              :class="{ 'overflow-x-hidden!': isZoomed }"
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
                <div
                  :ref="(el) => setSlideRef(el, i)"
                  class="gallery-slide h-full w-full"
                  :class="
                    isZoomed && i === activeIndex
                      ? 'overflow-auto overscroll-contain'
                      : 'overflow-hidden'
                  "
                >
                  <img
                    v-img-fade
                    class="select-none"
                    :class="
                      isZoomed && i === activeIndex
                        ? 'max-w-none cursor-zoom-out object-cover'
                        : 'h-full w-full cursor-zoom-in object-contain'
                    "
                    :style="
                      isZoomed && i === activeIndex
                        ? {
                            width: ZOOM_FACTOR * 100 + '%',
                            height: ZOOM_FACTOR * 100 + '%',
                          }
                        : undefined
                    "
                    :src="responsiveFor(src).src"
                    :alt="`${title || 'Project'} image ${i + 1}`"
                    width="1280"
                    height="720"
                    :loading="Math.abs(i - activeIndex) <= 1 ? 'eager' : 'lazy'"
                    decoding="async"
                    draggable="false"
                    @dblclick.prevent="onDoubleClick($event, i)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Capsule pagination + keyboard hint -->
          <div
            v-if="images.length > 1"
            class="gallery-chrome pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-center px-4"
          >
            <div
              class="gallery-pill pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-md"
              role="tablist"
              aria-label="Choose image"
            >
              <template v-if="images.length <= MAX_DOTS">
                <button
                  v-for="(_, i) in images"
                  :key="i"
                  type="button"
                  role="tab"
                  class="kbd-focus group/dot flex h-8 cursor-pointer items-center justify-center px-1"
                  :aria-selected="i === activeIndex"
                  :aria-label="`Image ${i + 1} of ${images.length}`"
                  @click="goTo(i)"
                >
                  <span
                    class="block h-2 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none"
                    :class="
                      i === activeIndex
                        ? 'w-6 bg-slate-100'
                        : 'w-2 bg-white/40 group-hover/dot:bg-white/70'
                    "
                  />
                </button>
              </template>
              <span
                v-else
                class="px-3 py-1 text-xs font-semibold tracking-widest text-slate-100"
                aria-hidden="true"
              >
                {{ activeIndex + 1 }} / {{ images.length }}
              </span>
            </div>
          </div>

          <p
            class="gallery-chrome pointer-events-none absolute bottom-4 right-6 z-20 hidden rounded-full bg-black/50 px-3 py-1.5 text-xs tracking-wide text-slate-200 backdrop-blur-md lg:block"
            aria-hidden="true"
          >
            ← → browse · Esc close
          </p>
        </div>

        <!-- Thumbnails -->
        <div
          v-if="images.length > 1"
          ref="thumbsRef"
          class="gallery-chrome hidden gap-2 overflow-x-auto border-t border-white/10 bg-black/30 px-4 py-3 md:flex"
          role="group"
          aria-label="Thumbnails"
        >
          <button
            v-for="(src, i) in images"
            :key="'t-' + getImageKey(src, i)"
            type="button"
            class="kbd-focus relative aspect-video h-14 shrink-0 cursor-pointer overflow-hidden rounded-md border transition-[border-color,opacity] duration-200 motion-reduce:transition-none"
            :class="
              i === activeIndex
                ? 'border-sky-300 opacity-100'
                : 'border-white/10 opacity-60 hover:opacity-100'
            "
            :data-thumb-index="i"
            :aria-label="`Show image ${i + 1}`"
            :aria-current="i === activeIndex ? 'true' : undefined"
            @click="goTo(i)"
          >
            <img
              v-img-fade
              class="h-full w-full object-cover"
              :src="thumbFor(src)"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </button>
        </div>

        <p class="sr-only" aria-live="polite">
          Image {{ activeIndex + 1 }} of {{ images.length }}
        </p>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";

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
  // Rect (viewport coords) of the card image the gallery opened from, for the
  // card <-> lightbox motion. Null when there is nothing to animate from.
  originRect: { type: Object, default: null },
  // Re-reads the origin's current rect on close (the page may have scrolled).
  getOriginRect: { type: Function, default: null },
  // Optional deep link / case-study targets.
  shareUrl: { type: String, default: "" },
  caseStudyHref: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "close"]);
const router = useRouter();

const ZOOM_FACTOR = 2.2;
const MAX_DOTS = 10;
const SWIPE_CLOSE_PX = 110;

const panelRef = ref(null);
const closeButtonRef = ref(null);
const trackRef = ref(null);
const thumbsRef = ref(null);
const activeIndex = ref(0);
const closing = ref(false);
const copied = ref(false);
const zoomedIndex = ref(null);
const isZoomed = computed(() => zoomedIndex.value === activeIndex.value);

const slideEls = [];
const setSlideRef = (el, i) => {
  if (el) slideEls[i] = el;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

// Only animate from the card when we have a rect and motion is allowed.
const flipFrom = computed(() =>
  props.originRect && !prefersReducedMotion() ? props.originRect : null,
);

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

const thumbFor = (img) =>
  buildResponsiveImageSourcesFromImageValue(img, {
    widths: [480],
    preferWidth: 480,
  }).src;

function getImageKey(img, index) {
  if (!img) return `img-${index}`;
  if (typeof img === "object" && img.path) return `img-path-${img.path}`;
  return `img-${index}`;
}

/* ---------- carousel ---------- */

let scrollRaf = 0;
function onScroll() {
  // Keep the pagination in step with the snap position while dragging (one read per frame).
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

const slidePrev = () => goTo(activeIndex.value - 1);
const slideNext = () => goTo(activeIndex.value + 1);

// Keep the current slide aligned if the viewport changes size (rotation, fullscreen).
function realign() {
  goTo(activeIndex.value, { instant: true });
}

// Moving to another image leaves zoom, and brings its thumbnail into view.
watch(activeIndex, async (i, prev) => {
  if (zoomedIndex.value !== null && zoomedIndex.value !== i) {
    zoomedIndex.value = null;
  }
  void prev;
  await nextTick();
  const thumb = thumbsRef.value?.querySelector(`[data-thumb-index="${i}"]`);
  if (!thumb || !thumbsRef.value) return;
  const box = thumbsRef.value;
  const target = thumb.offsetLeft - (box.clientWidth - thumb.clientWidth) / 2;
  box.scrollTo({
    left: target,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
});

/* ---------- zoom (double-tap / double-click / button) ---------- */

function toggleZoom(point) {
  if (isZoomed.value) {
    zoomedIndex.value = null;
    return;
  }
  const i = activeIndex.value;
  const slide = slideEls[i];
  const rect = slide?.getBoundingClientRect();
  zoomedIndex.value = i;
  nextTick(() => {
    if (!slide || !rect) return;
    // Centre the zoomed image on the point that was tapped (or the middle).
    const fx = point && rect.width ? (point.x - rect.left) / rect.width : 0.5;
    const fy = point && rect.height ? (point.y - rect.top) / rect.height : 0.5;
    slide.scrollLeft = fx * slide.scrollWidth - slide.clientWidth / 2;
    slide.scrollTop = fy * slide.scrollHeight - slide.clientHeight / 2;
  });
}

function onDoubleClick(event, i) {
  if (i !== activeIndex.value) return;
  toggleZoom({ x: event.clientX, y: event.clientY });
}

/* ---------- touch gestures: double-tap zoom + swipe down to close ---------- */

const dragging = ref(false);
const dragY = ref(0);
const panelStyle = computed(() =>
  dragY.value > 0
    ? {
        transform: `translateY(${dragY.value}px)`,
        opacity: String(Math.max(0.35, 1 - dragY.value / 500)),
      }
    : undefined,
);

let gesture = null;
let lastTap = { t: 0, x: 0, y: 0 };

function onPointerDown(e) {
  if (e.pointerType !== "touch") return;
  gesture = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    t: performance.now(),
    vertical: false,
    moved: false,
  };
}

function onPointerMove(e) {
  if (!gesture || e.pointerId !== gesture.id) return;
  const dx = e.clientX - gesture.x;
  const dy = e.clientY - gesture.y;
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) gesture.moved = true;
  if (isZoomed.value) return;
  if (!gesture.vertical && dy > 12 && dy > Math.abs(dx) * 1.5) {
    gesture.vertical = true;
    dragging.value = true;
  }
  if (gesture.vertical) dragY.value = Math.max(0, dy);
}

function onPointerUp(e) {
  if (!gesture || e.pointerId !== gesture.id) return;
  const g = gesture;
  gesture = null;

  if (g.vertical) {
    const dy = e.clientY - g.y;
    const velocity = dy / Math.max(1, performance.now() - g.t);
    dragging.value = false;
    if (dy > SWIPE_CLOSE_PX || velocity > 0.6) {
      dragY.value = 0;
      requestClose({ skipFlip: true });
    } else {
      dragY.value = 0; // eases back via the .gallery-panel transition
    }
    return;
  }

  if (!g.moved) {
    const now = performance.now();
    if (
      now - lastTap.t < 320 &&
      Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30
    ) {
      lastTap = { t: 0, x: 0, y: 0 };
      toggleZoom({ x: e.clientX, y: e.clientY });
    } else {
      lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  }
}

function onPointerCancel() {
  gesture = null;
  dragging.value = false;
  dragY.value = 0;
}

/* ---------- open / close motion (card <-> lightbox) ---------- */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function flipTransform(slide, from) {
  const to = slide.getBoundingClientRect();
  if (!to.width || !from?.width) return null;
  const s = from.width / to.width;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${s})`;
}

function animateOpenFromCard() {
  const from = flipFrom.value;
  const slide = slideEls[activeIndex.value];
  if (!from || !slide) return;
  const start = flipTransform(slide, from);
  if (!start) return;
  slide.style.transformOrigin = "center center";
  slide.style.zIndex = "5";
  const anim = slide.animate(
    [
      { transform: start, borderRadius: "6px" },
      { transform: "none", borderRadius: "0px" },
    ],
    { duration: 440, easing: EASE },
  );
  anim.finished.finally(() => {
    slide.style.zIndex = "";
  });
}

async function requestClose({ skipFlip = false } = {}) {
  if (closing.value) return;
  closing.value = true;

  const slide = slideEls[activeIndex.value];
  const target = props.getOriginRect?.();
  const canFlip =
    !skipFlip &&
    !prefersReducedMotion() &&
    slide &&
    target &&
    activeIndex.value === props.initialIndex &&
    !isZoomed.value &&
    target.bottom > 0 &&
    target.top < window.innerHeight;

  if (canFlip) {
    const end = flipTransform(slide, target);
    if (end) {
      slide.style.zIndex = "5";
      try {
        await slide.animate([{ transform: "none" }, { transform: end }], {
          duration: 320,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        }).finished;
      } catch {
        // animation cancelled: just close
      }
    }
  }

  emit("update:modelValue", false);
  emit("close");
}

function onWrapperClose() {
  // The wrapper no longer closes itself (backdrop/Esc are handled here), so this only fires
  // for programmatic closes; nothing to do.
}

/* ---------- misc ---------- */

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.shareUrl);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1800);
  } catch {
    // Clipboard unavailable: fall back to selecting nothing, the URL is already in the bar.
  }
}

function onCaseStudyClick() {
  emit("update:modelValue", false);
  emit("close");
  router.push(props.caseStudyHref);
}

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
  async (isOpen, wasOpen) => {
    if (isOpen) {
      closing.value = false;
      zoomedIndex.value = null;
      dragY.value = 0;
      lastFocusedEl = document.activeElement;

      // Start at the requested slide (instantly) when opening.
      await nextTick();
      goTo(props.initialIndex, { instant: true });
      window.addEventListener("resize", realign);
      animateOpenFromCard();
      return;
    }

    if (!wasOpen) return;
    window.removeEventListener("resize", realign);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

    if (lastFocusedEl && lastFocusedEl.focus) {
      try {
        lastFocusedEl.focus();
      } catch {
        // no-op
      }
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  window.removeEventListener("resize", realign);
});

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
  /* Vertical drags are ours (swipe down to close); horizontal ones scroll the carousel. */
  touch-action: pan-x;
}

.gallery-track::-webkit-scrollbar {
  display: none;
}

.gallery-slide {
  scrollbar-width: thin;
}

.gallery-panel {
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 200ms ease-out;
}

.gallery-panel.is-dragging {
  transition: none;
}

/* While flying back to the card, the surrounding chrome gets out of the way first. */
.gallery-chrome {
  transition: opacity 180ms ease-out;
}

.gallery-panel.is-closing .gallery-chrome {
  opacity: 0;
}

.gallery-panel.is-closing {
  background-color: transparent;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-panel,
  .gallery-chrome {
    transition: none;
  }
}
</style>

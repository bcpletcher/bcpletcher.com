<template>
  <ModalWrapper
    v-model="internalOpen"
    :labelledby="titleId"
    :describedby="descId"
    z-class="z-200"
    :panel-selector="flipFrom ? null : '[data-modal-panel]'"
    :close-on-backdrop="false"
    :close-on-escape="false"
  >
    <!-- Full-screen hit area: a click on the dim area (outside the panel) closes. -->
    <div
      class="flex h-full w-full items-center justify-center"
      @click.self="requestClose"
    >
      <div
        ref="panelRef"
        data-modal-panel
        class="gallery-panel relative w-[98vw] max-w-[1600px] overflow-hidden rounded-2xl border border-white/10 bg-base-background/95 shadow-[0_32px_80px_-16px_rgb(0_0_0/0.75)] ring-1 ring-black/40 backdrop-blur"
        :class="{ 'is-closing': closing, 'is-dragging': dragging }"
        :style="panelStyle"
        @click.stop
        @pointerdown.capture="onPanelPointerDown"
      >
        <!-- Header: a slim bar above the image, so the screenshot itself stays unobstructed
             (titles and controls floating over light, busy UI screenshots were hard to read). -->
        <header
          class="gallery-chrome flex h-13 items-center justify-between gap-3 border-b border-white/10 pl-4 pr-1 sm:pl-5 sm:pr-2"
        >
          <div class="flex min-w-0 items-baseline gap-3">
            <p
              :id="titleId"
              class="truncate text-sm font-semibold tracking-wide text-slate-100"
            >
              {{ title || "Project Gallery" }}
            </p>
            <span
              v-if="images.length > 1"
              class="shrink-0 text-xs font-medium tabular-nums text-slate-400"
              aria-hidden="true"
            >
              {{ activeIndex + 1 }} / {{ images.length }}
            </span>
            <p :id="descId" class="sr-only">
              Image gallery. Use the left and right arrow keys or swipe to
              change images, double-tap to zoom, Escape or swipe down to close.
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-0.5">
            <a
              v-if="caseStudyHref"
              :href="caseStudyHref"
              class="kbd-focus relative mr-1.5 hidden h-9 items-center rounded-full border border-sky-300/30 bg-sky-300/10 px-3.5 text-[11px] font-semibold uppercase tracking-widest text-sky-200 transition-[background-color,border-color,scale] duration-200 after:absolute after:inset-x-0 after:-inset-y-1 hover:border-sky-300/50 hover:bg-sky-300/20 focus-visible:border-sky-300/50 focus-visible:bg-sky-300/20 motion-reduce:transition-none sm:inline-flex"
              @click.prevent="onCaseStudyClick"
            >
              Case study
            </a>
            <button
              v-if="shareUrl"
              type="button"
              class="kbd-focus relative inline-flex h-11 w-11 cursor-pointer items-center justify-center gap-2 rounded-full text-[11px] font-semibold uppercase tracking-widest transition-[background-color,border-color,color,scale] duration-200 after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white motion-reduce:transition-none sm:mr-1.5 sm:h-9 sm:w-auto sm:border sm:border-white/10 sm:px-3.5"
              :class="copied ? 'text-sky-300' : 'text-slate-300'"
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
              class="kbd-focus h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-[background-color,color,scale] duration-200 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white motion-reduce:transition-none md:h-10 md:w-10 hidden md:inline-flex"
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
            <span
              class="mx-1 hidden h-5 w-px bg-white/10 md:block"
              aria-hidden="true"
            />
            <button
              ref="closeButtonRef"
              type="button"
              class="kbd-focus h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-[background-color,color,scale] duration-200 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white motion-reduce:transition-none md:h-10 md:w-10 inline-flex"
              aria-label="Close"
              @click="requestClose"
            >
              <AppIcon
                icon="fa-light fa-xmark"
                class="text-base"
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        <!-- Stage -->
        <div class="gallery-stage-wrap relative bg-black/50">
          <!-- Previous / next -->
          <button
            type="button"
            class="gallery-chrome gallery-nav kbd-focus absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white shadow-lg shadow-black/30 ring-1 ring-black/20 backdrop-blur-md hover:bg-slate-950/80 focus-visible:bg-slate-950/80 disabled:pointer-events-none disabled:opacity-0 sm:inline-flex left-3 lg:left-4"
            aria-label="Previous image"
            :disabled="activeIndex <= 0"
            @click="slidePrev"
          >
            <AppIcon icon="fa-light fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="gallery-chrome gallery-nav kbd-focus absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white shadow-lg shadow-black/30 ring-1 ring-black/20 backdrop-blur-md hover:bg-slate-950/80 focus-visible:bg-slate-950/80 disabled:pointer-events-none disabled:opacity-0 sm:inline-flex right-3 lg:right-4"
            aria-label="Next image"
            :disabled="activeIndex >= images.length - 1"
            @click="slideNext"
          >
            <AppIcon icon="fa-light fa-chevron-right" aria-hidden="true" />
          </button>

          <!-- Stage: as large as the viewport allows -->
          <div
            class="gallery-stage aspect-video max-h-[calc(100dvh-8rem)] w-full sm:max-h-[calc(100dvh-6.5rem)]"
            :class="images.length > 1 ? 'md:max-h-[calc(100dvh-11.25rem)]!' : ''"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerCancel"
            @pointerenter="hovering = true"
            @pointerleave="hovering = false"
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

          <!-- Capsule pagination: a plain row under the image on phones (the stage is short
               there, so nothing covers it); a frosted capsule over the image from sm up. -->
          <div
            v-if="images.length > 1"
            class="gallery-chrome pointer-events-none flex justify-center border-t border-white/10 sm:absolute sm:inset-x-0 sm:bottom-4 sm:z-20 sm:border-0"
          >
            <div
              class="gallery-pill pointer-events-auto flex items-center rounded-full sm:border sm:border-white/15 sm:bg-slate-950/60 sm:px-1.5 sm:shadow-lg sm:shadow-black/30 sm:ring-1 sm:ring-black/20 sm:backdrop-blur-md"
              role="tablist"
              aria-label="Choose image"
            >
              <button
                v-if="canAutoplay"
                type="button"
                class="kbd-focus mr-1 flex h-11 w-9 cursor-pointer items-center justify-center rounded-full text-white/90 transition-colors hover:text-white focus-visible:text-white motion-reduce:transition-none sm:h-9 sm:w-8"
                :aria-label="playing ? 'Pause slideshow' : 'Play slideshow'"
                :aria-pressed="playing"
                @click="togglePlaying"
              >
<svg
                  viewBox="0 0 16 16"
                  class="h-3.5 w-3.5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path v-if="playing" d="M4 2h2.5a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-11A.5.5 0 0 1 4 2Zm5.5 0H12a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5H9.5a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5Z" />
                  <path v-else d="M4.5 2.4v11.2a.5.5 0 0 0 .77.42l8.4-5.6a.5.5 0 0 0 0-.84l-8.4-5.6a.5.5 0 0 0-.77.42Z" />
                </svg>
              </button>
              <template v-if="images.length <= MAX_DOTS">
                <button
                  v-for="(_, i) in images"
                  :key="i"
                  type="button"
                  role="tab"
                  class="kbd-focus group/dot flex h-11 cursor-pointer items-center justify-center rounded-full px-2.5 sm:h-9 sm:px-1.5"
                  :aria-selected="i === activeIndex"
                  :aria-label="`Image ${i + 1} of ${images.length}`"
                  @click="goTo(i)"
                >
                  <span
                    class="relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none"
                    :class="
                      i === activeIndex
                        ? [
                            canAutoplay ? 'w-9' : 'w-6',
                            showProgress ? 'bg-white/25' : 'bg-sky-300',
                          ]
                        : 'w-1.5 bg-white/45 group-hover/dot:bg-white/90'
                    "
                  >
                    <span
                      v-if="i === activeIndex && showProgress"
                      :key="`p-${activeIndex}`"
                      class="gallery-progress absolute inset-0 rounded-full bg-sky-300"
                      :style="{
                        animationDuration: AUTOPLAY_MS + 'ms',
                        animationPlayState: progressRunning ? 'running' : 'paused',
                      }"
                      @animationend="onProgressEnd"
                    />
                  </span>
                </button>
              </template>
              <span
                v-else
                class="px-3 py-2.5 text-xs font-semibold tabular-nums tracking-widest text-slate-100 sm:py-1.5"
                aria-hidden="true"
              >
                {{ activeIndex + 1 }} / {{ images.length }}
              </span>
            </div>
          </div>
        </div>

        <!-- Thumbnails + keyboard hint -->
        <div
          v-if="images.length > 1"
          class="gallery-chrome relative hidden border-t border-white/10 md:block"
        >
          <div
            ref="thumbsRef"
            class="gallery-thumbs flex gap-2.5 overflow-x-auto px-4 py-3 lg:px-48"
            role="group"
            aria-label="Thumbnails"
          >
            <button
              v-for="(src, i) in images"
              :key="'t-' + getImageKey(src, i)"
              type="button"
              class="kbd-focus relative aspect-video h-12 shrink-0 cursor-pointer overflow-hidden rounded-md ring-offset-base-background transition-[opacity,box-shadow,scale] duration-200 first:ml-auto last:mr-auto motion-reduce:transition-none"
              :class="
                i === activeIndex
                  ? 'opacity-100 ring-2 ring-sky-300 ring-offset-2'
                  : 'opacity-50 ring-1 ring-white/15 hover:opacity-100 focus-visible:opacity-100'
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
const AUTOPLAY_MS = 5000;
const SWIPE_CLOSE_PX = 110;

const panelRef = ref(null);
const closeButtonRef = ref(null);
const trackRef = ref(null);
const thumbsRef = ref(null);
const activeIndex = ref(0);
const closing = ref(false);
const playing = ref(false);
const hovering = ref(false);
const pageHidden = ref(false);
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

const slidePrev = () => {
  stopAutoplay();
  goTo(activeIndex.value - 1);
};
const slideNext = () => {
  stopAutoplay();
  goTo(activeIndex.value + 1);
};

// Keep the current slide aligned if the viewport changes size (rotation).
function realign() {
  goTo(activeIndex.value, { instant: true });
}


// Slideshow: the active dot fills over AUTOPLAY_MS, then the next image shows. Any manual
// navigation stops it for good; hover, a hidden tab, zoom and dragging only pause it.
const canAutoplay = computed(
  () => props.images.length > 1 && props.images.length <= MAX_DOTS,
);
const showProgress = computed(
  () =>
    playing.value &&
    canAutoplay.value &&
    activeIndex.value < props.images.length - 1,
);
const progressRunning = computed(
  () =>
    !hovering.value &&
    !pageHidden.value &&
    !isZoomed.value &&
    !dragging.value &&
    !closing.value,
);

function onProgressEnd() {
  if (!playing.value) return;
  goTo(activeIndex.value + 1);
}

function stopAutoplay() {
  playing.value = false;
}

function togglePlaying() {
  if (playing.value) {
    playing.value = false;
    return;
  }
  // Replaying from the last image starts over.
  if (activeIndex.value >= props.images.length - 1) goTo(0);
  playing.value = true;
}

function onPanelPointerDown(e) {
  // Touching the stage, dots, thumbnails or arrows is the viewer taking over.
  if (e.target.closest?.(".gallery-stage-wrap, .gallery-pill, .gallery-thumbs")) {
    stopAutoplay();
  }
}

function onVisibility() {
  pageHidden.value = document.hidden;
}


// Moving to another image leaves zoom, and brings its thumbnail into view.
watch(activeIndex, async (i) => {
  if (zoomedIndex.value !== null && zoomedIndex.value !== i) {
    zoomedIndex.value = null;
  }
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


/* ---------- misc ---------- */

let copiedTimer = 0;
async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.shareUrl);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), 1800);
  } catch {
    // Clipboard unavailable: fall back to selecting nothing, the URL is already in the bar.
  }
}

function onCaseStudyClick() {
  emit("update:modelValue", false);
  emit("close");
  router.push(props.caseStudyHref);
}

// Esc closes from anywhere (focus may sit on the dialog root right after opening).
function onKeydown(e) {
  if (e.key !== "Escape" || e.defaultPrevented) return;
  e.preventDefault();
  requestClose();
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
      window.addEventListener("keydown", onKeydown, true);
      document.addEventListener("visibilitychange", onVisibility);
      hovering.value = false;
      playing.value = canAutoplay.value && !prefersReducedMotion();
      animateOpenFromCard();
      return;
    }

    if (!wasOpen) return;
    window.removeEventListener("resize", realign);
    window.removeEventListener("keydown", onKeydown, true);
    document.removeEventListener("visibilitychange", onVisibility);
    playing.value = false;

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
  clearTimeout(copiedTimer);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  window.removeEventListener("resize", realign);
  window.removeEventListener("keydown", onKeydown, true);
  document.removeEventListener("visibilitychange", onVisibility);
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

.gallery-thumbs {
  scrollbar-width: none;
}

.gallery-thumbs::-webkit-scrollbar {
  display: none;
}

.gallery-progress {
  transform-origin: left center;
  animation-name: gallery-progress-fill;
  animation-timing-function: linear;
  animation-fill-mode: both;
}

@keyframes gallery-progress-fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* Arrows sit over the image: ease colour, press-scale and the fade at either end. */
.gallery-chrome.gallery-nav {
  transition:
    opacity 180ms ease-out,
    background-color 200ms ease-out,
    scale 220ms cubic-bezier(0.2, 0.9, 0.3, 1);
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

.gallery-panel.is-closing .gallery-stage-wrap {
  background-color: transparent;
}

.gallery-panel.is-closing {
  background-color: transparent;
  border-color: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-panel,
  .gallery-chrome,
  .gallery-chrome.gallery-nav {
    transition: none;
  }
}
</style>

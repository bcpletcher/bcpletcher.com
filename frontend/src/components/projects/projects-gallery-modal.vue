<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-200"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel"
      @keydown.esc.stop.prevent="close"
    >
      <!-- Backdrop -->
      <div
        ref="backdropRef"
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        @click="close"
      />

      <!-- Panel (spacing belongs OUTSIDE the panel) -->
      <div
        class="absolute inset-0 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10"
        @click="onPanelClick"
      >
        <div
          ref="panelRef"
          class="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-800 bg-base-background/90 shadow-2xl backdrop-blur"
        >
          <header
            class="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 sm:px-6"
          >
            <div class="min-w-0">
              <p class="truncate text-sm tracking-widest text-slate-400">
                {{ title || "Project Gallery" }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-white/5 text-slate-200 transition-standard hover:bg-white/10 focus-visible:bg-white/10"
                aria-label="Close"
                @click="close"
              >
                <i class="fa-light fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div class="relative bg-black/30">
            <!-- Navigation buttons -->
            <button
              type="button"
              class="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-black/30 text-slate-100 backdrop-blur transition-standard hover:bg-black/45 focus-visible:bg-black/45"
              aria-label="Previous image"
              @click="slidePrev"
            >
              <i class="fa-light fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-black/30 text-slate-100 backdrop-blur transition-standard hover:bg-black/45 focus-visible:bg-black/45"
              aria-label="Next image"
              @click="slideNext"
            >
              <i class="fa-light fa-chevron-right" aria-hidden="true" />
            </button>

            <!-- 16:9 stage -->
            <div class="w-full aspect-video">
              <Swiper
                class="h-full"
                :modules="modules"
                :initial-slide="initialIndex"
                :keyboard="{ enabled: true }"
                :grab-cursor="true"
                :resistance-ratio="0.85"
                :speed="650"
                :space-between="24"
                :slides-per-view="1"
                :centered-slides="true"
                @swiper="onSwiper"
                @slide-change="onSlideChange"
              >
                <SwiperSlide v-for="(src, i) in images" :key="src + i">
                  <div class="h-full w-full">
                    <div class="h-full w-full overflow-hidden border border-slate-800 bg-black/10 shadow-2xl">
                      <img
                        class="h-full w-full select-none object-contain"
                        :src="src"
                        :alt="`${title || 'Project'} image ${i + 1}`"
                        loading="eager"
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              </Swiper>
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
                  class="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-white/5 px-4 py-2 text-slate-200 transition-standard hover:bg-white/10 focus-visible:bg-white/10"
                  @click="toggleFullscreen"
                >
                  <i class="fa-light fa-expand" aria-hidden="true" />
                  <span class="tracking-widest">FULLSCREEN</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import gsap from "gsap";

import { Swiper, SwiperSlide } from "swiper/vue";
import { Keyboard } from "swiper/modules";

import "swiper/css";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  images: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue", "close"]);

const ariaLabel = computed(() =>
  props.title ? `${props.title} gallery` : "Project gallery",
);

const backdropRef = ref(null);
const panelRef = ref(null);

const swiperRef = ref(null);
const activeIndex = ref(0);

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const modules = [Keyboard];

function close() {
  emit("update:modelValue", false);
  emit("close");
}

function onPanelClick(e) {
  // Close only when click originates from the outer panel wrapper.
  // (Backdrop handles outside-click close).
  e.stopPropagation();
}

function onSwiper(swiper) {
  swiperRef.value = swiper;
  activeIndex.value = swiper?.activeIndex ?? 0;
}

function onSlideChange(swiper) {
  activeIndex.value = swiper?.activeIndex ?? 0;
}

function slidePrev() {
  swiperRef.value?.slidePrev?.();
}

function slideNext() {
  swiperRef.value?.slideNext?.();
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
let openTl = null;

async function animateOpen() {
  if (prefersReducedMotion) return;
  await nextTick();

  openTl?.kill?.();
  openTl = gsap.timeline({ defaults: { ease: "power3.out" } });

  openTl
    .fromTo(backdropRef.value, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    .fromTo(
      panelRef.value,
      { opacity: 0, y: 14, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38 },
      0,
    );
}

async function animateClose() {
  if (prefersReducedMotion) return;

  openTl?.kill?.();
  openTl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  openTl
    .to(panelRef.value, { opacity: 0, y: 10, scale: 0.99, duration: 0.22 }, 0)
    .to(backdropRef.value, { opacity: 0, duration: 0.22 }, 0);
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    lastFocusedEl = document.activeElement;

    // Lock background scroll without causing a layout shift from the missing scrollbar.
    // Reserving the gutter prevents the modal from looking clipped where the scrollbar would be.
    document.documentElement.style.scrollbarGutter = "stable";
    document.documentElement.classList.add("overflow-hidden");
    document.body.classList.add("overflow-hidden");

    await animateOpen();

    // Ensure swiper starts at the right index when opening
    await nextTick();
    if (swiperRef.value) {
      try {
        swiperRef.value.slideTo(props.initialIndex, 0);
      } catch {
        // no-op
      }
    }
  },
);

watch(
  () => props.modelValue,
  async (isOpen, wasOpen) => {
    if (!wasOpen || isOpen) return;

    await animateClose();

    document.documentElement.classList.remove("overflow-hidden");
    document.body.classList.remove("overflow-hidden");
    document.documentElement.style.scrollbarGutter = "";

    if (lastFocusedEl && lastFocusedEl.focus) {
      try {
        lastFocusedEl.focus();
      } catch {
        // no-op
      }
    }
  },
);

onBeforeUnmount(() => {
  document.documentElement.classList.remove("overflow-hidden");
  document.body.classList.remove("overflow-hidden");
  document.documentElement.style.scrollbarGutter = "";
  openTl?.kill?.();
});
</script>

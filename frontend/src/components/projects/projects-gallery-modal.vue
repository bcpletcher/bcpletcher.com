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
      class="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-800 bg-base-background/90 shadow-2xl backdrop-blur"
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
            <i class="fa-light fa-xmark" aria-hidden="true" />
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
          <i class="fa-light fa-chevron-left" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="kbd-focus cursor-pointer absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-black/30 text-slate-100 backdrop-blur transition-standard hover:bg-black/45 focus-visible:bg-black/45"
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
            <SwiperSlide v-for="(src, i) in images" :key="getImageKey(src, i)">
              <div class="h-full w-full">
                <div class="h-full w-full overflow-hidden">
                  <img
                    class="h-full w-full select-none object-contain"
                    :src="responsiveFor(src).src"
                    :srcset="responsiveFor(src).srcset || undefined"
                    sizes="100vw"
                    :alt="`${title || 'Project'} image ${i + 1}`"
                    width="1280"
                    height="720"
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
              class="kbd-focus cursor-pointer inline-flex items-center gap-2 rounded-full border border-slate-800 bg-white/5 px-4 py-2 text-slate-200 transition-standard hover:bg-white/10 focus-visible:bg-white/10"
              @click="toggleFullscreen"
            >
              <i class="fa-light fa-expand" aria-hidden="true" />
              <span class="tracking-widest">FULLSCREEN</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { nextTick, ref, watch, computed } from "vue";

import { Swiper, SwiperSlide } from "swiper/vue";
import { Keyboard } from "swiper/modules";

import "swiper/css";
import ModalWrapper from "@/components/shared/modal-wrapper.vue";
import { buildResponsiveImageSourcesFromImageValue } from "@/utils/firebaseStorageImages.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "" },
  images: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue", "close"]);

const panelRef = ref(null);
const closeButtonRef = ref(null);

const swiperRef = ref(null);
const activeIndex = ref(0);

const modules = [Keyboard];

const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const responsiveFor = (img) =>
  buildResponsiveImageSourcesFromImageValue(img, {
    bucket: storageBucket,
    widths: [480, 720, 1080],
    preferWidth: 1080,
  });

function getImageKey(img, index) {
  if (!img) return `img-${index}`;
  if (typeof img === "string") return `img-url-${img}`;
  if (typeof img === "object" && img.path) return `img-path-${img.path}`;
  if (typeof img === "object" && img.url) return `img-url-${img.url}`;
  return `img-${index}`;
}

function close() {
  emit("update:modelValue", false);
  emit("close");
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

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return;

    lastFocusedEl = document.activeElement;

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

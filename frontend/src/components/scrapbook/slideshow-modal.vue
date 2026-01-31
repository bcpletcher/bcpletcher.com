<template>
  <Teleport to="body">
    <!-- Always-mounted overlay to avoid blur snap and transition teardown hitches -->
    <div
      class="fixed inset-0 z-[9999]"
      :class="visible ? 'pointer-events-auto' : 'pointer-events-none'"
      aria-hidden="true"
    >
      <!-- Blur layer stays mounted; only opacity changes -->
      <div
        class="absolute inset-0 backdrop-blur-sm"
        :class="visible ? 'opacity-100' : 'opacity-0'"
        style="transition: opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)"
      />

      <!-- Tint layer (click-to-close) -->
      <button
        type="button"
        class="absolute inset-0 bg-black/70"
        :class="visible ? 'opacity-100' : 'opacity-0'"
        style="transition: opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)"
        aria-label="Close slideshow"
        @click="closeModal"
      />
    </div>

    <!-- Always-mounted dialog wrapper; animate with opacity/transform to avoid unmount hitches -->
    <div
      class="fixed inset-0 z-[10000] flex items-center justify-center"
      :class="visible ? 'pointer-events-auto' : 'pointer-events-none'"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      @keydown.esc="closeModal"
      @keydown.left.prevent="goPrev"
      @keydown.right.prevent="goNext"
      @transitionend="onDialogTransitionEnd"
    >
      <div
        class="relative w-[92vw] max-w-[1024px] overflow-hidden rounded-2xl border border-base-border bg-base-background shadow-2xl backdrop-blur"
        :class="
          visible
            ? 'opacity-100 translate-y-0 scale-100 blur-0'
            : 'opacity-0 translate-y-3 scale-[0.985] blur-sm'
        "
        style="
          transition: opacity 320ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 360ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 360ms cubic-bezier(0.16, 1, 0.3, 1);
        "
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-6"
        >
          <div class="flex flex-col">
            <p
              class="text-xs font-semibold tracking-widest uppercase text-slate-400"
            >
              Slideshow
            </p>
            <p class="text-xs text-slate-500">{{ images.length }} Images</p>
          </div>

          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:text-font-secondary hover:border-font-secondary/40 transition-standard"
            aria-label="Close slideshow"
            @click="closeModal"
          >
            <i class="fa-regular fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-4 pb-4 pt-4 md:px-6 md:pb-6">
          <div class="text-font-primary">
            <!-- 16:9 media stage so modal doesn't jump when images decode -->
            <div
              class="relative w-full rounded-xl border border-white/10 bg-black/20 overflow-hidden"
              style="aspect-ratio: 16 / 9; max-height: min(70vh, 640px)"
            >
              <div class="absolute inset-0">
                <swiper
                  v-if="visible && images.length"
                  :key="swiperKey"
                  ref="swiperRef"
                  :lazy="false"
                  :preload-images="true"
                  :watch-slides-progress="true"
                  :loop="true"
                  :pagination="{
                    el: '.custom-pagination',
                    clickable: true,
                  }"
                  :navigation="{
                    nextEl: '.custom-button-next',
                    prevEl: '.custom-button-prev',
                  }"
                  :modules="[Pagination, Navigation]"
                  class="mySwiper h-full"
                  @swiper="onSwiper"
                >
                  <swiper-slide v-for="(image, index) in images" :key="index">
                    <div class="h-full w-full">
                      <img
                        :src="image"
                        loading="eager"
                        decoding="async"
                        :alt="`Slide ${index + 1}`"
                        class="h-full w-full object-cover"
                      />
                    </div>
                  </swiper-slide>
                </swiper>

                <div
                  v-if="isPreloading"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    class="flex items-center gap-3 rounded-full border border-white/10 bg-base-sidebar/60 px-4 py-2 backdrop-blur"
                  >
                    <i
                      class="fa-light fa-spinner-third animate-spin text-font-secondary"
                      aria-hidden="true"
                    />
                    <span class="text-xs text-slate-300">Loading…</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4 flex items-center justify-between">
              <button
                type="button"
                class="custom-button-prev inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:text-font-secondary hover:border-font-secondary/40 transition-standard"
                aria-label="Previous image"
              >
                <i class="fa-light fa-chevron-left" aria-hidden="true" />
              </button>

              <div class="custom-pagination" />

              <button
                type="button"
                class="custom-button-next inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:text-font-secondary hover:border-font-secondary/40 transition-standard"
                aria-label="Next image"
              >
                <i class="fa-light fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const visible = ref(false);
const images = ref([]);
const swiperRef = ref(null);
const isPreloading = ref(false);
const swiperKey = ref(0);

// Track whether we should clear images after the close animation completes.
const pendingCloseCleanup = ref(false);

const preloadImages = async (urls) => {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (!list.length) return;

  const decodeOne = async (src) => {
    try {
      const img = new Image();
      img.src = src;
      await (img.decode ? img.decode() : new Promise((r) => (img.onload = r)));
    } catch {
      // ignore
    }
  };

  await decodeOne(list[0]);
  await Promise.all(list.slice(1).map(decodeOne));
};

const onSwiper = (instance) => {
  // Ensure we always start at the first logical slide when the component mounts.
  // With loop enabled, use slideToLoop(0) to target the correct duplicated slide.
  if (!instance) return;
  if (typeof instance.slideToLoop === "function") {
    instance.slideToLoop(0, 0);
  } else {
    instance.slideTo(0, 0);
  }
};

const showModal = async (obj) => {
  const nextImages = Array.isArray(obj?.images) ? obj.images : [];

  pendingCloseCleanup.value = false;
  isPreloading.value = true;

  await preloadImages(nextImages);

  images.value = nextImages;
  swiperKey.value += 1;
  visible.value = true;

  // Focus the dialog to enable keyboard navigation.
  await nextTick();
  const el = document.querySelector('[role="dialog"]');
  el?.focus?.();

  setTimeout(() => {
    isPreloading.value = false;
  }, 150);
};

const closeModal = () => {
  // start closing animation; we clean images once the panel transition ends
  pendingCloseCleanup.value = true;
  visible.value = false;
};

const onDialogTransitionEnd = (event) => {
  // Only respond to the panel's transition end (ignore bubbled events)
  if (!pendingCloseCleanup.value) return;

  // We want to clean up once the inner panel finishes transitioning.
  // transitionend bubbles; ensure it's from the panel element.
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("relative")) return;

  images.value = [];
  swiperKey.value += 1;
  isPreloading.value = false;
  pendingCloseCleanup.value = false;
};

const goNext = () => {
  const instance = swiperRef.value?.swiper;
  if (!instance) return;
  instance.slideNext();
};

const goPrev = () => {
  const instance = swiperRef.value?.swiper;
  if (!instance) return;
  instance.slidePrev();
};

const lockScroll = () => {
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  document.documentElement.style.scrollbarGutter = "stable";
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  if (scrollbarWidth > 0) {
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
  }
};

const unlockScroll = () => {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  document.documentElement.style.scrollbarGutter = "";
};

watch(
  () => visible.value,
  async (isOpen) => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }
);

onBeforeUnmount(() => {
  visible.value = false;
  unlockScroll();
});

defineExpose({
  showModal,
});
</script>

<style lang="scss">
/* Pagination bullets */
.custom-pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.swiper-pagination-bullet {
  background-color: theme("colors.font.primary");
  opacity: 0.35;
}

.swiper-pagination-bullet-active {
  background-color: theme("colors.font.secondary");
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  /* Respect reduced motion: disable panel transitions via inline styles by forcing opacity */
  [role="dialog"] > .relative {
    transition: none !important;
  }
}
</style>

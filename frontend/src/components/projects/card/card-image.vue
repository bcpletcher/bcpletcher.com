<template>
  <div
    class="hidden md:block relative md:z-10 z-0 md:mb-2 transition-standard md:col-span-5 md:order-2"
    :class="[
      isHidden ? 'opacity-40' : 'opacity-25 md:opacity-100',
      isHidden ? 'pointer-events-none select-none' : '',
    ]"
    :aria-disabled="isHidden || undefined"
  >
    <div
      ref="imageStackEl"
      class="relative md:mt-1 w-full group md:cursor-pointer"
      :class="[isHidden ? 'pointer-events-none cursor-default' : '']"
    >
      <!-- Mask = exactly the visible stack bounds (base area + peek offsets) -->
      <div class="relative rounded-md overflow-visible">
        <!-- Keep the blurred chip always in the DOM to prevent blur-paint flash -->
        <div
          class="hidden md:flex pointer-events-none absolute inset-0 z-40 items-center justify-center"
          aria-hidden="true"
        >
          <div
            class="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-slate-100 backdrop-blur will-change-transform will-change-opacity transform-gpu"
            :class="[
              'opacity-0 scale-95 transition-standard',
              !isHidden
                ? 'md:group-hover:opacity-100 md:group-hover:scale-100'
                : '',
            ]"
          >
            <i class="fa-light fa-magnifying-glass" aria-hidden="true" />
          </div>
        </div>

        <button
          type="button"
          class="absolute inset-0 z-50 hidden md:block md:cursor-pointer"
          aria-label="Open gallery"
          :disabled="isHidden"
          :tabindex="isHidden ? -1 : undefined"
          :aria-disabled="isHidden || undefined"
          @click="!isHidden && onOpenGallery(0)"
        />

        <!-- Images -->
        <div
          v-for="(src, i) in previewImages"
          :key="src + i"
          class="absolute top-0 right-0 left-0"
          :data-stack-index="i"
          :class="[
            i === 0 ? 'z-3 md:w-full' : '',
            i === 1
              ? 'z-2 w-[94%] translate-x-[3%] translate-y-12 md:w-full md:-translate-x-4 md:translate-y-4'
              : '',
            i === 2
              ? 'z-1 w-[88%] translate-x-[6%] translate-y-24 md:w-full md:-translate-x-8 md:translate-y-8'
              : '',
          ]"
        >
          <div class="relative mx-auto" :class="[]">
            <img
              class="h-full w-full rounded-md border border-white/10 bg-white/5 object-cover shadow-lg"
              :src="src"
              :alt="`${title} screenshot`"
              loading="lazy"
              decoding="async"
            />

            <!-- Per-image tint (pixel-perfect) -->
            <div
              class="pointer-events-none absolute inset-0 rounded-md bg-black/0 transition-standard md:group-hover:bg-black/30"
              aria-hidden="true"
            />
          </div>
        </div>

        <!-- Base size + padding for peek offsets (mobile needs extra height for stacked offsets) -->
        <div
          class="w-full aspect-video pb-32 md:pb-6 md:pr-6"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";

const props = defineProps({
  title: { type: String, required: true },
  hero: { type: String, required: true },
  images: { type: Array, default: null },
  isHidden: { type: Boolean, default: false },
});

const emit = defineEmits(["open-gallery"]);

function onOpenGallery(index) {
  emit("open-gallery", index);
}

const previewImages = computed(() => {
  const imgs =
    Array.isArray(props.images) && props.images.length
      ? props.images
      : [props.hero];
  return imgs.filter(Boolean).slice(0, 3);
});

const isMdUp = ref(true);
let mq;

function updateIsMdUp() {
  if (!mq) return;
  isMdUp.value = mq.matches;
}

onMounted(() => {
  if (typeof window !== "undefined" && window.matchMedia) {
    mq = window.matchMedia("(min-width: 768px)");
    updateIsMdUp();
    mq.addEventListener?.("change", updateIsMdUp);
  }

  if (!imageStackEl.value) return;
  imageStackEl.value.addEventListener("mouseenter", onImagesEnter);
  imageStackEl.value.addEventListener("mouseleave", onImagesLeave);
});

onBeforeUnmount(() => {
  hoverTweenIn?.kill();
  hoverTweenOut?.kill();

  if (mq) mq.removeEventListener?.("change", updateIsMdUp);

  if (!imageStackEl.value) return;
  imageStackEl.value.removeEventListener("mouseenter", onImagesEnter);
  imageStackEl.value.removeEventListener("mouseleave", onImagesLeave);
});

const imageStackEl = ref(null);
let hoverTweenIn;
let hoverTweenOut;

function isHoverCapable() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(hover: hover)").matches
    : false;
}

const onImagesEnter = () => {
  if (!isHoverCapable() || !isDesktopLike()) return;
  hoverTweenOut?.kill();
  hoverTweenIn?.kill();
  hoverTweenIn = gsap.to(imageStackEl.value, {
    y: -4,
    scale: 1.01,
    duration: 0.35,
    ease: "power3.out",
    overwrite: true,
  });
};

const onImagesLeave = () => {
  if (!isHoverCapable() || !isDesktopLike()) return;
  hoverTweenIn?.kill();
  hoverTweenOut?.kill();
  hoverTweenOut = gsap.to(imageStackEl.value, {
    y: 0,
    scale: 1,
    duration: 0.45,
    ease: "power3.out",
    overwrite: true,
  });
};

function isDesktopLike() {
  return isMdUp.value;
}
</script>

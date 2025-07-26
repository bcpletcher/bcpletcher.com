<template>
  <div
    class="z-10 reflection w-full relative md:grid gap-4 transition-standard"
    :class="{ reverse: props.reversed }"
  >
    <div
      class="z-[-1] image flex flex-col justify-center absolute inset-0 md:relative"
    >
      <a
        class="relative group h-full md:h-auto rounded overflow-hidden"
        :href="props.url"
        target="_blank"
      >
        <img
          :src="props.hero"
          class="h-full object-cover w-full md:h-auto md:aspect-video opacity-30 md:opacity-100 md:group-hover:opacity-100 transition-slow"
          alt=""
        />
        <div
          class="absolute inset-0 bg-black/60 md:bg-gradient-start/70 md:opacity-40 group-hover:opacity-0 transition-slow"
        />
      </a>
    </div>

    <div class="z-20 content flex flex-col justify-center p-8 md:p-0">
      <div class="flex flex-col">
        <p
          class="leading-none md:text-sm my-2 text-font-secondary"
          :class="{
            'text-right': !props.reversed && !isBreakpointOrBelow('sm'),
          }"
        >
          {{ props.eyebrow }}
        </p>
        <a
          class="leading-none text-2xl md:text-xl font-bold mb-4 text-font-primary/80 transition-standard"
          :href="props.url"
          target="_blank"
          :class="[
            { 'text-right': !props.reversed && !isBreakpointOrBelow('sm') },
            { 'hover:text-gradient-start': props.url },
          ]"
        >
          {{ props.title }}
        </a>
        <div
          class="md:bg-base-sidebar/70 md:border md:border-base-border rounded md:p-6 md:backdrop-blur"
        >
          <p class="text-font-primary md:text-sm">
            {{ props.description }}
          </p>
        </div>
        <div
          class="flex flex-wrap mt-3 gap-2"
          :class="{
            'justify-end': !props.reversed && !isBreakpointOrBelow('sm'),
          }"
        >
          <div
            v-for="(item, index) in props.technology"
            :key="index"
            class="flex flex-col justify-center rounded-full border-2 border-gradient-start/50 tracking-wide md:bg-base-background text-white text-xs px-4 py-2 zmd:border-0 zmd:text-font-tertiary zmd:bg-gradient-start"
          >
            <label class="leading-none">{{ item }}</label>
          </div>
        </div>
        <div
          class="flex gap-4 mt-5 text-lg"
          :class="{
            'justify-end': !props.reversed && !isBreakpointOrBelow('sm'),
          }"
        >
          <button
            class="text-font-primary/80 hover:text-gradient-start transition-standard"
            @click="showSlideshowModal()"
          >
            <i class="fa-regular fa-images"></i>
          </button>
          <a
            v-if="props.url"
            :href="props.url"
            target="_blank"
            class="text-font-primary/80 hover:text-gradient-start transition-standard"
          >
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </div>
    </div>
    <SlideshowModal ref="slideshowModalRef" />
  </div>
</template>

<script setup>
import { defineProps, useTemplateRef } from "vue";
import { useBreakpoints } from "@/composables/breakpoints.js";
import SlideshowModal from "@/components/scrapbook/slideshow-modal.vue";
const { isBreakpointOrBelow } = useBreakpoints();

const slideshowModalRef = useTemplateRef("slideshowModalRef");

const props = defineProps({
  hero: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  url: { type: String, default: null },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  reversed: { type: Boolean, default: false },
  technology: { type: Array, default: () => [] },
  summary: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
});

const showSlideshowModal = () => {
  slideshowModalRef.value.showModal({
    images: props.images,
    summary: props.summary,
  });
};
</script>

<style scoped lang="scss">
.reflection {
  grid-template-columns: repeat(12, 1fr);
}

@media (max-width: 900px) {
  .reflection {
    .image {
      grid-area: 1 / 1 / 2 / 8;
    }
    .content {
      grid-area: 1 / 5 / 2 / 13;
    }
  }

  .reflection.reverse {
    .content {
      grid-area: 1 / 1 / 2 / 7;
    }
    .image {
      grid-area: 1 / 6 / 2 / 13;
    }
  }
}

@media (min-width: 901px) {
  .reflection {
    .image {
      grid-area: 1 / 1 / 2 / 8;
    }
    .content {
      grid-area: 1 / 7 / 2 / 13;
    }
  }

  .reflection.reverse {
    .content {
      grid-area: 1 / 1 / 2 / 7;
    }
    .image {
      grid-area: 1 / 6 / 2 / 13;
    }
  }
}
</style>

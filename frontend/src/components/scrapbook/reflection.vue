<template>
  <div
    v-gsap-reveal="{ once: true, start: 'top 90%' }"
    class="group z-10 reflection w-full relative md:grid gap-4 transition-standard"
    :class="[
      { reverse: props.reversed },
      props.reversed ? 'mr-auto' : 'ml-auto',
    ]"
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
          class="absolute inset-0 bg-black/50 md:bg-gradient-end/50 md:opacity-40 group-hover:opacity-0 transition-slow"
        />
      </a>
    </div>

    <div class="z-20 content flex flex-col justify-center p-8 md:p-0">
      <div class="flex flex-col">
        <p
          class="leading-none md:text-sm my-2 text-accent tracking-wide"
          :class="{
            'text-right': !props.reversed && !isBreakpointOrBelow('sm'),
          }"
        >
          {{ props.eyebrow }}
        </p>
        <a
          class="leading-none text-2xl md:text-xl font-semibold tracking-wide mb-4 text-slate-300 transition-standard"
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
          class="md:bg-surface-2/70 md:border md:border-border rounded md:p-6 md:backdrop-blur"
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
          <ul
            v-if="props.technology?.length"
            class="flex flex-wrap"
            aria-label="Technologies used"
          >
            <li v-for="tag in props.technology" :key="tag" class="mr-1.5 mt-2">
              <div
                class="flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium leading-5 text-accent"
              >
                {{ tag }}
              </div>
            </li>
          </ul>
        </div>
        <div
          class="flex gap-4 mt-5 text-lg"
          :class="{
            'justify-end': !props.reversed && !isBreakpointOrBelow('sm'),
          }"
        >
          <button
            class="text-font-primary/75 hover:text-accent transition-standard"
            type="button"
            aria-label="Open image slideshow"
            @click="emit('open-slideshow', props.images)"
          >
            <i class="fa-regular fa-images" aria-hidden="true" />
          </button>
          <a
            v-if="props.url"
            :href="props.url"
            target="_blank"
            class="text-slate-200 hover:text-accent transition-standard"
          >
            <i class="fa-light fa-arrow-up-right"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { useBreakpoints } from "@/composables/useBreakpoints.js";

const emit = defineEmits(["open-slideshow"]);
const { isBreakpointOrBelow } = useBreakpoints();

const props = defineProps({
  hero: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  url: { type: String, default: null },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  reversed: { type: Boolean, default: false },
  technology: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
});
</script>

<style scoped>
.reflection {
  grid-template-columns: repeat(12, 1fr);
}

@media (max-width: 900px) {
  .reflection .image {
    grid-area: 1 / 1 / 2 / 8;
  }
  .reflection .content {
    grid-area: 1 / 5 / 2 / 13;
  }

  .reflection.reverse .content {
    grid-area: 1 / 1 / 2 / 7;
  }
  .reflection.reverse .image {
    grid-area: 1 / 6 / 2 / 13;
  }
}

@media (min-width: 901px) {
  .reflection .image {
    grid-area: 1 / 1 / 2 / 8;
  }
  .reflection .content {
    grid-area: 1 / 7 / 2 / 13;
  }

  .reflection.reverse .content {
    grid-area: 1 / 1 / 2 / 7;
  }
  .reflection.reverse .image {
    grid-area: 1 / 6 / 2 / 13;
  }
}
</style>

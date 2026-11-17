<template>
  <div class="max-w-[34rem]">
    <h2
      class="text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl"
    >
      {{ content.heading }}
    </h2>

    <div class="mt-6 space-y-5">
      <p
        v-for="(item, index) in content.paragraphs"
        :id="index === 1 ? 'about-more' : undefined"
        :key="index"
        :class="[
          index === 0
            ? 'text-lg leading-8 text-slate-300'
            : 'text-base leading-7 text-slate-400',
          index > 0 && !expanded ? 'max-lg:hidden' : '',
        ]"
      >
        {{ item }}
      </p>
    </div>

    <!-- Below lg only the opening paragraph shows; the rest is one tap away. -->
    <button
      type="button"
      class="kbd-focus group/more mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold tracking-widest text-slate-400 uppercase transition-standard hover:text-sky-300 focus-visible:text-sky-300 lg:hidden"
      :aria-expanded="expanded"
      aria-controls="about-more"
      @click="expanded = !expanded"
    >
      {{ expanded ? "Show less" : "Read more" }}
      <AppIcon
        icon="fa-light fa-arrow-down"
        class="transition-transform motion-reduce:transition-none"
        :class="expanded ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";

import AppIcon from "@/components/shared/app-icon.vue";

const expanded = ref(false);

// Copy lives here only; swap the heading/paragraphs without touching the template.
const content = {
  heading: "From technical discovery to launch",
  paragraphs: [
    `I lead client projects from discovery through launch and ongoing support. I work with stakeholders to define what the project needs, choose the architecture, and guide developers while staying hands-on with the build.`,
    `My background in UX shapes how I build software. I’ve worked on accessibility in rider tools, built interfaces in React and Vue, and connected enterprise CMS sites to other systems using C# and .NET. I help teams carry those decisions through testing and deployment.`,
    `Outside client work, I built Coverlabs Studio, a React editor for creating custom movie and collection posters from templates.`,
  ],
};
</script>

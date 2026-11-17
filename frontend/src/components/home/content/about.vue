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
  heading: "Creative. Intentional. Experienced.",
  paragraphs: [
    `I’m a senior UX/UI designer and full-stack developer with over a decade of experience designing and building digital products from concept to launch. I believe the best experiences are grounded in clarity and usability, where every design decision is intentional and technology stays out of the way.`,
    `My process starts with structure, understanding the problem, shaping content, and defining user flows before moving into design and code. I favor clean interfaces, scalable systems, and interactions that feel effortless. Less isn’t just more; it’s deliberate.`,
    `I’ve led design direction, collaborated across disciplines, and shipped complex applications for teams ranging from startups to enterprise organizations. My work spans UX strategy, visual design, and full-stack development, with hands-on experience across modern frameworks, CMS platforms, and custom applications.`,
    `When I’m not building for clients, I spend time experimenting on personal projects, exploring new tools, and refining how design and development work together; always looking for better, more efficient ways to turn ideas into well-crafted products.`,
  ],
};
</script>

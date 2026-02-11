<template>
  <section id="about" class="scroll-mt-24" :data-section="true">
    <div class="space-y-4 text-sm sm:text-base leading-relaxed">
      <h2 class="text-xl font-semibold sm:text-xl">
        {{ content.heading }}
      </h2>

      <p
        v-for="(item, index) in content.paragraphs"
        :key="index"
        class="leading-relaxed"
      >
        {{ item }}
      </p>
    </div>
  </section>
</template>

<script setup>
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

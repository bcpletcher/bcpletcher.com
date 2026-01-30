<template>
  <main class="py-2 lg:py-24 flex flex-col">
    <section id="about" class="scroll-mt-24" :data-section="true">
      <AboutSection />
    </section>

    <div class="my-16 h-px w-full bg-white/10" />

    <section id="experience" class="scroll-mt-24" :data-section="true">
      <ExperienceSection />
    </section>

    <div class="my-16 h-px w-full bg-white/10" />

    <section id="projects" class="scroll-mt-24" :data-section="true">
      <ProjectsSection />
    </section>

    <div class="text-sm text-slate-500 max-w-lg mt-32 flex gap-4">
      <div
        class="my-auto cursor-pointer"
        :class="{ animationLogo: isHovered }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
        @click="goToAdmin()"
      >
        <img
          class="w-14"
          src="./../../assets/images/logo.svg"
          alt="Site Logo"
        />
      </div>
      <p class="my-auto">
        Designed and codded in

        <a
          class="font-medium text-slate-400 hover:text-primary-secondary focus-visible:text-primary-secondary"
          href="https://www.jetbrains.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          JetBrains
        </a>
        by myself. Built with
        <a
          class="font-medium text-slate-400 hover:text-primary-secondary focus-visible:text-primary-secondary"
          href="https://vuejs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vue.js
        </a>
        and
        <a
          class="font-medium text-slate-400 hover:text-primary-secondary focus-visible:text-primary-secondary"
          href="https://tailwindcss.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tailwind CSS
        </a>
        , deployed with
        <a
          class="font-medium text-slate-400 hover:text-primary-secondary focus-visible:text-primary-secondary"
          href="https://firebase.google.com/products/hosting"
          target="_blank"
          rel="noopener noreferrer"
        >
          Firebase
        </a>
        and
        <a
          class="font-medium text-slate-400 hover:text-primary-secondary focus-visible:text-primary-secondary"
          href="https://github.com/bcpletcher"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  </main>
</template>

<script setup>
import AboutSection from "@/components/home/content/about.vue";
import ExperienceSection from "@/components/home/content/experience.vue";
import ProjectsSection from "@/components/home/content/Projects.vue";
import { ref } from "vue";
import router from "@/router/index.js";

const isHovered = ref(false);

const goToAdmin = () => {
  router.push("/admin");
};
</script>

<style lang="scss">
.fade-enter-active {
  transition-delay: 0.5s !important;
  transition: opacity 0.5s;
}
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.animationLogo img {
  animation-duration: 0.75s;
  -webkit-animation-name: rubberBand;
  animation-name: rubberBand;
}
.animationTabAbout {
  animation-duration: 0.75s;
  animation-delay: 0.45s;
}
.animationTabExperience {
  animation-duration: 0.75s;
  animation-delay: 0.65s;
}
.animationTabContact {
  animation-duration: 0.75s;
  animation-delay: 0.85s;
}
.animationContent {
  animation-duration: 1s;
  animation-delay: 1.05s;
}
.animationSocial {
  animation-duration: 0.75s;
  animation-delay: 1.25s;
}
</style>

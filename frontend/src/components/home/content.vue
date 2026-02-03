<template>
  <!-- Add top padding on mobile to make room for the fixed header -->
  <main class="lg:py-24 flex flex-col">
    <section
      id="about"
      class="mb-16 scroll-mt-16 md:mb-24 lg:mb-0 lg:scroll-mt-24"
      :data-section="true"
    >
      <h2
        class="mb-8 text-sm font-bold uppercase tracking-widest text-slate-200 lg:hidden"
      >
        About
      </h2>

      <AboutSection />
    </section>

    <div class="hidden lg:block my-16 h-px w-full bg-white/10" />

    <section
      id="experience"
      class="scroll-mt-16 mb-16 md:mb-24 lg:mb-0 lg:scroll-mt-24"
      :data-section="true"
    >
      <h2
        class="mb-8 text-sm font-bold uppercase tracking-widest text-slate-200 lg:hidden"
      >
        Experience
      </h2>

      <ExperienceSection />
    </section>

    <div class="hidden lg:block my-16 h-px w-full bg-white/10" />

    <section
      id="projects"
      class="scroll-mt-16 mb-16 md:mb-24 lg:mb-0 lg:scroll-mt-24"
      :data-section="true"
    >
      <h2
        class="mb-8 text-sm font-bold uppercase tracking-widest text-slate-200 lg:hidden"
      >
        Projects
      </h2>

      <ProjectsSection />
    </section>

    <div class="text-sm text-slate-500 max-w-lg mt-32 flex gap-4">
      <div
        ref="logoEl"
        class="my-auto cursor-pointer"
        @mouseenter="onLogoEnter"
        @mouseleave="onLogoLeave"
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
import ProjectsSection from "@/components/home/content/projects.vue";
import { onBeforeUnmount, ref } from "vue";
import router from "@/router/index.js";
import { gsap } from "gsap";

const logoEl = ref(null);
let hoverTween = null;

const goToAdmin = () => {
  router.push("/admin");
};

const onLogoEnter = () => {
  if (!logoEl.value) return;

  hoverTween?.kill();

  // A little squeeze + jump. Quick, clean, and professional.
  hoverTween = gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .to(logoEl.value, { scaleX: 1.08, scaleY: 0.92, duration: 0.12 })
    .to(
      logoEl.value,
      { y: -6, scaleX: 0.96, scaleY: 1.04, duration: 0.16 },
      "<"
    )
    .to(logoEl.value, {
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.22,
      ease: "bounce.out",
    });
};

const onLogoLeave = () => {
  if (!logoEl.value) return;

  hoverTween?.kill();
  hoverTween = gsap.to(logoEl.value, {
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: 0.2,
    ease: "power2.out",
  });
};

onBeforeUnmount(() => {
  hoverTween?.kill();
});
</script>

<style></style>

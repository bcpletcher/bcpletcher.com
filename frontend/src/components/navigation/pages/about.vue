<template>
  <div class="h-full text-font-primary flex flex-col gap-12 overflow-auto">
    <div class="">
      <p class="leading-normal tracking-wide text-3xl">Creative</p>
      <p class="leading-normal tracking-wide text-3xl">Passionate</p>
      <p class="leading-normal tracking-wide text-3xl">Focused</p>
    </div>
    <div class="flex flex-col gap-7">
      <p class="leading-relaxed text-font-primary/75">
        My first step is to sketch and wireframe interfaces focusing on content
        structure, intuitive UI patterns and simple interactions. I'm a
        minimalist who truly believes that less is more.
      </p>
      <p class="leading-relaxed text-font-primary/75">
        I've always been drawn to the overlap between design and development. My
        skills are broad; from UX to design, front end to back end development.
        I enjoy each aspect, and love building sites & desktop apps from start
        to finish.
      </p>
    </div>
    <router-link to="/resume" custom>
      <template #default="{ href, navigate }">
        <a
          :href="href"
          class="uppercase tracking-widest text-sm font-semibold hover:text-gradient-start transition-standard"
          @click="navigate"
        >
          View Resume
        </a>
      </template>
    </router-link>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss"></style>

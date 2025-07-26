<template>
  <div class="flex flex-col h-full text-font-primary">
    <div class="pb-6">
      <h3 class="leading-tight tracking-wide text-3xl">Creative</h3>
      <h3 class="leading-tight tracking-wide text-3xl">Passionate</h3>
      <h3 class="leading-tight tracking-wide text-3xl">Focused</h3>
    </div>
    <div class="flex flex-col gap-7 pt-4 opacity-80 mb-8">
      <p class="text-[16px]">
        My first step is to sketch and wireframe interfaces focusing on content
        structure, intuitive UI patterns and simple interactions. I'm a
        minimalist who truly believes that less is more.
      </p>
      <p class="text-[16px]">
        I've always been drawn to the overlap between design and development. My
        skills are broad; from UX to design, front end to back end development.
        I enjoy each aspect, and love building sites & desktop apps from start
        to finish.
      </p>
    </div>

    <router-link :to="{ path: '/resume' }">
      <template #default="{ href, navigate }">
        <a
          :href="href"
          class="uppercase tracking-[2px] text-sm font-bold hover:text-gradient-start"
          @click="navigate"
        >
          View Resume
        </a>
      </template>
    </router-link>
  </div>
</template>

<script setup></script>

<style scoped lang="scss"></style>

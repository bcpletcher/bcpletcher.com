<template>
  <div class="min-h-screen w-full py-12 md:py-16 lg:py-0">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Rail :nav-items="navItems" />
      <MainContent />
    </div>
  </div>
</template>

<script setup>
import Rail from "@/components/home/rail.vue";
import MainContent from "@/components/home/content.vue";

const navItems = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
];
</script>

<style scoped lang="scss"></style>

<template>
  <div class="min-h-screen w-full">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <LeftRail :nav-items="navItems" />
      <MainContent />
    </div>
  </div>
</template>

<script setup>
import LeftRail from "@/components/home/LeftRail.vue";
import MainContent from "@/components/home/MainContent.vue";

const navItems = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
];
</script>

<style scoped lang="scss"></style>

<template>
  <RailLayout :rail-width-rem="32">
    <template #rail>
      <Rail :nav-items="navItems" />
    </template>

    <template #main>
      <MainContent />
    </template>
  </RailLayout>
</template>

<script setup>
import RailLayout from "@/components/shared/rail-layout.vue";
import Rail from "@/components/home/rail.vue";
import MainContent from "@/components/home/content.vue";

const navItems = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
];
</script>

<style scoped></style>

<template>
  <div class="min-h-screen w-full">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[32rem_1fr] lg:gap-16">
      <!-- Sticky rail column on desktop: stretch to match page height so sticky never releases early -->
      <div class="lg:self-stretch">
        <div class="lg:sticky lg:top-24 ">
          <Rail :nav-items="navItems" />
        </div>
      </div>

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

<style scoped></style>

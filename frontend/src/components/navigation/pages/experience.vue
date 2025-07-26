<template>
  <div class="h-full text-font-primary flex flex-col gap-16 overflow-auto">
    <div v-for="(section, sIndex) in experienceList" :key="sIndex">
      <h4 class="pb-4 opacity-80 uppercase text-xs font-bold tracking-[2px]">
        {{ section.label }}
      </h4>
      <div class="grid grid-cols-2 gap-2 text-sm leading-tight">
        <div
          v-for="(item, lIndex) in section.items"
          :key="lIndex"
          class="col-span-1"
        >
          <template v-if="section.format === 'object'">
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              class="hover:text-gradient-start transition-standard"
            >
              {{ item.title }}
            </a>
            <label v-else> {{ item.title }}</label>
          </template>

          <label v-else> {{ item }}</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useSettingsStore } from "@/stores/settings.js";
const settingsStore = useSettingsStore();

const clients = ref([]);

watch(
  () => settingsStore.scrapbook,
  () => {
    if (!settingsStore.scrapbook) {
      clients.value = [];
    } else {
      clients.value = Object.entries(settingsStore.scrapbook)
        .filter(([item]) => !item.deleted) // Remove items marked as deleted
        .map(([name, item]) => ({ name, ...item })); // Map to preserve the name

      clients.value.sort((a, b) => {
        const yearComparison = b.year - a.year; // Sort by year (newest first)
        if (yearComparison !== 0) {
          return yearComparison;
        }
        return a.order - b.order; // Then sort by order
      });
    }
  },
  { immediate: true, deep: true }
);

const experienceList = computed(() => {
  return [
    {
      label: "Experience & Clients",
      format: "object",
      items: clients.value,
    },
    {
      label: "Frontend Development",
      items: [
        "Vue.js",
        "React",
        "Javascript",
        "Typescript",
        "Bootstrap",
        "TailwindCSS",
        "Less/SCSS",
        "GSAP",
      ],
    },
    {
      label: "Backend Development",
      items: [".NET Core/Framework", "C#/VB.NET", "WPF Forms", "Blazor"],
    },
    {
      label: "Design Tools",
      items: ["Adobe/Affinity Suite", "Figma/Sketch"],
    },
  ];
});

onMounted(() => {});
</script>

<style scoped lang="scss"></style>

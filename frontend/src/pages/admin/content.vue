<template>
  <div class="text-font-primary flex flex-col gap-4">
    <!--    <div class="border rounded-lg border-white/30 overflow-hidden">-->
    <!--      <div class="uppercase font-bold text-font-secondary bg-black/10 p-4">-->
    <!--        Homepage-->
    <!--      </div>-->
    <!--      <div class="px-4 py-2 bg-base-sidebar flex flex-col">-->
    <!--        <div class="border-b border-font-primary/20 py-2">-->
    <!--          <tw-input-group-->
    <!--            :value="settingsStore.content.homepage.eyebrow"-->
    <!--            label="Eyebrow"-->
    <!--            placeholder="Eyebrow"-->
    <!--            @update-value="settingsStore.content.homepage.eyebrow = $event"-->
    <!--          />-->
    <!--        </div>-->
    <!--        <div class="border-b border-font-primary/20 py-2">-->
    <!--          <tw-input-group-->
    <!--            :value="settingsStore.content.homepage.title"-->
    <!--            label="Title"-->
    <!--            placeholder="Title"-->
    <!--            @update-value="settingsStore.content.homepage.title = $event"-->
    <!--          />-->
    <!--        </div>-->
    <!--        <div class="border-b border-font-primary/20 py-2">-->
    <!--          <tw-input-group-->
    <!--            :value="settingsStore.content.homepage.copy"-->
    <!--            label="Copy"-->
    <!--            placeholder="Copy"-->
    <!--            @update-value="settingsStore.content.homepage.copy = $event"-->
    <!--          />-->
    <!--        </div>-->
    <!--        <div class="py-2">-->
    <!--          <tw-file-group-->
    <!--            :existing-url="settingsStore.content.homepage.image"-->
    <!--            label="Homepage Hero"-->
    <!--          />-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </div>-->
    <!--    <div class="border rounded-lg border-white/30 overflow-hidden">-->
    <!--      <div class="uppercase font-bold text-font-secondary bg-black/10 p-4">-->
    <!--        Sidebar-->
    <!--      </div>-->
    <!--      <div class="px-4 py-2 bg-base-sidebar flex flex-col">-->
    <!--        <div class="border-b border-font-primary/20 py-2">-->
    <!--          <tw-file-group-->
    <!--            :existing-url="settingsStore.resources.images.logo"-->
    <!--            label="Homepage Hero"-->
    <!--            accept="image/*,application/pdf"-->
    <!--            image-height="h-10"-->
    <!--            @update-value="handleFileChange"-->
    <!--          />-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </div>-->
  </div>
</template>

<script setup>
// import { useSettingsStore } from "@/stores/settings.js";
// import TwInputGroup from "@/components/shared/tw-input-group.vue";
// import TwFileGroup from "@/components/shared/tw-file-group.vue";
// import { ref } from "vue";

// const settingsStore = useSettingsStore();

// const selectedFile = ref(null);

// const handleFileChange = (file) => {
//   selectedFile.value = file;
//   console.log("Selected file:", file);
// };

// const updateField = (path, value) => {
//   // Navigate to the correct key in settingsStore.content and update it
//   const keys = path.split(".");
//   let current = settingsStore.content;
//   keys.slice(0, -1).forEach((key) => {
//     current = current[key];
//   });
//   current[keys[keys.length - 1]] = value;
// };
//
// // const getType = (val) => {
// //   if (Array.isArray(val)) return "array";
// //   if (typeof val === "string") return "string";
// //   if (val && typeof val === "object") return "object";
// //   return "unknown";
// // };
</script>

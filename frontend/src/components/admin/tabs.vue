<template>
  <div>
    <div
      class="flex justify-end gap-2 border-2 rounded-full p-1 bg-base-sidebar border-font-primary/30 h-10"
    >
      <button
        v-for="(item, index) in tabs"
        :key="index"
        class="text-font-primary px-2 rounded-full text-sm hover:text-font-secondary transition-standard"
        :class="{
          'bg-font-secondary text-font-tertiary hover:text-font-tertiary':
            item.isActive,
        }"
        @click="updateTab(item)"
      >
        {{ item.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const emit = defineEmits(["click"]);

const tabs = ref([
  { name: "Content", isActive: false },
  { name: "Scrapbook", isActive: true },
]);

const updateTab = (tab) => {
  tabs.value.forEach((item) => {
    item.isActive = item.name === tab.name;
  });
  emit("click", tab.name);
};
</script>

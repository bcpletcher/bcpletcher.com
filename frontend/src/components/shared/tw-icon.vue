<template>
  <i
    class="flex flex-col justify-center leading-none"
    :class="`text-${props.size} ${props.weight} fa-${props.icon}`"
  />
</template>

<script setup>
const props = defineProps({
  icon: { type: String, default: "" },
  weight: { type: String, default: "far" },
  size: { type: String, default: "base" },
});
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 z-40 transition duration-300 mix-blend-screen"
    :style="overlayStyle"
  />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

const { radiusPx, rgb, alpha } = defineProps({
  radiusPx: { type: Number, default: 600 },
  // RGB array so it's easy to tweak without string parsing.
  rgb: { type: Array, default: () => [29, 78, 216] },
  alpha: { type: Number, default: 0.08 },
});

const mouseX = ref(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
const mouseY = ref(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

const updateMousePosition = (event) => {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
};

const overlayStyle = computed(() => ({
  background: `radial-gradient(${radiusPx}px at ${mouseX.value}px ${
    mouseY.value
  }px, rgba(${rgb.join(", ")}, ${alpha}), transparent 50%)`,
}));

onMounted(() => {
  window.addEventListener("mousemove", updateMousePosition, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("mousemove", updateMousePosition);
});
</script>

// The canonical breakpoints composable.
// (Replaces the old `breakpoints.js` file so there is a single, consistent import.)

import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { BREAKPOINTS_PX } from "@/constants/breakpoints.js";

export function useBreakpoints() {
  const width = ref(typeof window !== "undefined" ? window.innerWidth : 0);

  const onResize = () => {
    width.value = window.innerWidth;
  };

  onMounted(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", onResize);
  });

  onBeforeUnmount(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("resize", onResize);
  });

  const isBreakpointOrBelow = (bp) => {
    const n = Number(width.value) || 0;

    const max = BREAKPOINTS_PX[bp];
    if (!max) return false;
    return n <= max;
  };

  const isBreakpointOrAbove = (bp) => {
    const n = Number(width.value) || 0;
    const min = BREAKPOINTS_PX[bp];
    if (!min) return true;
    return n >= min;
  };

  const isMobile = computed(() => isBreakpointOrBelow("md"));

  return {
    width,
    isMobile,
    isBreakpointOrBelow,
    isBreakpointOrAbove,
  };
}

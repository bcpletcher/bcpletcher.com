import { computed, onMounted, onUnmounted, ref } from "vue";

export const useBreakpoints = () => {
  const windowWidth = ref(window.innerWidth);

  const onWidthChange = () => (windowWidth.value = window.innerWidth);
  onMounted(() => window.addEventListener("resize", onWidthChange));
  onUnmounted(() => window.removeEventListener("resize", onWidthChange));

  const breakpoint = computed(() => {
    if (windowWidth.value < 640) return "xs";
    if (windowWidth.value >= 640 && windowWidth.value < 768) return "sm";
    if (windowWidth.value >= 768 && windowWidth.value < 1024) return "md";
    if (windowWidth.value >= 1024 && windowWidth.value < 1280) return "lg";
    return "xl";
  });

  const isBreakpointOrBelow = (target) => {
    const breakpointsOrder = ["xs", "sm", "md", "lg", "xl"];
    const currentIndex = breakpointsOrder.indexOf(breakpoint.value);
    const targetIndex = breakpointsOrder.indexOf(target);

    return currentIndex <= targetIndex; // True if current breakpoint is the target or below
  };

  return { width: windowWidth.value, breakpoint, isBreakpointOrBelow };
};

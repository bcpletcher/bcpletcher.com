import { onBeforeUnmount, onMounted, ref } from "vue";

/**
 * Scroll state shared by the sticky top bars (home, projects, case studies).
 * `visible` turns on once the page has scrolled past `threshold` px; `progress` is the
 * 0..1 reading position.
 */
export function useStickyBar({ threshold = 240 } = {}) {
  const visible = ref(false);
  const progress = ref(0);
  let frame = 0;

  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    visible.value = window.scrollY > threshold;
    progress.value =
      max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  onMounted(() => {
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (frame) cancelAnimationFrame(frame);
  });

  return { visible, progress };
}

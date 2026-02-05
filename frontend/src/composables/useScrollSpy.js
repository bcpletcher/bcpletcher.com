import { onBeforeUnmount, onMounted, ref, unref, watch } from "vue";

/**
 * Scroll-spy for sectioned pages.
 *
 * Contract:
 * - sections: array of section ids (e.g. ["about", "experience"]) that exist in DOM.
 * - root: optional scroll container element OR a Vue ref to an element; if null, uses viewport.
 * - Returns activeSectionId (ref) plus a scrollTo(id) helper.
 */
export function useScrollSpy({
  sections,
  root = null,
  // Activate a section a bit earlier as it approaches the top of the viewport.
  rootMargin = "-20% 0px -70% 0px",
} = {}) {
  const activeSectionId = ref(sections?.[0] ?? null);

  let observer;

  const scrollTo = (id, { behavior = "smooth" } = {}) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior, block: "start" });
  };

  const setup = () => {
    if (observer) observer.disconnect();

    const ids = Array.isArray(sections) ? sections : [];
    if (!ids.length) return;

    const rootEl = unref(root) || null;

    observer = new IntersectionObserver(
      (entries) => {
        // Prefer intersecting sections; otherwise fall back to the closest to the top.
        const sorted = [...entries].sort(
          (a, b) =>
            (a.boundingClientRect?.top ?? 0) - (b.boundingClientRect?.top ?? 0)
        );

        const intersecting = sorted.filter((e) => e.isIntersecting);
        if (intersecting.length) {
          activeSectionId.value = intersecting[0].target.id;
          return;
        }

        // Fallback: pick the section whose top is closest to the viewport top.
        // This helps when sections are very short and may not hit thresholds.
        const closest = sorted
          .filter((e) => e.target?.id)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect?.top ?? 0) -
              Math.abs(b.boundingClientRect?.top ?? 0)
          )[0];

        if (closest) {
          activeSectionId.value = closest.target.id;
        }
      },
      {
        root: rootEl,
        threshold: [0, 0.1],
        rootMargin,
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  };

  onMounted(() => {
    setup();
  });

  // If the caller passes a ref that starts as null, re-init once it becomes available.
  watch(
    () => unref(root),
    () => {
      setup();
    }
  );

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
  });

  return { activeSectionId, scrollTo };
}

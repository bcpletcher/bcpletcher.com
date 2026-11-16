import { onBeforeUnmount, onMounted, ref, unref, watch } from "vue";

/**
 * Scroll-spy for sectioned pages.
 *
 * Contract:
 * - sections: array of section ids (e.g. ["about", "experience"]) that exist in DOM.
 * - root: optional scroll container element OR a Vue ref to an element; if null, uses viewport.
 * - Returns activeSectionId (ref) plus a scrollTo(id) helper.
 *
 * The active section is the last one whose top has crossed an activation line near the
 * top of the viewport. When scrolled to the very end, the last section wins, so a short
 * final section can still become active.
 */
export function useScrollSpy({
  sections,
  root = null,
  // Fraction of the viewport height, measured from the top, where a section activates.
  activationLine = 0.3,
} = {}) {
  const activeSectionId = ref(sections?.[0] ?? null);

  let scrollTarget = null;
  let frame = 0;

  const scrollTo = (id, { behavior = "smooth" } = {}) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior, block: "start" });
  };

  const compute = () => {
    frame = 0;
    const ids = Array.isArray(sections) ? sections : [];
    if (!ids.length) return;

    const rootEl = unref(root) || null;
    const viewTop = rootEl ? rootEl.getBoundingClientRect().top : 0;
    const viewHeight = rootEl ? rootEl.clientHeight : window.innerHeight;
    const line = viewTop + viewHeight * activationLine;

    const atEnd = rootEl
      ? rootEl.scrollTop + rootEl.clientHeight >= rootEl.scrollHeight - 2
      : window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

    let current = ids[0];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) current = id;
    }

    // Only treat "at the end" as the last section when the page actually scrolls.
    const scrollable = rootEl
      ? rootEl.scrollHeight > rootEl.clientHeight
      : document.documentElement.scrollHeight > window.innerHeight;
    if (atEnd && scrollable) current = ids[ids.length - 1];

    activeSectionId.value = current;
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(compute);
  };

  const detach = () => {
    if (scrollTarget) scrollTarget.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    scrollTarget = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const setup = () => {
    detach();
    scrollTarget = unref(root) || window;
    scrollTarget.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    compute();
  };

  onMounted(setup);

  // If the caller passes a ref that starts as null, re-init once it becomes available.
  watch(() => unref(root), setup);

  onBeforeUnmount(detach);

  return { activeSectionId, scrollTo };
}

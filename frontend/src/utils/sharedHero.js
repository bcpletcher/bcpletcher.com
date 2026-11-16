// Shared-element transition for opening a case study: the project image on the card flies
// into the case-study hero. Only one element may hold a view-transition-name at a time, so
// the name is put on the clicked card's image just before navigating and removed again
// shortly after. Without View Transitions support (or with reduced motion) it does nothing.
export const SHARED_HERO_NAME = "case-hero";

const supported = () =>
  typeof document !== "undefined" &&
  typeof document.startViewTransition === "function" &&
  !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export function markSharedHero(img) {
  if (!img || !supported()) return;
  img.style.viewTransitionName = SHARED_HERO_NAME;
  setTimeout(() => {
    img.style.viewTransitionName = "";
  }, 1500);
}

// First visible project image inside a card (list item).
export function findCardImage(from) {
  const card = from?.closest?.("li, article");
  if (!card) return null;
  return (
    [...card.querySelectorAll("img")].find(
      (img) => img.offsetParent !== null && !img.closest(".gallery-thumbs"),
    ) || null
  );
}

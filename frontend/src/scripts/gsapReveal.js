// GSAP reveal-on-scroll helpers.
//
// This replaces the old IntersectionObserver + CSS class approach (v-intersect-animate)
// with smoother motion, better control, and easy stagger support.
//
// Uses ScrollTrigger (part of GSAP) which is locally bundled with the `gsap` package.

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

let registered = false;

function ensureRegistered() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

/**
 * Reveal a single element when it enters the viewport.
 *
 * Timing notes:
 * - The animation triggers when the element's top reaches `start`.
 * - `once: true` means it will not reset when scrolled out.
 */
export function revealOnScroll(el, options = {}) {
  ensureRegistered();

  const opts = {
    once: true,
    // Earlier trigger so elements start animating sooner.
    start: "top 96%",
    end: "bottom 30%",
    y: 18,
    scale: 0.98,
    rotate: -0.35,
    // Blur can look great, but can also look glitchy on some GPUs/screens.
    // Keep it off by default; enable per-element by passing { blur: 6 }.
    blur: 0,
    duration: 0.7,
    ease: "power3.out",
    // When true, we keep the element hidden pre-trigger.
    // This avoids the need for CSS classes and reduces layout thrash.
    immediateRender: false,
    ...options,
  };

  // Respect reduced motion.
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ) {
    gsap.set(el, { clearProps: "all" });
    return () => {};
  }

  // Initial state.
  gsap.set(el, {
    opacity: 0,
    y: opts.y,
    scale: opts.scale,
    rotate: opts.rotate,
    filter: opts.blur ? `blur(${opts.blur}px)` : "none",
    transformOrigin: "50% 50%",
    willChange: "transform, opacity, filter",
  });

  const tween = gsap.to(el, {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    filter: opts.blur ? "blur(0px)" : "none",
    duration: opts.duration,
    ease: opts.ease,
    immediateRender: opts.immediateRender,
    scrollTrigger: {
      trigger: el,
      start: opts.start,
      end: opts.end,
      toggleActions: opts.once
        ? "play none none none"
        : "play reverse play reverse",
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

/**
 * Reveal children of a container with a stagger.
 * Useful for lists/cards.
 */
export function revealChildrenOnScroll(containerEl, options = {}) {
  ensureRegistered();

  const opts = {
    selector: "> *",
    once: true,
    start: "top 90%",
    y: 18,
    scale: 0.98,
    rotate: -0.35,
    blur: 0,
    duration: 0.65,
    stagger: 0.06,
    ease: "power3.out",
    ...options,
  };

  const children = Array.from(
    containerEl.querySelectorAll(opts.selector)
  ).filter(Boolean);

  if (!children.length) return () => {};

  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ) {
    gsap.set(children, { clearProps: "all" });
    return () => {};
  }

  gsap.set(children, {
    opacity: 0,
    y: opts.y,
    scale: opts.scale,
    rotate: opts.rotate,
    filter: opts.blur ? `blur(${opts.blur}px)` : "none",
    transformOrigin: "50% 50%",
    willChange: "transform, opacity, filter",
  });

  const tween = gsap.to(children, {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    filter: opts.blur ? "blur(0px)" : "none",
    duration: opts.duration,
    ease: opts.ease,
    stagger: opts.stagger,
    scrollTrigger: {
      trigger: containerEl,
      start: opts.start,
      toggleActions: opts.once
        ? "play none none none"
        : "play reverse play reverse",
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}

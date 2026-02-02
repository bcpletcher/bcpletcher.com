// v-gsap-reveal
//
// Usage:
//  - v-gsap-reveal                 (defaults)
//  - v-gsap-reveal="{ once: true, start: 'top 90%', y: 24 }"
//
// This directive is self-contained (no separate helper file).

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

let registered = false;

function ensureRegistered() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
}

function revealOnScroll(el, options = {}) {
  ensureRegistered();

  const opts = {
    once: true,
    // Earlier trigger so elements animate sooner.
    start: "top 96%",
    end: "bottom 30%",
    y: 18,
    scale: 0.98,
    rotate: -0.35,
    blur: 0,
    duration: 0.7,
    ease: "power3.out",
    immediateRender: false,
    ...options,
  };

  if (prefersReducedMotion()) {
    gsap.set(el, { clearProps: "all" });
    return () => {};
  }

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

export default {
  mounted(el, binding) {
    const options =
      binding && typeof binding.value === "object" ? binding.value : {};

    el.__gsapRevealCleanup = revealOnScroll(el, options);
  },
  unmounted(el) {
    el.__gsapRevealCleanup?.();
    delete el.__gsapRevealCleanup;
  },
};

import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// v-gsap-reveal
// Smooth fade-in + upward motion as the element scrolls into view.
//
// Usage examples:
//   <div v-gsap-reveal class="card">...</div>
//   <div v-gsap-reveal="{ y: 24, duration: 0.9, delay: 0.05, once: true }">...</div>
//   <div v-gsap-reveal="{ start: 'top 85%', end: 'bottom 60%', scrub: false }">...</div>
//
// Notes:
// - Defaults are tuned to avoid any “snap” at the end with an easeOut curve.
// - Respects prefers-reduced-motion.
// - Cleans up ScrollTrigger/tweens on unmount.

const DEFAULTS = {
  // Animation
  y: 18,
  opacity: 0,
  duration: 0.85,
  delay: 0,
  ease: "power2.out",
  overwrite: "auto",
  clearProps: "transform,opacity",

  // Trigger behavior
  once: true,
  start: "top 92%",
  end: "bottom 60%",
  scrub: false,

  // First load behavior
  // If true, elements already in/near the viewport on mount will be shown immediately
  // (no animation). Elements below the fold will still animate when scrolled into view.
  skipInitialInView: true,

  // Performance
  anticipatePin: 1,
  invalidateOnRefresh: true,
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toOptions(binding) {
  const val = binding?.value;
  if (!val) return {};
  if (typeof val === "object") return val;
  // Support shorthand duration: v-gsap-reveal="0.9"
  if (typeof val === "number") return { duration: val };
  return {};
}

function ensureGsap() {
  // Register once. Safe to call repeatedly.
  try {
    gsap.registerPlugin(ScrollTrigger);
  } catch {
    // If registration fails for any reason, we still fail gracefully.
  }
}

function cleanup(el) {
  if (el.__gsapRevealTween) {
    el.__gsapRevealTween.kill();
    delete el.__gsapRevealTween;
  }
  if (el.__gsapRevealTrigger) {
    el.__gsapRevealTrigger.kill();
    delete el.__gsapRevealTrigger;
  }
}

function setup(el, binding) {
  cleanup(el);
  ensureGsap();

  const user = toOptions(binding);
  const opts = { ...DEFAULTS, ...user };

  // Reduced motion: render immediately, no transforms.
  if (prefersReducedMotion()) {
    gsap.set(el, { clearProps: "all", opacity: 1 });
    return;
  }

  // If the element is already in view on first load, don't animate it.
  // This avoids the “stuff animates even though I'm already looking at it” effect.
  if (
    opts.skipInitialInView &&
    typeof window !== "undefined" &&
    el?.getBoundingClientRect
  ) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;

    // Consider it "initially in view" if any part is within the viewport.
    // (Simple + robust; avoids parsing ScrollTrigger's start string.)
    const inView = rect.top < vh && rect.bottom > 0;

    if (inView) {
      gsap.set(el, { clearProps: "all", opacity: 1 });
      return;
    }
  }

  // Hint the browser for smoother transforms while animating.
  // We remove it after completion to avoid long-lived memory usage.
  el.style.willChange = "transform, opacity";

  // Initial state (avoids FOUC and ensures deterministic start)
  gsap.set(el, { opacity: opts.opacity, y: opts.y });

  // Create tween paused; ScrollTrigger will control play.
  const tween = gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.ease,
    overwrite: opts.overwrite,
    clearProps: opts.clearProps,
    paused: true,
    onComplete: () => {
      // Avoid any lingering will-change once animation is finished.
      el.style.willChange = "";
    },
  });

  const trigger = ScrollTrigger.create({
    trigger: el,
    start: opts.start,
    end: opts.end,
    once: opts.once,
    scrub: opts.scrub,
    anticipatePin: opts.anticipatePin,
    invalidateOnRefresh: opts.invalidateOnRefresh,
    onEnter: () => tween.play(),
    onEnterBack: () => {
      if (!opts.once) tween.play();
    },
    onLeave: () => {
      if (!opts.once) tween.pause(0);
    },
    onLeaveBack: () => {
      if (!opts.once) tween.pause(0);
    },
  });

  el.__gsapRevealTween = tween;
  el.__gsapRevealTrigger = trigger;
}

export default {
  mounted(el, binding) {
    // If the element is display:none at mount (e.g., v-if in inactive tab),
    // ScrollTrigger may measure 0 sizes. Defer one tick.
    requestAnimationFrame(() => setup(el, binding));
  },

  updated(el, binding) {
    // If options change dynamically, rebuild.
    // Keep it cheap: only rebuild when the binding value reference changes.
    if (binding?.value !== binding?.oldValue) {
      requestAnimationFrame(() => {
        setup(el, binding);
        // Recalculate trigger positions.
        try {
          ScrollTrigger.refresh();
        } catch {
          // no-op
        }
      });
    }
  },

  unmounted(el) {
    cleanup(el);
  },
};

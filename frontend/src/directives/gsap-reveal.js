import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// v-gsap-reveal
// Smooth fade-in + upward motion as the element scrolls into view.
//
// Single element (default):
//   <div v-gsap-reveal class="card">...</div>
//   <div v-gsap-reveal="{ y: 24, duration: 0.9, delay: 0.05 }">...</div>
//
// Group / stagger (performance-friendly for grids/lists):
//   <ul v-gsap-reveal="{ group: true, childSelector: '.card', stagger: 0.06 }">
//     <li class="card" v-for="...">...</li>
//   </ul>
//
// Notes:
// - Defaults are tuned to avoid any “snap” at the end with an easeOut curve.
// - Respects prefers-reduced-motion.
// - Cleans up ScrollTrigger/tweens on unmount.

const DEFAULTS = {
  // Animation
  y: 18,
  x: 0,
  scale: 1,
  rotate: 0,

  // Fade behavior
  // We want a modern fade-in, but in card lists Tailwind may control outer opacity for hover-dimming.
  // Default is to fade an inner wrapper (when present) to avoid fighting those styles.
  fade: true,
  fadeTarget: "inner", // 'inner' | 'self'

  // Use autoAlpha for a more production-friendly opacity toggle (handles visibility)
  // (applied to the fade target)
  autoAlpha: 0,

  // Premium touch: subtle blur -> sharp during reveal.
  // Keep it tiny; heavy blur feels gimmicky and can be expensive on low-end devices.
  blur: true,
  blurAmount: 4, // px

  duration: 0.85,
  delay: 0,
  ease: "power2.out",
  overwrite: "auto",

  // Remove inline styles when done so hover/focus states stay clean.
  // We intentionally do NOT clear opacity/visibility by default to avoid fighting CSS hover states.
  clearProps: "transform",

  // Trigger behavior
  once: true,
  start: "top 92%",
  end: "bottom 60%",
  scrub: false,

  // First load behavior
  // If true, elements already in/near the viewport on mount will be shown immediately
  // (no animation). Elements below the fold will still animate when scrolled into view.
  skipInitialInView: true,

  // Auto-derive the "initial in-view" threshold from `start` (recommended).
  // Set to false if you want to control threshold manually.
  autoInitialInViewThreshold: true,

  // When autoInitialInViewThreshold is false, use this threshold
  // (percentage of viewport height; 0.92 matches `start: "top 92%"`).
  initialInViewThreshold: 0.92,

  // Group / stagger mode (single trigger, multiple children)
  group: false,
  childSelector: null,
  stagger: 0.06,

  // Performance
  anticipatePin: 1,
  invalidateOnRefresh: true,

  // If true, refresh ScrollTrigger after mount/update (safe default).
  // If you apply this directive to very large lists, you can set it false per instance.
  refreshOnMount: true,
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
    // If registration fails for any reason, fail gracefully.
  }
}

function safeRefresh() {
  try {
    ScrollTrigger.refresh();
  } catch {
    // no-op
  }
}

function cleanup(el) {
  if (el.__gsapRevealTweens) {
    el.__gsapRevealTweens.forEach((t) => {
      t?.kill?.();
      t?.__fadeTween?.kill?.();
    });
    delete el.__gsapRevealTweens;
  }

  if (el.__gsapRevealTween) {
    el.__gsapRevealTween.__fadeTween?.kill?.();
    el.__gsapRevealTween.kill();
    delete el.__gsapRevealTween;
  }

  if (el.__gsapRevealTrigger) {
    el.__gsapRevealTrigger.kill();
    delete el.__gsapRevealTrigger;
  }

  if (el.__gsapRevealResizeHandler) {
    window.removeEventListener("resize", el.__gsapRevealResizeHandler);
    delete el.__gsapRevealResizeHandler;
  }

  if (el?.style) {
    // If an element is unmounted mid-animation, don't leave it with will-change.
    el.style.willChange = "";
  }
}

function parseStartPercent(start) {
  // Supports the common form: "top 92%" or "top+=20 85%".
  // If we can't parse a %, return null.
  if (typeof start !== "string") return null;
  const match = start.match(/\b(\d{1,3})%\b/);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  return Math.min(1, Math.max(0, n / 100));
}

function getInitialThreshold(opts) {
  if (opts.autoInitialInViewThreshold) {
    const fromStart = parseStartPercent(opts.start);
    if (typeof fromStart === "number") return fromStart;
  }
  return typeof opts.initialInViewThreshold === "number" ? opts.initialInViewThreshold : 0.92;
}

function elementIsInitiallyVisible(el, thresholdRatio) {
  if (typeof window === "undefined" || !el?.getBoundingClientRect) return false;

  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  if (!vh) return false;

  // Any overlap with viewport.
  const anyOnScreen = rect.top < vh && rect.bottom > 0;
  if (!anyOnScreen) return false;

  // Above the start threshold line.
  const thresholdPx = vh * thresholdRatio;
  return rect.top <= thresholdPx;
}

function setInitialState(target, opts) {
  const base = {
    y: opts.y,
    x: opts.x,
    scale: opts.scale,
    rotate: opts.rotate,
  };

  // Always set transforms on the target element itself.
  gsap.set(target, base);

  if (opts.fade) {
    const fadeEl = resolveFadeTarget(target, opts);
    const fadeState = { autoAlpha: opts.autoAlpha };

    if (opts.blur) {
      fadeState.filter = `blur(${Math.max(0, Number(opts.blurAmount) || 0)}px)`;
    }

    gsap.set(fadeEl, fadeState);
  }
}

function createTween(target, opts) {
  const vars = {
    y: 0,
    x: 0,
    scale: 1,
    rotate: 0,
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.ease,
    overwrite: opts.overwrite,
    clearProps: opts.clearProps,
    paused: true,
  };

  const tween = gsap.to(target, vars);

  if (opts.fade) {
    const fadeEl = resolveFadeTarget(target, opts);

    const fadeVars = {
      autoAlpha: 1,
      duration: opts.duration,
      delay: opts.delay,
      ease: opts.ease,
      overwrite: opts.overwrite,
      clearProps: "opacity,visibility,filter",
      paused: true,
    };

    if (opts.blur) {
      fadeVars.filter = "blur(0px)";
    }

    // Fade separately so the outer element's opacity can remain owned by CSS when desired.
    const fadeTween = gsap.to(fadeEl, fadeVars);

    // Link play/pause/seek with the main tween.
    tween.eventCallback("onStart", () => fadeTween.play());
    tween.eventCallback("onComplete", () => fadeTween.progress(1));

    // Store on the tween for cleanup.
    tween.__fadeTween = fadeTween;
  }

  return tween;
}

function setupSingle(el, opts) {
  // Hint the browser for smoother transforms while animating.
  // We remove it after completion to avoid long-lived memory usage.
  el.style.willChange = "transform, opacity";

  setInitialState(el, opts);

  const tween = createTween(el, {
    ...opts,
    // Ensure will-change is removed when the tween completes.
    // (kept here to avoid repeating in group mode)
    onComplete: undefined,
  });

  tween.eventCallback("onComplete", () => {
    el.style.willChange = "";
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

function resolveChildren(containerEl, opts) {
  if (opts.childSelector && typeof opts.childSelector === "string") {
    return Array.from(containerEl.querySelectorAll(opts.childSelector));
  }
  // Default: direct children
  return Array.from(containerEl.children || []);
}

function resolveFadeTarget(el, opts) {
  if (!opts.fade) return el;

  if (opts.fadeTarget === "inner") {
    const inner = el.querySelector?.("[data-gsap-reveal-inner]");
    if (inner) return inner;
  }

  return el;
}

function setupGroup(el, opts) {
  const children = resolveChildren(el, opts).filter(Boolean);
  if (!children.length) {
    // If no children found, fall back to single behavior on the container.
    setupSingle(el, opts);
    return;
  }

  // Only animate children; keep container layout stable.
  children.forEach((child) => {
    child.style.willChange = "transform";
    const fadeEl = resolveFadeTarget(child, opts);
    if (fadeEl?.style) fadeEl.style.willChange = opts.blur ? "opacity, filter" : "opacity";

    setInitialState(child, opts);
  });

  const tl = gsap.timeline({ paused: true });

  // Transform timeline
  tl.to(
    children,
    {
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0,
      duration: opts.duration,
      delay: opts.delay,
      ease: opts.ease,
      overwrite: opts.overwrite,
      stagger: opts.stagger,
      clearProps: opts.clearProps,
    },
    0
  );

  // Fade timeline (inner by default)
  if (opts.fade) {
    const fadeEls = children.map((c) => resolveFadeTarget(c, opts));

    const fadeVars = {
      autoAlpha: 1,
      duration: opts.duration,
      delay: opts.delay,
      ease: opts.ease,
      overwrite: opts.overwrite,
      stagger: opts.stagger,
      clearProps: "opacity,visibility,filter",
    };

    if (opts.blur) {
      fadeVars.filter = "blur(0px)";
    }

    tl.to(fadeEls, fadeVars, 0);
  }

  tl.eventCallback("onComplete", () => {
    children.forEach((child) => {
      if (child?.style) child.style.willChange = "";
    });
  });

  const play = () => tl.play();
  const reset = () => {
    if (opts.once) return;
    tl.pause(0);
    children.forEach((child) => setInitialState(child, opts));
  };

  // One trigger for the whole group.
  const trigger = ScrollTrigger.create({
    trigger: el,
    start: opts.start,
    end: opts.end,
    once: opts.once,
    scrub: opts.scrub,
    anticipatePin: opts.anticipatePin,
    invalidateOnRefresh: opts.invalidateOnRefresh,
    onEnter: play,
    onEnterBack: () => {
      if (!opts.once) play();
    },
    onLeave: reset,
    onLeaveBack: reset,
  });

  // Store so we can kill timelines on cleanup.
  el.__gsapRevealTweens = [tl];
  el.__gsapRevealTrigger = trigger;
}

function setup(el, binding) {
  cleanup(el);
  ensureGsap();

  const user = toOptions(binding);
  const opts = { ...DEFAULTS, ...user };

  // Reduced motion: render immediately, no transforms.
  if (prefersReducedMotion()) {
    if (opts.fade) {
      const fadeEl = resolveFadeTarget(el, opts);
      gsap.set(fadeEl, { clearProps: "all", autoAlpha: 1 });
    }
    gsap.set(el, { clearProps: "transform" });
    return;
  }

  const threshold = getInitialThreshold(opts);

  // If the element is already in view on first load, don't animate it.
  // (Show immediately)
  if (opts.skipInitialInView && elementIsInitiallyVisible(el, threshold)) {
    if (opts.fade) {
      const fadeEl = resolveFadeTarget(el, opts);
      gsap.set(fadeEl, { clearProps: "all", autoAlpha: 1 });
    }
    gsap.set(el, { clearProps: "transform" });
    return;
  }

  if (opts.group) {
    setupGroup(el, opts);
  } else {
    setupSingle(el, opts);
  }

  // Keep triggers accurate through responsive layout changes.
  // (Very lightweight; refresh is throttled by the browser's event loop.)
  if (typeof window !== "undefined") {
    const onResize = () => safeRefresh();
    el.__gsapRevealResizeHandler = onResize;
    window.addEventListener("resize", onResize, { passive: true });
  }
}

export default {
  mounted(el, binding) {
    // If the element is display:none at mount (e.g., v-if in inactive tab),
    // ScrollTrigger may measure 0 sizes. Defer one tick.
    requestAnimationFrame(() => {
      setup(el, binding);

      const user = toOptions(binding);
      const opts = { ...DEFAULTS, ...user };
      if (opts.refreshOnMount) safeRefresh();
    });
  },

  updated(el, binding) {
    // If options change dynamically, rebuild.
    // Keep it cheap: only rebuild when the binding value reference changes.
    if (binding?.value !== binding?.oldValue) {
      requestAnimationFrame(() => {
        setup(el, binding);

        const user = toOptions(binding);
        const opts = { ...DEFAULTS, ...user };
        if (opts.refreshOnMount) safeRefresh();
      });
    }
  },

  unmounted(el) {
    cleanup(el);
  },
};

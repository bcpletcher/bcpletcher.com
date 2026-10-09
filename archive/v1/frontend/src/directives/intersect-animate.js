// Generic IntersectionObserver-based reveal-on-scroll directive
// Usage: v-intersect-animate="{ once: true, threshold: 0.2 }"

const DEFAULT_OPTIONS = {
  once: true,
  threshold: 0.2,
};

function createObserver(el, options) {
  const opts = { ...DEFAULT_OPTIONS, ...(options || {}) };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-fade-pop-active");
          el.classList.remove("reveal-fade-pop-initial");

          if (opts.once) {
            observer.unobserve(el);
          }
        } else if (!opts.once) {
          // If not once, reset when leaving viewport
          el.classList.add("reveal-fade-pop-initial");
          el.classList.remove("reveal-fade-pop-active");
        }
      });
    },
    {
      threshold: opts.threshold,
    }
  );

  observer.observe(el);
  el.__intersectAnimateObserver = observer;
}

export default {
  mounted(el, binding) {
    // Initial hidden state
    el.classList.add("reveal-fade-pop-initial");

    const options =
      binding && typeof binding.value === "object" ? binding.value : {};
    createObserver(el, options);
  },
  unmounted(el) {
    if (el.__intersectAnimateObserver) {
      el.__intersectAnimateObserver.disconnect();
      delete el.__intersectAnimateObserver;
    }
  },
};

// v-img-fade: fade an <img> in once it has loaded (instead of popping in).
// Works with lazy-loaded images; if the image fails, it is revealed so alt text/fallbacks show.
//
// Lazy images are also fetched ahead of scrolling: the browser's own lazy threshold is
// conservative, so a fast scroll outruns it and shows an empty frame. We watch each lazy
// image with a generous margin (a screen and a half above and below the viewport) and
// switch it to eager loading as soon as it gets that close.
const PRELOAD_MARGIN = "150% 0px";

let observer = null;

const getObserver = () => {
  if (observer || typeof IntersectionObserver === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.loading = "eager";
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: PRELOAD_MARGIN },
  );
  return observer;
};

export default {
  mounted(el) {
    el.classList.add("img-fade");
    const reveal = () => el.classList.add("is-loaded");
    if (el.complete && el.naturalWidth > 0) {
      reveal();
      return;
    }
    el.addEventListener("load", reveal, { once: true });
    el.addEventListener("error", reveal, { once: true });

    if (el.loading === "lazy") getObserver()?.observe(el);
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};

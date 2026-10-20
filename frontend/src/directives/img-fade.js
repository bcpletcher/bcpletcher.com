// v-img-fade: fade an <img> in once it has loaded (instead of popping in).
// Works with lazy-loaded images; if the image fails, it is revealed so alt text/fallbacks show.
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
  },
};

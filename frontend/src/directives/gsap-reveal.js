// v-gsap-reveal
//
// Usage:
//  - v-gsap-reveal                 (defaults)
//  - v-gsap-reveal="{ once: true, start: 'top 90%', y: 24 }"
//
// Pairs with src/scripts/gsapReveal.js

import { revealOnScroll } from "@/scripts/gsapReveal.js";

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

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/css/fonts.css";
import "./assets/css/global.css";
import "./assets/css/tailwind.css";

import gsapReveal from "./directives/gsap-reveal";
import { initAnalytics } from "./utils/analytics";

// Always start at the top on hard refresh.
// Some browsers try to restore scroll on reload; this opts out when available.
if (typeof window !== "undefined") {
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {
    // no-op
  }
}

initAnalytics();

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.directive("gsap-reveal", gsapReveal);

app.mount("#app");

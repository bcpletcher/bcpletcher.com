import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/css/fonts.css";
import "./assets/css/global.css";
import "./assets/css/tailwind.css";

import gsapReveal from "./directives/gsap-reveal";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.directive("gsap-reveal", gsapReveal);

app.mount("#app");

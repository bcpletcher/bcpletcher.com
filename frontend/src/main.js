import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/css/fonts.scss";
import "./assets/css/global.scss";
import "./assets/css/tailwind.scss";
import "./assets/css/animate.scss";

import intersectAnimate from "./directives/intersect-animate";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.directive("intersect-animate", intersectAnimate);

app.mount("#app");

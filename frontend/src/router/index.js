import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/resume",
    name: "Resume",
    component: () => import("@/views/Resume.vue"),
    meta: { fullWidth: true },
  },
  {
    path: "/projects",
    name: "Projects",
    component: () => import("@/views/Projects.vue"),
  },
  {
    path: "/:catchAll(.*)",
    component: () => import("@/views/Home.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Ignore savedPosition so back/forward also loads at the top.
    void from;
    void savedPosition;

    return new Promise((resolve) => {
      // Two frames gives the new view time to render on iOS Safari.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve({ left: 0, top: 0, behavior: "auto" });
        });
      });
    });
  },
});

export default router;

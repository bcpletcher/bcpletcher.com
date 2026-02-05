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
    if (savedPosition) return savedPosition;

    // Returning a Promise allows us to wait a tick for layout/render, which helps
    // on mobile Safari.
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve({ left: 0, top: 0, behavior: "auto" });
      });
    });
  },
});

export default router;

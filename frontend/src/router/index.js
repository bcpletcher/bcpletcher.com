import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/projects",
    name: "Scrapbook",
    component: () => import("@/views/Scrapbook.vue"),
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("@/views/Admin.vue"),
    meta: {},
  },
  {
    path: "/resume",
    name: "Resume",
    component: () => import("@/views/Resume.vue"),
    meta: { fullWidth: true },
  },
  {
    path: "/:catchAll(.*)",
    component: () => import("@/views/Home.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    // NOTE: We intentionally ignore savedPosition so the app doesn't remember scroll
    // location (including on refresh/back/forward). Every navigation starts at the top,
    // except hash navigation on Home.

    // Allow hash navigation on the Home page (e.g. /#about) to scroll to the anchor.
    // Vue Router will handle finding the element via the selector.
    if (to.name === "Home" && to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    }

    return { left: 0, top: 0 };
  },
});

// router.beforeEach((to, from, next) => {});
export default router;

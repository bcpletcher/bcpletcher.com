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
  scrollBehavior(to, from, savedPosition) {
    // Back/forward navigation should restore previous scroll.
    if (savedPosition) return savedPosition;

    // Allow hash navigation on the Home page (e.g. /#about) to scroll to the anchor.
    // Vue Router will handle finding the element via the selector.
    if (to.name === "Home" && to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    }

    // Default: every navigation starts at the top.
    return { left: 0, top: 0 };
  },
});

// router.beforeEach((to, from, next) => {});
export default router;

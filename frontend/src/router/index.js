import { createRouter, createWebHistory } from "vue-router";

// Opt out of the browser's scroll restoration so SPA navigations don't inherit
// previous scroll positions (notably on mobile Safari).
if (typeof window !== "undefined") {
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  } catch {
    // no-op
  }
}

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
  scrollBehavior(to) {
    // Smooth in-page navigation only for hash links on Home.
    if (to.name === "Home" && to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }

    // Always snap to the top for actual route navigations.
    return { left: 0, top: 0 };
  },
});

export default router;

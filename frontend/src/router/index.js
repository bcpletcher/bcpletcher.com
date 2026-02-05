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
    redirect: "/resume.pdf",
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

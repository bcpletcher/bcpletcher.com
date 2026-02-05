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
  scrollBehavior(to) {
    // Always start at top on route changes.
    // Use smooth scrolling only for in-page hash navigation on Home.
    if (to.name === "Home" && to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    }

    // Returning a Promise allows us to wait a tick for layout/render, which helps
    // on mobile Safari and when pages use internal scrollers.
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve({ left: 0, top: 0, behavior: "auto" });
      });
    });
  },
});

// Defensive scroll reset: some mobile browsers preserve scroll position on
// programmatic navigations or when an internal scroll container is used.
// This ensures Home -> Projects lands at the top reliably.
router.afterEach(() => {
  if (typeof window === "undefined") return;

  requestAnimationFrame(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      window.scrollTo(0, 0);
    }

    // If a scrollable main container exists, reset it too.
    const scrollers = [
      document.querySelector("main"),
      document.querySelector("[data-scroll-container]"),
      document.querySelector("#app"),
    ].filter(Boolean);

    for (const el of scrollers) {
      if (el && (el.scrollTop || 0) !== 0) el.scrollTop = 0;
    }
  });
});

export default router;

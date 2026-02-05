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
    if (savedPosition) return savedPosition;

    // Smooth in-page navigation only for hash links on Home.
    if (to.name === "Home" && to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }

    // Let the next frame render before snapping to top (helps iOS Safari).
    return new Promise((resolve) => {
      requestAnimationFrame(() => resolve({ left: 0, top: 0 }));
    });
  },
});

function forceScrollTop() {
  if (typeof window === "undefined") return;

  const reset = () => {
    try {
      window.scrollTo(0, 0);
    } catch {
      // no-op
    }

    if (typeof document !== "undefined") {
      try {
        document.documentElement.scrollTop = 0;
      } catch {
        // no-op
      }
      try {
        document.body.scrollTop = 0;
      } catch {
        // no-op
      }
    }
  };

  // Multiple frames helps when the next route does layout measurement.
  requestAnimationFrame(() => {
    reset();
    requestAnimationFrame(reset);
  });
}

router.afterEach((to) => {
  // Don't fight intentional hash scroll on Home.
  if (to.name === "Home" && to.hash) return;

  forceScrollTop();
});

export default router;

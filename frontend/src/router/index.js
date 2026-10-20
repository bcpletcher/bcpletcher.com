import { createRouter, createWebHistory, START_LOCATION } from "vue-router";
import { setCanonical } from "@/utils/seo.js";

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
    // Always load at top on navigation (including back/forward).
    // Ignore savedPosition and hashes to prevent anchor jumps.
    void to;
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

// Smooth cross-fade between pages using the View Transitions API. Progressive
// enhancement: browsers without it (or users who prefer reduced motion) navigate as before.
// The first navigation is skipped so it never fights the boot loader.
const canViewTransition = () =>
  typeof document !== "undefined" &&
  typeof document.startViewTransition === "function" &&
  !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

let finishViewTransition = null;
const settleViewTransition = () => {
  finishViewTransition?.();
  finishViewTransition = null;
};

router.beforeResolve((to, from) => {
  if (!canViewTransition() || from === START_LOCATION || to.path === from.path) {
    return;
  }
  return new Promise((resolve) => {
    document.startViewTransition(() => {
      resolve();
      // Hold the "new" snapshot until the next route has rendered.
      return new Promise((done) => {
        finishViewTransition = done;
      });
    });
  });
});

router.afterEach(() => {
  if (!finishViewTransition) return;
  // Wait a frame so the new view is in the DOM before the transition captures it, with a
  // timer as a safety net so a throttled frame clock (background tab) can never hang it.
  requestAnimationFrame(settleViewTransition);
  setTimeout(settleViewTransition, 250);
});

router.onError(settleViewTransition);

// Keep canonical URL in sync with the current route.
router.afterEach((to) => {
  setCanonical(to.path);
});

function forceWindowScrollTop() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } catch {
    try {
      window.scrollTo(0, 0);
    } catch {
      // no-op
    }
  }

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

// iOS Safari quirk: sometimes it preserves the previous scroll offset even when
// scrollBehavior returns top:0 (notably Home → Projects).
// Fix: apply a targeted reset only when entering /projects.
router.afterEach((to, from) => {
  if (typeof window === "undefined") return;
  if (to.path !== "/projects") return;
  if (from.path === "/projects") return;

  requestAnimationFrame(() => {
    forceWindowScrollTop();
    requestAnimationFrame(forceWindowScrollTop);
  });
});

export default router;

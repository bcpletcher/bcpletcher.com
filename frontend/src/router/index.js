import { createRouter, createWebHistory } from "vue-router";
// import { getAuth, onAuthStateChanged } from "firebase/auth";

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
    meta: {},
  },
  // {
  //   path: "/:catchAll(.*)",
  //   component: Dashboard,
  // },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// router.beforeEach((to, from, next) => {});
export default router;

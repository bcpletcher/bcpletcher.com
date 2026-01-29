import { defineStore } from "pinia";
import { ref } from "vue";

const ADMIN_SESSION_KEY = "adminSessionExpiresAt";
const CACHE_MINUTES = Number(import.meta.env.VITE_CACHE_MINUTES || 60);

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},

    expanded: false,
    sidebarFocus: "About",
    alternativeDisplay: false,

    resources: null,
    scrapbook: null,
  }),
  actions: {
    markAdminSessionActive() {
      const expiresAt = new Date(
        Date.now() + CACHE_MINUTES * 60 * 1000
      ).toISOString();
      localStorage.setItem(ADMIN_SESSION_KEY, expiresAt);
    },
    clearAdminSession() {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    },
    isAdminSessionValid() {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return false;
      const expires = new Date(raw).getTime();
      return Number.isFinite(expires) && expires > Date.now();
    },
  },
  getters: {
    isSignedIn: (state) => {
      return Object.keys(state.user).length > 0;
    },
  },
});

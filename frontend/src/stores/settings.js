import { defineStore } from "pinia";

const CACHE_MINUTES = Number(import.meta.env.VITE_CACHE_MINUTES || 60);

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},

    // Admin session caching is disabled for now.
    // This value is in-memory only and will reset on page refresh.
    adminSessionExpiresAt: null,

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
      this.adminSessionExpiresAt = expiresAt;
    },
    clearAdminSession() {
      this.adminSessionExpiresAt = null;
    },
    isAdminSessionValid() {
      const raw = this.adminSessionExpiresAt;
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

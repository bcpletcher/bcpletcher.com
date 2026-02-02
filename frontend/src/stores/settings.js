import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},

    expanded: false,
    sidebarFocus: "About",
    alternativeDisplay: false,

    scrapbook: null,
    featuredScrapbook: null,
  }),
  actions: {
    // ...existing code...
  },
  getters: {
    isSignedIn: (state) => {
      return Object.keys(state.user).length > 0;
    },
  },
});

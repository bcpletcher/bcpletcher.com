import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},
    alternativeDisplay: false,

    scrapbook: null,
    featuredScrapbook: null,

    showEmulationBanner: true,
  }),
  getters: {
    isSignedIn: (state) => {
      return Object.keys(state.user).length > 0;
    },
  },
});

import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},

    expanded: false,
    sidebarFocus: "About",
    alternativeDisplay: false,

    resources: null,
    scrapbook: null,
  }),
  actions: {},
  getters: {
    isSignedIn: (state) => {
      return Object.keys(state.user).length > 0;
    },
  },
});

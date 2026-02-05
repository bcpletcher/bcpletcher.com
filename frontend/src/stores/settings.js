import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},
    projects: null,
    showAdminModal: false,
  }),
  getters: {
    isSignedIn: (state) => {
      return Object.keys(state.user).length > 0;
    },
  },
});

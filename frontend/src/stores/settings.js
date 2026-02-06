import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    user: {},
    projects: null,
    showAdminModal: false,
    // When true, admin stays signed in but the UI should behave like a public user.
    // (Admin banner/tools remain available.)
    impersonateUser: false,
  }),
  getters: {
    isSignedIn: (state) => {
      return Object.keys(state.user).length > 0;
    },
    // Use this anywhere you want to gate admin-only UI.
    // Keeps actual auth intact, just changes what the UI shows.
    isAdminView: (state) => {
      return Object.keys(state.user).length > 0 && !state.impersonateUser;
    },
  },
});

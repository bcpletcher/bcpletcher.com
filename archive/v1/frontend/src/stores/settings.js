import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    expanded: false,
    sidebarFocus: "About",
    scrapbook: null,
  }),
});

import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    expanded: false,
    sidebarFocus: "About",
    alternativeDisplay: false,

    resources: null,
    scrapbook: null,
  }),
});

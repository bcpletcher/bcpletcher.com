// Common project meta presets for the admin upsert modal.
// `iconClass` keeps the legacy Font Awesome class-string format; <AppIcon> maps it to an
// inline SVG icon (see src/components/shared/app-icon.vue). Add new icons there.

export const PROJECT_META_OPTIONS = {
  award: { label: "Award / Recognition", iconClass: "fa-light fa-award" },
  caseStudy: { label: "Case Study", iconClass: "fa-light fa-file-lines" },
  openSource: { label: "Open Source", iconClass: "fa-brands fa-github" },
  article: { label: "Article / Write-up", iconClass: "fa-light fa-newspaper" },
  personal: { label: "Personal Project", iconClass: "fa-solid fa-heart" },
};

// `meta` is stored in project data as one of these keys (string).
// UI derives label/icon from PROJECT_META_OPTIONS[meta].
export const PROJECT_META_KEYS = Object.keys(PROJECT_META_OPTIONS);

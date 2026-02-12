// Common project meta presets for the admin upsert modal.
// Stored as Font Awesome CSS class strings to match the site's current FA usage.
// NOTE: Keep this list in sync with `src/assets/css/fa-safelist.css` so classes
// are guaranteed to exist in production builds.

export const PROJECT_META_OPTIONS = {
  award: { label: "Award / Recognition", iconClass: "fa-light fa-award" },
  caseStudy: { label: "Case Study", iconClass: "fa-light fa-file-lines" },
  openSource: { label: "Open Source", iconClass: "fa-brands fa-github" },
  article: { label: "Article / Write-up", iconClass: "fa-light fa-newspaper" },
  personal: { label: "Personal Project", iconClass: "fa-solid fa-heart" },
};

// `meta` is stored in Firestore as one of these keys (string).
// UI derives label/icon from PROJECT_META_OPTIONS[meta].
export const PROJECT_META_KEYS = Object.keys(PROJECT_META_OPTIONS);


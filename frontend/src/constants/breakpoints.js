// Centralized breakpoint constants.
//
// Source of truth: Tailwind `theme.screens` (tailwind.config.js).
//
// In the browser bundle we avoid importing tailwind.config.js directly.
// Instead, we mirror the values here and keep them in sync.
//
// If you change Tailwind screens, update this file too.

export const BREAKPOINTS_PX = Object.freeze({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
});

export const LOADER_DEFAULTS = Object.freeze({
  strokeWidth: 16,
  opacityStart: 0.35,
  opacityEnd: 1,
  outlineHeadLength: 1,
  outlineEase: "none",
  fillEase: "none",
  fadeEase: "power1.out",
  zoomEase: "power2.in",
  repeat: 0,

  // Timings (seconds) – these should match the GSAP timeline sequencing
  preOutlineDelay: 0.25,
  outlineDuration: 0.75,
  outlineToFillDelay: 0.0,
  fillDuration: 1.0,
  fillToFadeDelay: 0.0,
  outlineFadeDuration: 0.25,
  postFillHold: 0.125,
  zoomOutDuration: 0.5,
  overlayFadeDuration: 0.25,
});

/**
 * Compute the minimum time (ms) the loader should remain visible
 * to allow its full animation sequence to finish.
 */
export function computeLoaderMinMs(overrides = {}) {
  const t = { ...LOADER_DEFAULTS, ...overrides };

  // Mirrors the GSAP timeline in fullscreen-loader.vue:
  // 0) optional preOutlineDelay
  // 1) outline draw
  // 2) optional outlineToFillDelay
  // 3) fill expand
  // 4) optional fillToFadeDelay
  // 5) outline fade
  // 6) postFillHold
  // 7) zoom out
  // 8) overlay fade
  const totalSeconds =
    (Number(t.preOutlineDelay) || 0) +
    (Number(t.outlineDuration) || 0) +
    (Number(t.outlineToFillDelay) || 0) +
    (Number(t.fillDuration) || 0) +
    (Number(t.fillToFadeDelay) || 0) +
    (Number(t.outlineFadeDuration) || 0) +
    (Number(t.postFillHold) || 0) +
    (Number(t.zoomOutDuration) || 0) +
    (Number(t.overlayFadeDuration) || 0);

  // Small buffer (ms) for render/GSAP scheduling so we don't cut off the last frame.
  const BUFFER_MS = 60;

  return Math.max(0, Math.round(totalSeconds * 1000 + BUFFER_MS));
}

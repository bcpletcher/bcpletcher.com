<template>
  <div
    ref="overlayEl"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-base-background text-slate-200"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="flex flex-col items-center gap-5">
      <svg
        ref="svgEl"
        class="h-20 w-20 sm:h-24 sm:w-24"
        viewBox="0 0 1875 1875"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="logoGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(1875,0,0,1875,0,937.5)"
          >
            <stop offset="0" stop-color="#62cff4" stop-opacity="1" />
            <stop offset="1" stop-color="#0077b6" stop-opacity="1" />
          </linearGradient>

          <!-- Mask: offset radial reveal (starts top-left-ish and expands) -->
          <mask id="logoRevealMask">
            <circle
              ref="maskCircle"
              :cx="MASK_START_X"
              :cy="MASK_START_Y"
              :r="MASK_START_R"
              fill="white"
            />
          </mask>
        </defs>

        <!-- Filled logo -->
        <path
          ref="fillPath"
          d="M312.5,1184.61l-0,451.543c-187.605,-167.923 -307.284,-410.209 -312.5,-680.319c5.207,-274.973 124.51,-522.238 312.5,-696.383l-0,678.053l0.345,-0c-0.153,4.064 -0.268,8.137 -0.345,12.22c4.365,226.061 128.993,422.889 312.5,529.1c91.94,53.213 198.661,83.68 312.441,83.68c291.014,0 535.844,-199.307 605.321,-468.75l-334.624,0c-54.066,93.378 -155.067,156.25 -270.638,156.25c-172.473,0 -312.5,-140.027 -312.5,-312.5l0,-873.007c103.017,-39.643 214.441,-62.289 330.83,-64.493c508.983,9.828 919.17,426.095 919.17,937.411c-0,517.47 -420.119,937.589 -937.589,937.589c-109.517,0 -214.674,-18.818 -312.411,-53.394l0,-289.244c-141.431,-74.493 -253.134,-197.949 -312.5,-347.756Zm1230.29,-403.356c-68.457,-265.705 -307.428,-463.234 -593.073,-468.75c-99.703,1.888 -193.942,26.277 -277.845,68.296l-0,392.099c55.151,-88.754 153.536,-147.895 265.625,-147.895c115.571,0 216.572,62.872 270.638,156.25l334.655,0Z"
          fill="url(#logoGradient)"
          mask="url(#logoRevealMask)"
        />

        <!-- Outline pass -->
        <path
          ref="strokePath"
          d="M312.5,1184.61l-0,451.543c-187.605,-167.923 -307.284,-410.209 -312.5,-680.319c5.207,-274.973 124.51,-522.238 312.5,-696.383l-0,678.053l0.345,-0c-0.153,4.064 -0.268,8.137 -0.345,12.22c4.365,226.061 128.993,422.889 312.5,529.1c91.94,53.213 198.661,83.68 312.441,83.68c291.014,0 535.844,-199.307 605.321,-468.75l-334.624,0c-54.066,93.378 -155.067,156.25 -270.638,156.25c-172.473,0 -312.5,-140.027 -312.5,-312.5l0,-873.007c103.017,-39.643 214.441,-62.289 330.83,-64.493c508.983,9.828 919.17,426.095 919.17,937.411c-0,517.47 -420.119,937.589 -937.589,937.589c-109.517,0 -214.674,-18.818 -312.411,-53.394l0,-289.244c-141.431,-74.493 -253.134,-197.949 -312.5,-347.756Zm1230.29,-403.356c-68.457,-265.705 -307.428,-463.234 -593.073,-468.75c-99.703,1.888 -193.942,26.277 -277.845,68.296l-0,392.099c55.151,-88.754 153.536,-147.895 265.625,-147.895c115.571,0 216.572,62.872 270.638,156.25l334.655,0Z"
          fill="none"
          stroke="url(#logoGradient)"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import gsap from "gsap";
import { LOADER_DEFAULTS } from "@/constants/loaderTiming.js";

const emit = defineEmits(["done"]);

const props = defineProps({
  isReady: { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
});

// Keep simple local bindings for template usage.
const strokeWidth = LOADER_DEFAULTS.strokeWidth;

// Helper used by the outline drawing setup.
const getOutlineHeadLength = () => {
  const v = Number(LOADER_DEFAULTS.outlineHeadLength);
  if (!Number.isFinite(v) || v <= 0) return 1;
  return Math.min(1, v);
};

const overlayEl = ref(null);
const svgEl = ref(null);
const strokePath = ref(null);
const fillPath = ref(null);
const maskCircle = ref(null);

let tl;
let didTimelineComplete = false;
let didFadeOut = false;

const VIEWBOX_SIZE = 1875;

// Start the reveal near the top-left (avoid absolute corner)
const MASK_START_X = VIEWBOX_SIZE * 0.28;
const MASK_START_Y = VIEWBOX_SIZE * 0.25;

// Expand enough to cover the full viewBox (farthest-corner distance from the start point)
const MASK_START_R = 0;
const dx = Math.max(MASK_START_X, VIEWBOX_SIZE - MASK_START_X);
const dy = Math.max(MASK_START_Y, VIEWBOX_SIZE - MASK_START_Y);
const MASK_END_R = Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 10;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

// Runs the final fade sequence (logo zoom/fade + overlay fade).
// This is intentionally separate so we can trigger it after a delay.
const runFadeOut = () => {
  if (didFadeOut) return;
  if (!overlayEl.value || !svgEl.value) return;

  didFadeOut = true;

  // Stop any existing timeline so we don't double-animate.
  tl?.kill();
  tl = null;

  // Logo zoom out
  gsap.to(svgEl.value, {
    scale: 0,
    opacity: 0,
    duration: LOADER_DEFAULTS.zoomOutDuration,
    ease: LOADER_DEFAULTS.zoomEase,
  });

  // Overlay fade
  gsap.to(overlayEl.value, {
    opacity: 0,
    duration: LOADER_DEFAULTS.overlayFadeDuration,
    ease: "none",
    delay: LOADER_DEFAULTS.zoomOutDuration,
    onComplete: () => {
      emit("done");
    },
  });
};

const maybeFadeOut = () => {
  if (didFadeOut) return;
  if (!didTimelineComplete) return;
  if (!props.isReady) return;
  if (props.hasError) return;

  runFadeOut();
};

onMounted(() => {
  if (
    !overlayEl.value ||
    !strokePath.value ||
    !fillPath.value ||
    !maskCircle.value ||
    !svgEl.value
  )
    return;

  if (prefersReducedMotion()) {
    maskCircle.value.setAttribute("r", String(MASK_END_R));
    strokePath.value.style.opacity = "0";
    // Treat the base animation as complete so isReady can dismiss the overlay.
    didTimelineComplete = true;
    maybeFadeOut();
    return;
  }

  // Ensure overlay + zoom start from a neutral state
  gsap.set(overlayEl.value, { opacity: 1 });
  gsap.set(svgEl.value, {
    scale: 1,
    opacity: 1,
    transformOrigin: "50% 50%",
  });

  // Prep stroke
  const pathLength = strokePath.value.getTotalLength();

  // Outline draw styles:
  // - Classic (outlineHeadLength=1): dasharray=full path, dashoffset animates from full->0.
  // - Marker window (outlineHeadLength<1): dasharray=[head][gap], dashoffset animates and
  //   the "head" moving around feels calmer than a full reveal.
  const headFrac = getOutlineHeadLength();
  if (headFrac >= 1) {
    strokePath.value.style.strokeDasharray = `${pathLength}`;
    strokePath.value.style.strokeDashoffset = `${pathLength}`;
  } else {
    const headLen = Math.max(1, pathLength * headFrac);
    strokePath.value.style.strokeDasharray = `${headLen} ${pathLength}`;
    // Start with the head off the path, then sweep through.
    strokePath.value.style.strokeDashoffset = `${pathLength + headLen}`;
  }

  strokePath.value.style.opacity = String(LOADER_DEFAULTS.opacityStart);

  // Prep fill
  fillPath.value.style.opacity = String(LOADER_DEFAULTS.opacityStart);

  // Prep mask
  maskCircle.value.setAttribute("r", String(MASK_START_R));

  tl = gsap.timeline({ repeat: LOADER_DEFAULTS.repeat });

  didTimelineComplete = false;
  didFadeOut = false;

  // Timeline (relative):
  // t=0s .............................................. start
  // t=preOutlineDelay ................................. outline starts
  // t=outlineDuration ................................. outline finished
  // t=... + outlineToFillDelay ......................... fill starts
  // t=... + fillDuration ............................... fill completed
  // t=... + fillToFadeDelay ............................ outline fade begins
  // t=... + outlineFadeDuration ......................... outline fully faded
  // t=... + postFillHold ............................... zoom out begins
  // t=... + zoomOutDuration ............................. logo fully gone
  // t=... + overlayFadeDuration ......................... overlay fully gone
  // 0) Optional pause before the outline starts drawing
  if (LOADER_DEFAULTS.preOutlineDelay > 0) {
    tl.to({}, { duration: LOADER_DEFAULTS.preOutlineDelay });
  }

  // 1) Draw the outline stroke (kept at opacityStart)
  tl.to(strokePath.value, {
    strokeDashoffset: 0,
    duration: LOADER_DEFAULTS.outlineDuration,
    ease: LOADER_DEFAULTS.outlineEase,
  });

  // 2) Optional pause between outline finishing and fill starting
  if (LOADER_DEFAULTS.outlineToFillDelay > 0) {
    tl.to({}, { duration: LOADER_DEFAULTS.outlineToFillDelay });
  }

  // 3) Fill reveal: expand radial mask while ramping both fill + outline opacity to opacityEnd
  tl.to(
    maskCircle.value,
    {
      attr: { r: MASK_END_R },
      duration: LOADER_DEFAULTS.fillDuration,
      ease: LOADER_DEFAULTS.fillEase,
    },
    ">"
  )
    .to(
      strokePath.value,
      {
        opacity: LOADER_DEFAULTS.opacityEnd,
        duration: LOADER_DEFAULTS.fillDuration,
        ease: "none",
      },
      "<"
    )
    .to(
      fillPath.value,
      {
        opacity: LOADER_DEFAULTS.opacityEnd,
        duration: LOADER_DEFAULTS.fillDuration,
        ease: "none",
      },
      "<"
    )
    .addLabel("fillDone");

  // 4) Optional pause between fill completing and outline fade starting
  if (LOADER_DEFAULTS.fillToFadeDelay > 0) {
    tl.to({}, { duration: LOADER_DEFAULTS.fillToFadeDelay }, "fillDone");
  }

  // 5) Fade the outline out (fill remains visible)
  tl.to(
    strokePath.value,
    {
      opacity: 0,
      duration: LOADER_DEFAULTS.outlineFadeDuration,
      ease: LOADER_DEFAULTS.fadeEase,
    },
    LOADER_DEFAULTS.fillToFadeDelay > 0
      ? "fillDone+=fillToFadeDelay"
      : "fillDone"
  );

  // 6) Hold on the finished filled logo for postFillHold seconds
  if (LOADER_DEFAULTS.postFillHold > 0) {
    tl.to({}, { duration: LOADER_DEFAULTS.postFillHold });
  }

  // When the base animation completes, mark it and attempt to fade out.
  tl.eventCallback("onComplete", () => {
    didTimelineComplete = true;
    maybeFadeOut();
  });

  // In case the API already finished before we mounted / before the timeline block.
  maybeFadeOut();
});

watch(
  () => [props.isReady, props.hasError],
  () => {
    // Only fade out once BOTH conditions are met:
    // 1) Base animation finished
    // 2) App reports ready (and no error)
    maybeFadeOut();
  }
);

onBeforeUnmount(() => {
  tl?.kill();
  tl = null;
});
</script>

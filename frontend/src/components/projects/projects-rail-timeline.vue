<template>
  <div class="hidden lg:block h-full">
    <div class="flex h-full min-h-[calc(100vh-12rem)] flex-col gap-6">
      <slot name="header" />

      <nav
        v-if="items.length"
        class="relative flex-1 min-h-0 flex flex-col"
        aria-label="Projects timeline"
      >
        <div ref="trackWrapRef" class="relative flex">
          <!-- Align bar to the center of the dot column: right padding (pr-6) + half dot-lane width (1.25rem / 2).
               Use translate-x-1/2 so the bar is centered on that point (right positions the bar's right edge). -->
          <span
            class="pointer-events-none absolute right-8.5 top-2 bottom-2 w-1 translate-x-1/2 bg-slate-700 rounded-full"
            aria-hidden="true"
          />
          <span
            ref="progressRef"
            class="pointer-events-none absolute right-8.5 top-2 bottom-2 w-1 translate-x-1/2 bg-sky-300 origin-top rounded-full"
            aria-hidden="true"
            style="transform: scaleY(0)"
          />

          <ol class="flex flex-1 flex-col pr-6">
            <li
              v-for="(item, itemIdx) in items"
              :key="item.key"
              class="relative ml-auto flex w-full shrink-0 flex-col items-end"
              :style="{ height: segmentHeight(item) + 'px' }"
            >
              <a
                :href="item.href"
                class="kbd-focus group grid grid-cols-[1fr_1.25rem] items-center text-sm text-slate-400 hover:text-slate-200 focus-visible:text-slate-200 transition-standard"
                :class="isActive(item) ? 'text-slate-200' : ''"
                @click.prevent="scrollToItem(item)"
              >
                <span class="tracking-widest text-right pr-4">
                  <span
                    class="rail-label relative inline-block tabular-nums"
                    :class="isLabelActive(item) ? 'rail-label-active text-sky-200' : ''"
                    >{{ item.label }}</span
                  >
                </span>

                <!-- Track column: dot is centered over the global line -->
                <span class="relative h-full flex items-center justify-center" aria-hidden="true">
                  <span
                    :ref="(el) => setBubbleEl(item.key, el)"
                    class="rail-dot relative z-10 inline-flex h-4 w-4 rounded-full border bg-base-background"
                    :class="[dotClasses(item), pingKey === item.key ? 'rail-dot-ping' : '']"
                  />
                </span>
              </a>

              <!-- One notch per project in this year, spaced along the rail below the year dot. -->
              <span
                class="pointer-events-none absolute right-0 top-7 flex w-5 flex-col items-center gap-3.5"
                aria-hidden="true"
              >
                <span
                  v-for="k in notchCount(item)"
                  :key="k"
                  class="rail-notch h-0.5 w-2.5 rounded-full"
                  :class="notchPassed(itemIdx, k) ? 'bg-sky-300' : 'bg-slate-500'"
                />
              </span>
            </li>
          </ol>
        </div>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";

const route = useRoute();

const props = defineProps({
  years: { type: Array, default: () => [] },

  /**
   * Collapse years older than this cutoff into a single 'Earlier' item.
   */
  collapseBeforeYear: { type: Number, default: 2018 },
  collapsedLabel: { type: String, default: "Earlier" },

  /**
   * Sticky top offset (px) to account for the rail sticky header when scrolling to a year.
   */
  scrollOffsetPx: { type: Number, default: 112 },

  /**
   * CSS selector for the scroll container. If null, window scrolling is used.
   */
  scroller: { type: String, default: null },
  yearSectionSelector: { type: String, default: "[data-project-year-section]" },

  /**
   * Projects per year ({ 2025: 3, ... }). Each year's stretch of the rail is as long as its
   * share of work, with one notch per project.
   */
  counts: { type: Object, default: () => ({}) },
});

const activeYear = ref(null);
const activeIndex = ref(0);
const progressRef = ref(null);
const trackWrapRef = ref(null);

let resizeObs;
let onWindowLoad;

// Remove ScrollTrigger-driven plumbing (keep rAF scroll handler only)
let directScrollTarget = null;
let onDirectScroll = null;
let rafPending = false;

const normalizedYears = computed(() =>
  (Array.isArray(props.years) ? props.years : [])
    .map((y) => Number(y))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => b - a),
);

const earliestYear = computed(() => {
  const ys = normalizedYears.value;
  return ys.length ? ys[ys.length - 1] : null;
});

const items = computed(() => {
  const ys = normalizedYears.value;
  if (!ys.length) return [];

  const cutoff = Number(props.collapseBeforeYear);
  const useCollapse = Number.isFinite(cutoff);

  const visibleYears = useCollapse ? ys.filter((y) => y > cutoff) : ys;
  const collapsedYears = useCollapse ? ys.filter((y) => y <= cutoff) : [];

  const list = visibleYears.map((y) => ({
    key: String(y),
    type: "year",
    year: y,
    label: String(y),
    href: `#year-${y}`,
    count: Math.max(1, Number(props.counts?.[y]) || 1),
  }));

  if (useCollapse && collapsedYears.length) {
    const target = earliestYear.value ?? collapsedYears[collapsedYears.length - 1];
    list.push({
      key: "earlier",
      type: "earlier",
      year: target,
      label: props.collapsedLabel,
      href: target ? `#year-${target}` : "#",
      collapsedYears,
      count: Math.max(
        1,
        collapsedYears.reduce((n, y) => n + (Number(props.counts?.[y]) || 0), 0),
      ),
    });
  }

  return list;
});

function ensureGsap() {
  try {
    gsap.registerPlugin(ScrollToPlugin);
  } catch {
    // no-op
  }
}

function getScrollerEl() {
  if (props.scroller) return document.querySelector(props.scroller);
  return null;
}

function findNearestScrollParent(el) {
  if (!el) return null;
  let cur = el.parentElement;
  while (cur && cur !== document.body) {
    const style = window.getComputedStyle(cur);
    const overflowY = style.overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

function getEffectiveScrollerEl() {
  const explicit = getScrollerEl();
  if (explicit) return explicit;

  // Auto-detect: if the page uses an internal scroller, bind to it.
  const firstAnchor = document.querySelector(props.yearSectionSelector);
  return firstAnchor ? findNearestScrollParent(firstAnchor) : null;
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function getScrollMax(scrollerEl) {
  if (!scrollerEl) {
    const doc = document.documentElement;
    return Math.max(0, (doc.scrollHeight || 0) - (window.innerHeight || 0));
  }
  return Math.max(0, (scrollerEl.scrollHeight || 0) - (scrollerEl.clientHeight || 0));
}

function isNearBottom(scrollerEl, thresholdPx = 4) {
  const max = getScrollMax(scrollerEl);
  const top = getScrollTop(scrollerEl);
  return max > 0 && top >= max - thresholdPx;
}

function getEffectiveScrollerElForScrollTo() {
  // Prefer explicit scroller selector if provided, otherwise use auto-detected effective scroller.
  return getEffectiveScrollerEl();
}

// After a click, only the clicked year's label is underlined while the page glides there
// (the dots still light up one by one as the line passes them).
const navTargetKey = ref(null);
function releaseNavTarget() {
  navTargetKey.value = null;
  window.removeEventListener("wheel", releaseNavTarget);
  window.removeEventListener("touchmove", releaseNavTarget);
}

function isLabelActive(item) {
  return navTargetKey.value !== null
    ? navTargetKey.value === item.key
    : isActive(item);
}

function scrollToItem(item) {
  const year = item?.year;
  if (!year) return;
  pingDot(item.key);
  navTargetKey.value = item.key;
  window.addEventListener("wheel", releaseNavTarget, { passive: true });
  window.addEventListener("touchmove", releaseNavTarget, { passive: true });

  const target = document.getElementById(`year-${year}`);
  if (!target) return;

  const scrollerEl = getEffectiveScrollerElForScrollTo();

  if (scrollerEl) {
    gsap.to(scrollerEl, {
      duration: 0.75,
      ease: "power2.out",
      scrollTo: { y: target, offsetY: Number(props.scrollOffsetPx) },
      overwrite: "auto",
      onComplete: releaseNavTarget,
      onInterrupt: releaseNavTarget,
    });
    return;
  }

  gsap.to(window, {
    duration: 0.75,
    ease: "power2.out",
    scrollTo: { y: target, offsetY: Number(props.scrollOffsetPx) },
    overwrite: "auto",
    onComplete: releaseNavTarget,
    onInterrupt: releaseNavTarget,
  });
}

const bubbleEls = new Map();

function setBubbleEl(key, el) {
  if (!key) return;
  if (!el) {
    bubbleEls.delete(key);
    return;
  }
  bubbleEls.set(key, el);
}

const progress01 = ref(0);
// Dot positions along the track (0..1), refreshed on every update; drives notch fill.
const dotTs = ref([]);

function computeBubbleThresholds() {
  const wrap = trackWrapRef.value;
  if (!wrap || !items.value.length) return null;

  // Track spans top-2 to bottom-2 in the wrap.
  const wrapRect = wrap.getBoundingClientRect();
  const trackTop = wrapRect.top + 8; // top-2
  const trackBottom = wrapRect.bottom - 8; // bottom-2
  const trackLen = Math.max(1, trackBottom - trackTop);

  const thresholds = items.value
    .map((it) => {
      const el = bubbleEls.get(it.key);
      if (!el) return { key: it.key, t: 1 };
      const r = el.getBoundingClientRect();
      const centerY = r.top + r.height / 2;
      const t = (centerY - trackTop) / trackLen;
      return { key: it.key, t: clamp01(t) };
    })
    .sort((a, b) => a.t - b.t);

  return { thresholds, trackTop, trackBottom };
}

// Each project adds one notch (16px pitch) below its year dot.
const NOTCH_PITCH = 16;
// The rail ends on the "Earlier" dot, so it carries no notches.
const notchCount = (item) => (item.type === "earlier" ? 0 : item.count);
const segmentHeight = (item) =>
  item.type === "earlier" ? 18 : 24 + notchCount(item) * NOTCH_PITCH;

// A notch is filled once the progress line has passed it. Notches sit evenly between this
// item's dot and the next dot (or the end of the rail).
function notchPassed(itemIdx, k) {
  const list = items.value;
  const start = dotTs.value[itemIdx];
  if (start === undefined) return false;
  const end = itemIdx + 1 < list.length ? (dotTs.value[itemIdx + 1] ?? 1) : 1;
  const frac = (28 + (k - 1) * NOTCH_PITCH + 1 - 10) / segmentHeight(list[itemIdx]);
  return progress01.value + 1e-6 >= start + (end - start) * frac;
}

function isActive(item) {
  if (!item) return false;
  const idx = items.value.findIndex((it) => it.key === item.key);
  if (idx === -1) return false;
  return idx === activeIndex.value;
}

function isPassed(item) {
  if (!item) return false;
  const idx = items.value.findIndex((it) => it.key === item.key);
  if (idx === -1) return false;
  return idx <= activeIndex.value;
}

// Passed dots fill in; the active one also grows a little and gets a soft halo.
function dotClasses(item) {
  if (isActive(item)) return "border-sky-300 bg-sky-300 scale-125 rail-dot-active";
  if (isPassed(item)) return "border-sky-300 bg-sky-300";
  return "border-slate-700 bg-slate-700";
}

// Short pulse on the dot that was clicked while the page glides to its year.
const pingKey = ref(null);
let pingTimer = 0;
async function pingDot(key) {
  clearTimeout(pingTimer);
  releaseNavTarget();
  pingKey.value = null;
  await nextTick();
  pingKey.value = key;
  pingTimer = setTimeout(() => {
    pingKey.value = null;
  }, 700);
}

function cleanup() {
  try {
    if (directScrollTarget && onDirectScroll) {
      directScrollTarget.removeEventListener("scroll", onDirectScroll);
    }
  } catch {
    // no-op
  }
  directScrollTarget = null;
  onDirectScroll = null;
  rafPending = false;

  try {
    resizeObs?.disconnect?.();
  } catch {
    // no-op
  }
  resizeObs = null;

  try {
    if (onWindowLoad) window.removeEventListener("load", onWindowLoad);
  } catch {
    // no-op
  }
  onWindowLoad = null;
}

// New helpers: compute geometry using getBoundingClientRect (robust to layout shifts)
function getScrollTop(scrollerEl) {
  if (!scrollerEl) return window.scrollY || window.pageYOffset || 0;
  return scrollerEl.scrollTop || 0;
}

function getViewportHeight(scrollerEl) {
  if (!scrollerEl) return window.innerHeight || 0;
  return scrollerEl.clientHeight || 0;
}

function getElementTopInScroller(el, scrollerEl) {
  const elRect = el.getBoundingClientRect();
  if (!scrollerEl) {
    return elRect.top + (window.scrollY || window.pageYOffset || 0);
  }
  const scrollerRect = scrollerEl.getBoundingClientRect();
  return elRect.top - scrollerRect.top + (scrollerEl.scrollTop || 0);
}

onMounted(async () => {
  if (typeof window === "undefined") return;
  ensureGsap();

  await nextTick();

  let yearMarks = [];
  let scrollerEl = null;

  const rescan = () => {
    scrollerEl = getEffectiveScrollerEl();
    const anchors = Array.from(document.querySelectorAll(props.yearSectionSelector));
    yearMarks = anchors
      .map((el) => ({ el, year: Number(el.getAttribute("data-year")) || null }))
      .filter((x) => x.year);
  };

  const computeSectionTops = () =>
    yearMarks.map((m) => ({
      year: m.year,
      top: getElementTopInScroller(m.el, scrollerEl),
    }));

  const updateState = () => {
    if (!yearMarks.length) return;

    const offset = Number(props.scrollOffsetPx) || 0;
    const tops = computeSectionTops();
    if (!tops.length) return;

    const scrollTop = getScrollTop(scrollerEl);
    const vh = getViewportHeight(scrollerEl);
    const viewLine = scrollTop + offset + vh * 0.2;

    let activeIdx = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i].top <= viewLine) activeIdx = i;
      else break;
    }

    const currentYear = tops[activeIdx]?.year ?? tops[0]?.year ?? null;
    activeYear.value = currentYear;

    const list = items.value;
    const lastIdx = list.length - 1;
    const nearBottom = isNearBottom(scrollerEl);

    // Where each rail item's section starts, in scroll coordinates (same targets the
    // click-to-jump uses), and where each dot sits along the track (0..1).
    const itemTops = list.map((it) => {
      const el = document.getElementById(`year-${it.year}`);
      return el ? getElementTopInScroller(el, scrollerEl) : Infinity;
    });
    const thr = computeBubbleThresholds()?.thresholds;
    const dotT = thr
      ? list.map((it) => thr.find((x) => x.key === it.key)?.t ?? 1)
      : null;

    if (dotT) dotTs.value = dotT;

    let idx = 0;
    for (let i = 0; i < itemTops.length; i++) {
      if (itemTops[i] <= viewLine) idx = i;
    }
    if (nearBottom) idx = lastIdx;

    // Progress runs from dot to dot as sections pass the view line, so the fill reaches
    // each dot exactly when its year becomes active (raw scroll fraction drifts from that).
    let p;
    if (nearBottom) {
      p = 1;
    } else if (dotT) {
      if (idx >= lastIdx) {
        p = dotT[lastIdx];
      } else {
        const span = itemTops[idx + 1] - itemTops[idx];
        const f = span > 0 ? clamp01((viewLine - itemTops[idx]) / span) : 0;
        const from = viewLine < itemTops[0] ? 0 : dotT[idx];
        p = from + (dotT[idx + 1] - from) * f;
      }
    } else {
      const max = getScrollMax(scrollerEl);
      p = max > 0 ? clamp01(scrollTop / max) : 0;
    }
    progress01.value = clamp01(p);

    // Dots light up as the progress line reaches them, including during click-to-jump glides.
    activeIndex.value = Math.max(0, Math.min(lastIdx, idx));

    if (progressRef.value) {
      gsap.to(progressRef.value, {
        scaleY: progress01.value,
        duration: 0.12,
        ease: "none",
        overwrite: true,
      });
    }
  };

  const scheduleUpdate = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      updateState();
    });
  };

  const bindScroll = () => {
    try {
      if (directScrollTarget && onDirectScroll) {
        directScrollTarget.removeEventListener("scroll", onDirectScroll);
      }
    } catch {
      // no-op
    }

    directScrollTarget = scrollerEl || window;
    onDirectScroll = scheduleUpdate;
    directScrollTarget.addEventListener("scroll", onDirectScroll, { passive: true });
  };

  // Robust init: wait for years + anchors to exist (direct load can mount before data renders anchors).
  const tryInit = async (attempt = 0) => {
    await nextTick();
    rescan();
    if (!yearMarks.length) {
      if (attempt < 20) {
        setTimeout(() => {
          tryInit(attempt + 1);
        }, 50);
      }
      return;
    }

    bindScroll();
    scheduleUpdate();
  };

  tryInit();

  if (typeof ResizeObserver !== "undefined") {
    const target = scrollerEl || document.documentElement;
    resizeObs = new ResizeObserver(() => {
      scheduleUpdate();
    });
    resizeObs.observe(target);
  }

  onWindowLoad = () => scheduleUpdate();
  window.addEventListener("load", onWindowLoad, { once: true });

  // Re-init when years change (data arrives) or when route changes (direct load vs SPA navigation differences).
  watch(
    () => props.years,
    () => {
      tryInit();
    },
    { deep: true },
  );

  watch(
    () => route.fullPath,
    () => {
      tryInit();
    },
  );
});

onBeforeUnmount(() => {
  clearTimeout(pingTimer);
  cleanup();
});
</script>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .rail-dot {
    transition:
      transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1),
      background-color 280ms ease-out,
      border-color 280ms ease-out,
      box-shadow 360ms ease-out;
  }

  .rail-dot-ping::after {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: 9999px;
    border: 2px solid rgb(125 211 252);
    animation: rail-ping 650ms ease-out forwards;
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rail-dot {
    transition: none;
  }
}

.rail-label::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: -4px;
  left: 0;
  height: 2px;
  border-radius: 9999px;
  background-color: rgb(125 211 252);
  transform: scaleX(0);
  transform-origin: right center;
}

.rail-label-active::after {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: no-preference) {
  .rail-label::after {
    transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.rail-notch {
  transition: background-color 250ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .rail-notch {
    transition: none;
  }
}

.rail-dot-active {
  box-shadow: 0 0 0 4px rgb(125 211 252 / 0.2);
}

@keyframes rail-ping {
  from {
    opacity: 0.9;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(2.6);
  }
}
</style>

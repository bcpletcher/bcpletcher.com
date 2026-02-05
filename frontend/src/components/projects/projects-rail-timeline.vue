<template>
  <div class="hidden lg:block h-full">
    <div class="flex h-full min-h-[calc(100vh-12rem)] flex-col gap-6">
      <slot name="header" />

      <nav
        v-if="items.length"
        class="relative flex-1 min-h-0 flex flex-col"
        aria-label="Projects timeline"
      >
        <div ref="trackWrapRef" class="relative flex flex-1 min-h-0">
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

          <ol class="flex flex-1 min-h-0 flex-col justify-between pr-6">
            <li v-for="item in items" :key="item.key" class="relative ml-auto">
              <a
                :href="item.href"
                class="kbd-focus group grid grid-cols-[1fr_1.25rem] items-center text-sm text-slate-400 hover:text-slate-200 focus-visible:text-slate-200 transition-standard"
                :class="isActive(item) ? 'text-slate-200' : ''"
                @click.prevent="scrollToItem(item)"
              >
                <span class="tracking-widest text-right pr-4">
                  {{ item.label }}
                </span>

                <!-- Track column: dot is centered over the global line -->
                <span class="relative h-full flex items-center justify-center" aria-hidden="true">
                  <span
                    :ref="(el) => setBubbleEl(item.key, el)"
                    class="relative z-10 inline-flex h-4 w-4 rounded-full border bg-base-background transition-standard"
                    :class="dotClasses(item)"
                  />
                </span>
              </a>
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

function scrollToItem(item) {
  const year = item?.year;
  if (!year) return;

  const target = document.getElementById(`year-${year}`);
  if (!target) return;

  const scrollerEl = getEffectiveScrollerElForScrollTo();

  if (scrollerEl) {
    gsap.to(scrollerEl, {
      duration: 0.75,
      ease: "power2.out",
      scrollTo: { y: target, offsetY: Number(props.scrollOffsetPx) },
      overwrite: "auto",
    });
    return;
  }

  gsap.to(window, {
    duration: 0.75,
    ease: "power2.out",
    scrollTo: { y: target, offsetY: Number(props.scrollOffsetPx) },
    overwrite: "auto",
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

function getPassedIndexByIntersection() {
  const meta = computeBubbleThresholds();
  if (!meta) return 0;

  const p = clamp01(progress01.value);
  let idx = 0;
  for (let i = 0; i < meta.thresholds.length; i++) {
    if (p + 1e-6 >= meta.thresholds[i].t) idx = i;
  }
  return idx;
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

function dotClasses(item) {
  if (isActive(item) || isPassed(item)) return "border-sky-300 bg-sky-300";
  return "border-slate-700 bg-slate-700";
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

function getRenderedIndexForActiveYear(year) {
  if (!year || !items.value.length) return 0;

  // If the active year is part of the collapsed range, map it to the 'Earlier' item.
  const cutoff = Number(props.collapseBeforeYear);
  if (Number.isFinite(cutoff) && year <= cutoff) {
    const idx = items.value.findIndex((it) => it.type === "earlier");
    return idx === -1 ? items.value.length - 1 : idx;
  }

  const idx = items.value.findIndex((it) => it.type === "year" && it.year === year);
  return idx === -1 ? 0 : idx;
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

    // Clamp to last item when at the very bottom so the final bubble always fills.
    const renderedIdx = isNearBottom(scrollerEl)
      ? items.value.length - 1
      : getRenderedIndexForActiveYear(currentYear);

    activeIndex.value = Math.max(0, Math.min(items.value.length - 1, renderedIdx));

    // Progress: based on true scroll range so it reaches 100% at the bottom.
    const max = getScrollMax(scrollerEl);
    const p = max > 0 ? clamp01(scrollTop / max) : 0;
    progress01.value = p;

    // Active bubble is the last one whose center has been intersected by the fill.
    activeIndex.value = Math.max(0, Math.min(items.value.length - 1, getPassedIndexByIntersection()));

    if (progressRef.value) {
      gsap.to(progressRef.value, {
        scaleY: p,
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
  cleanup();
});
</script>

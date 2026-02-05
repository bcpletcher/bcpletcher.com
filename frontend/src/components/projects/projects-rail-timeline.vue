<template>
  <div class="hidden lg:block h-full">
    <div class="flex h-full min-h-[calc(100vh-12rem)] flex-col gap-6">
      <slot name="header" />

      <nav
        v-if="items.length"
        class="relative flex-1 min-h-0 flex flex-col"
        aria-label="Projects timeline"
      >
        <div class="relative flex flex-1 min-h-0">
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
            <li v-for="item in items" :key="item.key" class="relative">
              <a
                :href="item.href"
                class="group grid grid-cols-[1fr_1.25rem] items-center text-sm text-slate-400 hover:text-slate-200 focus-visible:text-slate-200 transition-standard"
                :class="isActive(item) ? 'text-slate-200' : ''"
                @click.prevent="scrollToItem(item)"
              >
                <span class="tracking-widest text-right pr-4">
                  {{ item.label }}
                </span>

                <!-- Track column: dot is centered over the global line -->
                <span class="relative h-full flex items-center justify-center" aria-hidden="true">
                  <span
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
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollToPlugin from "gsap/ScrollToPlugin";

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

let masterTrigger = null;
let directScrollTarget = null;
let onDirectScroll = null;

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
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  } catch {
    // no-op
  }
}

function getScrollerEl() {
  if (!props.scroller) return null;
  return document.querySelector(props.scroller);
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function scrollToItem(item) {
  const year = item?.year;
  if (!year) return;

  const target = document.getElementById(`year-${year}`);
  if (!target) return;

  const scrollerEl = getScrollerEl();

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

function isActive(item) {
  if (!item) return false;
  if (item.type === "year") return activeYear.value === item.year;

  const cutoff = Number(props.collapseBeforeYear);
  if (!Number.isFinite(cutoff)) return false;
  return typeof activeYear.value === "number" && activeYear.value <= cutoff;
}

function isPassed(item) {
  if (!item) return false;

  if (item.type === "year") {
    const idx = normalizedYears.value.indexOf(item.year);
    return idx !== -1 && idx <= activeIndex.value;
  }

  const cutoff = Number(props.collapseBeforeYear);
  if (!Number.isFinite(cutoff)) return false;
  return typeof activeYear.value === "number" && activeYear.value <= cutoff;
}

function dotClasses(item) {
  if (isActive(item) || isPassed(item)) return "border-sky-300 bg-sky-300";
  return "border-slate-700 bg-slate-700";
}

function cleanup() {
  try {
    masterTrigger?.kill?.();
  } catch {
    // no-op
  }
  masterTrigger = null;

  try {
    if (directScrollTarget && onDirectScroll) {
      directScrollTarget.removeEventListener("scroll", onDirectScroll);
    }
  } catch {
    // no-op
  }
  directScrollTarget = null;
  onDirectScroll = null;
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

onMounted(() => {
  if (typeof window === "undefined") return;
  ensureGsap();

  const scrollerEl = getScrollerEl();
  const sections = Array.from(
    document.querySelectorAll(props.yearSectionSelector)
  );
  if (!sections.length) return;

  // Build ordered year marks based on actual DOM order on the page (top -> bottom)
  const yearMarks = sections
    .map((el) => ({ el, year: Number(el.getAttribute("data-year")) || null }))
    .filter((x) => x.year);

  const first = yearMarks[0].el;
  const last = yearMarks[yearMarks.length - 1].el;

  // Precompute section tops in the scroller's coordinate space.
  // (These change on resize/refresh, so we recompute inside updateState.)
  const computeSectionTops = () =>
    yearMarks.map((m) => ({
      year: m.year,
      top: getElementTopInScroller(m.el, scrollerEl),
    }));

  const updateState = () => {
    const offset = Number(props.scrollOffsetPx) || 0;
    const tops = computeSectionTops();

    const scrollTop = getScrollTop(scrollerEl);
    const vh = getViewportHeight(scrollerEl);

    // A bit below sticky header
    const viewLine = scrollTop + offset + vh * 0.2;

    // Determine active mark: last one whose top is above viewLine.
    let activeIdx = 0;
    for (let i = 0; i < tops.length; i++) {
      if (tops[i].top <= viewLine) activeIdx = i;
      else break;
    }

    const currentYear =
      tops[activeIdx]?.year ?? tops[0]?.year ?? yearMarks[0]?.year ?? null;

    activeYear.value = currentYear;

    const renderedIdx = getRenderedIndexForActiveYear(currentYear);
    activeIndex.value = renderedIdx;

    const denom = Math.max(1, items.value.length - 1);
    const p = clamp01(renderedIdx / denom);

    if (progressRef.value) {
      gsap.to(progressRef.value, {
        scaleY: p,
        duration: 0.12,
        ease: "none",
        overwrite: true,
      });
    }
  };

  // One trigger to keep updates in sync with ScrollTrigger's refresh lifecycle.
  masterTrigger = ScrollTrigger.create({
    trigger: first,
    scroller: scrollerEl || undefined,
    start: "top top",
    endTrigger: last,
    end: "bottom bottom",
    onUpdate: updateState,
    onRefresh: updateState,
  });

  // Also listen to scroll directly in case the scroller isn't window and ScrollTrigger isn't
  // receiving updates (e.g., due to dynamically created scroll containers).
  directScrollTarget = scrollerEl || window;
  onDirectScroll = () => updateState();
  directScrollTarget.addEventListener("scroll", onDirectScroll, {
    passive: true,
  });

  // Initial state
  updateState();

  setTimeout(() => {
    try {
      ScrollTrigger.refresh();
    } catch {
      // no-op
    }
  }, 0);

  // Cleanup handled by cleanup()
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

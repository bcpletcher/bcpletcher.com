<template>
  <aside ref="railCol" class="relative">
    <!-- Desktop fixed rail content (pinned to viewport, aligned to column) -->
    <div
      class="hidden lg:block fixed top-0 h-screen px-0"
      :style="{
        left: railRect.left + 'px',
        width: railRect.width + 'px',
      }"
    >
      <div class="flex h-screen flex-col py-24">
        <div class="flex flex-col">
          <h1
            class="text-3xl font-bold tracking-tight text-slate-200 sm:text-5xl"
          >
            {{ name }}
          </h1>
          <h2 class="max-w-sm mt-4 text-slate-100 text-xl">{{ title }}</h2>
          <p class="max-w-sm mt-6 leading-normal font-normal">
            {{ description }}
          </p>
        </div>

        <Navigation
          variant="desktop"
          :nav-items="navItems"
          :active-section-id="activeSectionId"
          @nav="onNav"
        />

        <SocialLinks />
      </div>
    </div>

    <!-- Space reservation so main doesn't overlap fixed rail -->
    <div class="hidden lg:block py-24">
      <div class="h-screen" />
    </div>

    <!-- Mobile rail content (normal flow) -->
    <div class="mb-16 md:mb-24 lg:mb-0 lg:hidden">
      <h1 class="text-3xl font-bold tracking-tight text-slate-200 sm:text-5xl">
        {{ name }}
      </h1>
      <h2 class="max-w-sm mt-3 text-slate-100 text-xl">{{ title }}</h2>
      <p class="max-w-sm mt-4 leading-normal font-normal">
        {{ description }}
      </p>
      <SocialLinks />
    </div>
  </aside>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useScrollSpy } from "@/composables/useScrollSpy.js";

import Navigation from "@/components/home/rail/navigation.vue";
import SocialLinks from "@/components/home/rail/social-links.vue";

const name = "Benjamin Pletcher";
const title = "Senior Frontend Engineer";
const description =
  "I build accessible, pixel-perfect digital experiences, from interface to production.";

const props = defineProps({
  navItems: { type: Array, required: true },
});

const router = useRouter();
const route = useRoute();

// Scroll-spy + smooth scrolling for this page.
const { activeSectionId, scrollTo } = useScrollSpy({
  sections: props.navItems.map((n) => n.id),
  root: null,
});

// Track programmatic scroll so we can avoid clearing hash immediately.
const lastProgrammaticScrollAt = ref(0);
const markProgrammaticScroll = () => {
  lastProgrammaticScrollAt.value = Date.now();
};
const isProgrammaticScroll = () =>
  Date.now() - lastProgrammaticScrollAt.value < 900;

const suppressHashClearingUntil = ref(0);
const suppressHashClearingFor = (ms = 900) => {
  suppressHashClearingUntil.value = Date.now() + ms;
};

const normalizeHash = (hash) => {
  const raw = (hash || "").replace(/^#/, "");
  const ids = new Set(props.navItems.map((n) => n.id));
  return ids.has(raw) ? raw : null;
};

const setHash = async (id) => {
  return router.push({ hash: `#${id}` }).catch(() => {});
};

const clearHash = () => {
  if (!route.hash) return;
  router.replace({ hash: "" }).catch(() => {});
};

const onNav = async (id) => {
  // Clicking nav is the only time we keep the hash in the URL.
  suppressHashClearingFor(1200);
  markProgrammaticScroll();

  await setHash(id);
  scrollTo(id);
};

// If user scrolls manually, remove any hash (we don't want hashes during scroll).
const onUserScroll = () => {
  if (Date.now() < suppressHashClearingUntil.value) return;
  if (isProgrammaticScroll()) return;
  clearHash();
};

// If the URL hash changes (initial load, back/forward, pasted URL),
// scroll to the section and then remove the hash from the URL.
watch(
  () => route.hash,
  async (hash, prevHash) => {
    const id = normalizeHash(hash);
    if (!id) return;

    // If it didn't actually change, ignore.
    if (hash === prevHash) return;

    // IMPORTANT: if the hash was set by our own nav click, do NOT auto-clear it.
    if (isProgrammaticScroll()) return;

    suppressHashClearingFor(1200);
    markProgrammaticScroll();

    // Let layout settle before scrolling.
    await nextTick();
    scrollTo(id, { behavior: "auto" });

    // Remove the hash after we've jumped.
    clearHash();
  },
  { immediate: true }
);

// Rail positioning
const railCol = ref(null);
const railRect = ref({ left: 0, width: 0 });

let ro;
let rafId = 0;
const scheduleMeasure = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    measure();
  });
};

const measure = () => {
  const el = railCol.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  railRect.value = {
    left: rect.left,
    width: rect.width,
  };
};

onMounted(async () => {
  await nextTick();

  // Initial + post-layout settle
  measure();
  requestAnimationFrame(measure);

  window.addEventListener("resize", scheduleMeasure, { passive: true });
  window.addEventListener("scroll", scheduleMeasure, {
    passive: true,
    capture: true,
  });
  window.addEventListener("scroll", onUserScroll, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleMeasure, {
      passive: true,
    });
  }

  if (railCol.value && "ResizeObserver" in window) {
    ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(railCol.value);
  }

  // If user lands on /#experience etc., jump there.
  const initial = normalizeHash(route.hash);
  if (initial) {
    suppressHashClearingFor(900);
    scrollTo(initial, { behavior: "auto" });
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", scheduleMeasure);
  window.removeEventListener("scroll", scheduleMeasure, true);
  window.removeEventListener("scroll", onUserScroll);

  if (window.visualViewport) {
    window.visualViewport.removeEventListener("resize", scheduleMeasure);
  }

  if (ro) ro.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

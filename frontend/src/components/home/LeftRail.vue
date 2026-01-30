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

        <RailNav
          variant="desktop"
          :nav-items="navItems"
          :active-section-id="activeSectionId"
          @nav="onNav"
        />

        <div class="mt-auto flex flex-col-reverse gap-10">
          <SocialLinks />

          <a
            class="group/link my-auto inline-flex items-baseline leading-tight text-slate-400 hover:text-font-secondary focus-visible:text-font-secondary font-semibold text-sm tracking-[0.25em] uppercase"
            href="/resume"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Resume (opens in a new tab)"
          >
            <span>
              Resume
              <span class="inline-block">
                <i
                  class="fa-solid fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </span>
          </a>
        </div>
      </div>
    </div>

    <!-- Space reservation so main doesn't overlap fixed rail -->
    <div class="hidden lg:block py-24">
      <div class="h-screen" />
    </div>

    <!-- Mobile rail content (normal flow) -->
    <div class="lg:hidden py-16">
      <h1 class="text-4xl font-semibold tracking-tight">{{ name }}</h1>
      <h2 class="mt-4 text-lg text-font-primary/80">{{ title }}</h2>
      <p class="mt-6 text-sm leading-relaxed text-font-primary/65">
        {{ description }}
      </p>

      <RailNav
        variant="mobile"
        :nav-items="navItems"
        :active-section-id="activeSectionId"
        @nav="onNav"
      />
    </div>
  </aside>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useScrollSpy } from "@/composables/useScrollSpy.js";

import RailNav from "@/components/home/rail/RailNav.vue";
import SocialLinks from "@/components/home/rail/SocialLinks.vue";

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

const suppressSpyUntil = ref(0);
const suppressFor = (ms = 700) => {
  suppressSpyUntil.value = Date.now() + ms;
};

const normalizeHash = (hash) => {
  const raw = (hash || "").replace(/^#/, "");
  const ids = new Set(props.navItems.map((n) => n.id));
  return ids.has(raw) ? raw : props.navItems[0]?.id;
};

const syncHashToActive = (id) => {
  if (!id) return;
  const hash = `#${id}`;
  if (route.hash === hash) return;
  router.replace({ hash }).catch(() => {});
};

const onNav = (id) => {
  suppressFor();
  syncHashToActive(id);
  scrollTo(id);
};

// Keep the URL synced as the user scrolls.
watch(
  () => activeSectionId.value,
  (id) => {
    if (!id) return;
    if (Date.now() < suppressSpyUntil.value) return;
    syncHashToActive(id);
  }
);

// If the hash changes (back/forward), scroll to it.
watch(
  () => route.hash,
  (hash) => {
    const id = normalizeHash(hash);
    if (!id) return;
    if (id === activeSectionId.value) return;

    suppressFor();
    scrollTo(id);
  }
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
    suppressFor(900);
    scrollTo(initial, { behavior: "auto" });
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", scheduleMeasure);
  window.removeEventListener("scroll", scheduleMeasure, true);

  if (window.visualViewport) {
    window.visualViewport.removeEventListener("resize", scheduleMeasure);
  }

  if (ro) ro.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
});
</script>

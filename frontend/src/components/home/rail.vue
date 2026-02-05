<template>
  <aside class="relative">
    <div class="hidden lg:block">
      <div class="flex min-h-[calc(100vh-12rem)] flex-col">
        <div class="pt-0">
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
        </div>

        <Navigation
          variant="desktop"
          :nav-items="navItems"
          :active-section-id="activeSectionId"
          @nav="onNav"
        />

        <div class="mt-auto pb-0">
          <SocialLinks />
        </div>
      </div>
    </div>

    <!-- Mobile rail content (normal flow) -->
    <div class="pb-8 md:pb-16 lg:hidden">
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
const title = "Senior Software Engineer";
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
  suppressHashClearingFor(1200);
  markProgrammaticScroll();

  await setHash(id);
  scrollTo(id);
};

const onUserScroll = () => {
  if (Date.now() < suppressHashClearingUntil.value) return;
  if (isProgrammaticScroll()) return;
  clearHash();
};

watch(
  () => route.hash,
  async (hash, prevHash) => {
    const id = normalizeHash(hash);
    if (!id) return;
    if (hash === prevHash) return;
    if (isProgrammaticScroll()) return;

    suppressHashClearingFor(1200);
    markProgrammaticScroll();

    await nextTick();
    scrollTo(id, { behavior: "auto" });

    clearHash();
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("scroll", onUserScroll, { passive: true });

  const initial = normalizeHash(route.hash);
  if (initial) {
    suppressHashClearingFor(900);
    scrollTo(initial, { behavior: "auto" });
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", onUserScroll);
});
</script>

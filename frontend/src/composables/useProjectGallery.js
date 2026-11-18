import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { caseStudyPath, findProjectBySlug, hasPublishedCaseStudy } from "@/utils/caseStudyData.js";
import { useSettingsStore } from "@/stores/settings.js";
import { slugify } from "@/utils/slug.js";

const loadGalleryModal = () =>
  import("@/components/projects/projects-gallery-modal.vue");

// Lazy gallery modal: mount it with v-if="galleryMounted" so its code is only needed on open.
export const ProjectsGalleryModal = defineAsyncComponent(loadGalleryModal);

const HASH_PREFIX = "#project/";

// The card screenshot the gallery opened from (for the open/close motion).
function findOriginImage(title) {
  if (typeof document === "undefined") return null;
  const alt = `${title} screenshot`;
  return (
    [...document.querySelectorAll("img.img-fade")].find((img) => {
      if (img.alt !== alt) return false;
      const r = img.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    }) || null
  );
}

export function useProjectGallery({ preload = false, deepLink = false } = {}) {
  const settingsStore = useSettingsStore();

  const galleryMounted = ref(false);
  const isGalleryOpen = ref(false);
  const galleryTitle = ref("");
  const galleryImages = ref([]);
  const galleryIndex = ref(0);
  const galleryOriginRect = ref(null);
  const gallerySlug = ref("");
  // The slideshow timer is off when the viewer picked a specific image (payload.autoplay === false).
  const galleryAutoplay = ref(true);

  let originEl = null;
  const getOriginRect = () =>
    originEl?.isConnected ? originEl.getBoundingClientRect() : null;

  const galleryShareUrl = computed(() =>
    gallerySlug.value && typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${gallerySlug.value}`
      : "",
  );
  const galleryCaseStudyHref = computed(() =>
    hasPublishedCaseStudy(settingsStore.projects, gallerySlug.value)
      ? caseStudyPath(gallerySlug.value)
      : "",
  );

  if (preload) {
    // Fetch the gallery code after first paint (idle) so it never competes with the initial load.
    onMounted(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadGalleryModal, { timeout: 4000 });
      } else {
        setTimeout(loadGalleryModal, 2500);
      }
    });
  }

  function setHash(slug) {
    try {
      const hash = slug ? `${HASH_PREFIX}${slug}` : "";
      if (window.location.hash === hash) return;
      const url = new URL(window.location.href);
      url.hash = hash;
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // no-op
    }
  }

  function openGallery(payload) {
    if (!payload?.images?.length) return;
    const index = Number.isFinite(payload.index) ? payload.index : 0;

    galleryTitle.value = payload.title || "Project Gallery";
    galleryImages.value = payload.images;
    galleryIndex.value = index;
    gallerySlug.value = slugify(payload.title);
    galleryAutoplay.value = payload.autoplay !== false;

    // Only the first image has a matching card thumbnail to fly out of.
    originEl =
      index === 0 && !payload.noOrigin
        ? findOriginImage(galleryTitle.value)
        : null;
    galleryOriginRect.value = originEl
      ? originEl.getBoundingClientRect()
      : null;

    galleryMounted.value = true;
    setHash(gallerySlug.value);
    isGalleryOpen.value = true;
  }

  // Clear the URL on close only if it still refers to this gallery.
  watch(isGalleryOpen, (open) => {
    if (!open && window.location.hash === `${HASH_PREFIX}${gallerySlug.value}`) {
      setHash("");
    }
  });

  if (deepLink) {
    const route = useRoute();
    function syncGalleryToHash() {
      if (!settingsStore.projects || typeof window === "undefined") return;
      const hash = window.location.hash;
      const slug = hash.startsWith(HASH_PREFIX) ? hash.slice(HASH_PREFIX.length) : "";
      if (slug === gallerySlug.value && isGalleryOpen.value) return;

      const project = findProjectBySlug(settingsStore.projects, slug);
      const images = Array.isArray(project?.images) ? project.images.filter(Boolean) : [];
      if (!images.length) {
        isGalleryOpen.value = false;
        return;
      }
      openGallery({
        title: project.projectName || project.title,
        images,
        index: 0,
        noOrigin: true,
      });
    }

    // Handle both router navigation and hash links opened in the current page.
    watch(
      [() => settingsStore.projects, () => route.hash],
      syncGalleryToHash,
      { immediate: true },
    );
    onMounted(() => window.addEventListener("hashchange", syncGalleryToHash));
    onUnmounted(() => window.removeEventListener("hashchange", syncGalleryToHash));
  }

  return {
    galleryMounted,
    isGalleryOpen,
    galleryTitle,
    galleryImages,
    galleryIndex,
    galleryOriginRect,
    galleryAutoplay,
    getOriginRect,
    galleryShareUrl,
    galleryCaseStudyHref,
    openGallery,
  };
}

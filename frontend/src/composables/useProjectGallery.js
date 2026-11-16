import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";

import { caseStudyPath, hasCaseStudy } from "@/constants/caseStudies.js";
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
    hasCaseStudy(gallerySlug.value) ? caseStudyPath(gallerySlug.value) : "",
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
      const url = new URL(window.location.href);
      url.hash = slug ? `${HASH_PREFIX}${slug}` : "";
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
    isGalleryOpen.value = true;
  }

  // Deep link bookkeeping: the URL shows which project's lightbox is open.
  watch(isGalleryOpen, (open) => {
    if (open) {
      setHash(gallerySlug.value);
    } else if (window.location.hash.startsWith(HASH_PREFIX)) {
      setHash("");
    }
  });

  if (deepLink) {
    // `/#project/<slug>` opens that project's lightbox once projects have loaded.
    let handled = false;
    watch(
      () => settingsStore.projects,
      (all) => {
        if (handled || !all || typeof window === "undefined") return;
        handled = true;
        const hash = window.location.hash;
        if (!hash.startsWith(HASH_PREFIX)) return;
        const slug = hash.slice(HASH_PREFIX.length);
        const match = Object.values(all).find(
          (p) => !p?.hidden && slugify(p?.projectName || p?.title) === slug,
        );
        const images = Array.isArray(match?.images)
          ? match.images.filter(Boolean)
          : [];
        if (images.length) {
          openGallery({
            title: match.projectName || match.title,
            images,
            index: 0,
            noOrigin: true,
          });
        }
      },
      { immediate: true },
    );
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

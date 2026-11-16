import { defineAsyncComponent, onMounted, ref } from "vue";

const loadGalleryModal = () =>
  import("@/components/projects/projects-gallery-modal.vue");

// Lazy gallery modal: mount it with v-if="galleryMounted" so its code is only needed on open.
export const ProjectsGalleryModal = defineAsyncComponent(loadGalleryModal);

export function useProjectGallery({ preload = false } = {}) {
  const galleryMounted = ref(false);
  const isGalleryOpen = ref(false);
  const galleryTitle = ref("");
  const galleryImages = ref([]);
  const galleryIndex = ref(0);

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

  function openGallery(payload) {
    if (!payload?.images?.length) return;
    galleryTitle.value = payload.title || "Project Gallery";
    galleryImages.value = payload.images;
    galleryIndex.value = Number.isFinite(payload.index) ? payload.index : 0;
    galleryMounted.value = true;
    isGalleryOpen.value = true;
  }

  return {
    galleryMounted,
    isGalleryOpen,
    galleryTitle,
    galleryImages,
    galleryIndex,
    openGallery,
  };
}

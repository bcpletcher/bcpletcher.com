<template>
  <li class="overflow-visible mb-10">
    <article
      v-gsap-reveal="{ once: true, start: 'top 92%' }"
      class="relative grid overflow-visible pb-1 md:grid-cols-12 md:items-center md:gap-8"
    >
      <!-- Hidden stripe overlay (admin visual only) -->
      <div
        v-if="showAdminControls && isHidden"
        class="pointer-events-none absolute z-0 overflow-hidden rounded-2xl -top-2 -bottom-2 -left-2 -right-2 lg:-left-18 lg:-right-4 opacity-10"
        style="
          background-image: repeating-linear-gradient(
            135deg,
            rgba(250, 204, 21, 1) 0px,
            rgba(250, 204, 21, 1) 10px,
            rgba(15, 23, 42, 0) 10px,
            rgba(15, 23, 42, 0) 20px
          );
        "
        aria-hidden="true"
      />

      <AdminControls
        :show="showAdminControls"
        :project-id="projectId"
        :is-hidden="isHidden"
        :on-edit="onEdit"
      />

      <CardContent
        :project-name="projectName"
        :summary="summary"
        :date="date"
        :href="href"
        :technology="technology"
        :featured="featured"
        :meta="meta"
        :show-project-name="showProjectName"
        :show-date="showDate"
        :show-link="showLink"
        :show-summary="showSummary"
        :show-technology="showTechnology"
        :show-featured="showFeatured"
        :show-meta="showMeta"
        :is-hidden="isHidden"
        @open-gallery="(idx) => emitOpenGallery(idx)"
      />

      <CardImage
        :project-name="projectName"
        :images="images"
        :is-hidden="isHidden"
        @open-gallery="emitOpenGallery"
      />
    </article>
  </li>
</template>

<script setup>
import CardContent from "./card-content.vue";
import CardImage from "./card-image.vue";
import AdminControls from "./card-controls.vue";

const emit = defineEmits(["open-gallery"]);

const props = defineProps({
  projectId: { type: String, required: true },

  projectName: { type: String, required: true },
  summary: { type: String, default: "" },
  date: { type: String, default: null },

  images: { type: Array, required: true },

  href: { type: String, default: null },
  technology: { type: Array, default: () => [] },

  featured: { type: Boolean, default: false },
  meta: { type: [String, null], default: null },

  // Visibility controls
  showProjectName: { type: Boolean, default: true },
  showDate: { type: Boolean, default: true },
  showLink: { type: Boolean, default: true },
  showSummary: { type: Boolean, default: true },
  showTechnology: { type: Boolean, default: true },
  showFeatured: { type: Boolean, default: true },
  showMeta: { type: Boolean, default: true },

  // Admin-only controls
  showAdminControls: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },

  // Optional handler to open edit modal (keeps logic out of the card)
  onEdit: { type: Function, default: null },
});

function emitOpenGallery(index) {
  const images = Array.isArray(props.images) ? props.images : [];
  const list = images.filter(Boolean);
  if (!list?.length) return;

  emit("open-gallery", {
    title: props.projectName,
    images: list,
    index: Number.isFinite(index) ? index : 0,
  });
}
</script>

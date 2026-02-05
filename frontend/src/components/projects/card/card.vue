<template>
  <li class="overflow-visible mb-10">
    <article
      v-gsap-reveal="{ once: true, start: 'top 92%' }"
      class="relative grid overflow-visible pb-1  md:grid-cols-12 md:items-center md:gap-8"
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
        :title="title"
        :summary="summary"
        :year="year"
        :href="href"
        :technology="technology"
        :featured="featured"
        :show-title="showTitle"
        :show-year="showYear"
        :show-link="showLink"
        :show-link-arrow="showLinkArrow"
        :show-summary="showSummary"
        :show-technology="showTechnology"
        :show-featured="showFeatured"
        :is-hidden="isHidden"
        @open-gallery="(idx) => emitOpenGallery(idx)"
      />

      <CardImage
        :title="title"
        :hero="hero"
        :images="images"
        :is-hidden="isHidden"
        @open-gallery="(idx) => emitOpenGallery(idx)"
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

  title: { type: String, required: true },
  summary: { type: String, default: "" },
  year: { type: [Number, String], default: null },

  hero: { type: String, required: true },
  images: { type: Array, default: null },

  href: { type: String, default: null },
  technology: { type: Array, default: () => [] },

  featured: { type: Boolean, default: false },

  // Visibility controls
  showTitle: { type: Boolean, default: true },
  showYear: { type: Boolean, default: true },
  showLink: { type: Boolean, default: true },
  showLinkArrow: { type: Boolean, default: true },
  showSummary: { type: Boolean, default: true },
  showTechnology: { type: Boolean, default: true },
  showFeatured: { type: Boolean, default: true },

  // Admin-only controls
  showAdminControls: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },

  // Optional handler to open edit modal (keeps logic out of the card)
  onEdit: { type: Function, default: null },
});

function emitOpenGallery(index) {
  const imgs =
    Array.isArray(props.images) && props.images.length
      ? props.images
      : [props.hero];
  const list = imgs.filter(Boolean).slice(0, 3);
  if (!list?.length) return;

  emit("open-gallery", {
    title: props.title,
    images: list,
    index: Number.isFinite(index) ? index : 0,
  });
}
</script>

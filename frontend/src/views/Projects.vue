<template>
  <RailLayout :rail-width-rem="16">
    <template #rail>
      <ProjectsRailTimeline
        :years="years"
        :collapse-before-year="2019"
        collapsed-label="Earlier"
      >
        <template #header>
          <div ref="pageHeaderMeasureRef">
            <PageHeader
              title="All Projects"
              back-label="Benjamin Pletcher"
              :remove-top-padding="true"
            />
          </div>
        </template>
      </ProjectsRailTimeline>
    </template>

    <template #main>
      <div class="flex flex-col gap-6">
        <div class="py-6 lg:pb-16 lg:pt-0">
          <p
            :style="{
              height: headerContentHeightPx
                ? `${headerContentHeightPx}px`
                : undefined,
            }"
          >
            These projects showcase how I translate complex requirements into
            clear, usable, and resilient interfaces. The work spans multiple
            industries and stacks, but the throughline remains the same:
            intentional design, thoughtful engineering, and products built to
            last.
          </p>
        </div>

        <div>
          <div v-for="y in years" :key="y" class="mb-10">
            <!-- Year anchor/section for timeline tracking -->
            <div
              :id="`year-${y}`"
              data-project-year-section
              :data-year="y"
              class="scroll-mt-28"
            />

            <ul class="grid gap-4 list-none p-0 m-0">
              <ProjectsCard
                v-for="(project, idx) in projectsByYear[y]"
                :key="project.id || `${y}-${idx}`"
                :title="project.title"
                :year="project.year"
                :summary="project.description"
                :hero="project.hero"
                :images="project.images"
                :href="project.url"
                :technology="project.technology"
                :featured="project.featured"
                :show-year="false"
                :show-featured="false"
                @open-gallery="openGallery"
              />
            </ul>
          </div>
        </div>
      </div>

      <ProjectsGalleryModal
        v-model="isGalleryOpen"
        :title="galleryTitle"
        :images="galleryImages"
        :initial-index="galleryIndex"
        @close="onGalleryClose"
      />
    </template>
  </RailLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import RailLayout from "@/components/shared/rail-layout.vue";
import PageHeader from "@/components/shared/page-header.vue";
import ProjectsRailTimeline from "@/components/projects/projects-rail-timeline.vue";
import ProjectsCard from "@/components/projects/projects-card.vue";
import ProjectsGalleryModal from "@/components/projects/projects-gallery-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();

// Assumption: projects are currently sourced from the same dataset as Scrapbook.
// We keep this isolated in this view so the existing scrapbook page stays unchanged.
const projects = computed(() => {
  if (settingsStore.scrapbook === null) return [];

  return Object.values(settingsStore.scrapbook)
    .filter((item) => !item.deleted)
    .sort((a, b) => {
      const ay = typeof a.year === "number" ? a.year : Number.NEGATIVE_INFINITY;
      const by = typeof b.year === "number" ? b.year : Number.NEGATIVE_INFINITY;
      if (ay !== by) return by - ay; // newest first

      // Secondary sort: explicit order if present (ascending)
      const ao =
        typeof a.order === "number" ? a.order : Number.POSITIVE_INFINITY;
      const bo =
        typeof b.order === "number" ? b.order : Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;

      // Stable-ish fallback
      const at = (a.title || "").toString();
      const bt = (b.title || "").toString();
      return at.localeCompare(bt);
    })
    .map((item) => ({
      id: item.id,
      title: item.title || "Untitled",
      year: item.year ?? null,
      description: item.description || "",
      hero:
        item.hero || (Array.isArray(item.images) ? item.images?.[0] : "") || "",
      images: Array.isArray(item.images) ? item.images : null,
      url: item.url || null,
      technology: item.technology || [],
      featured: Boolean(item.featured),
    }))
    .filter((item) => item.hero);
});

const years = computed(() => {
  const ys = new Set();
  projects.value.forEach((p) => {
    if (p.year) ys.add(Number(p.year));
  });
  return Array.from(ys)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a);
});

const projectsByYear = computed(() => {
  const grouped = {};
  years.value.forEach((y) => {
    grouped[y] = [];
  });

  projects.value.forEach((p) => {
    const y = Number(p.year);
    if (!Number.isFinite(y)) return;
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(p);
  });

  return grouped;
});

const pageHeaderMeasureRef = ref(null);
const headerContentHeightPx = ref(0);
let headerRo;

function px(n) {
  return Number.isFinite(n) ? n : 0;
}

function measureHeaderContentHeight() {
  const wrapper = pageHeaderMeasureRef.value;
  if (!wrapper) return;

  const el = wrapper.firstElementChild;
  if (!el) return;

  const styles = window.getComputedStyle(el);
  const paddingTop = px(parseFloat(styles.paddingTop));
  const paddingBottom = px(parseFloat(styles.paddingBottom));

  // offsetHeight includes padding; subtract it to get content-box-ish height.
  headerContentHeightPx.value = Math.max(
    0,
    Math.round(el.offsetHeight - paddingTop - paddingBottom),
  );
}

onMounted(async () => {
  if (typeof window === "undefined") return;
  await nextTick();
  measureHeaderContentHeight();

  if (typeof ResizeObserver !== "undefined") {
    headerRo = new ResizeObserver(() => {
      measureHeaderContentHeight();
    });
    if (pageHeaderMeasureRef.value?.firstElementChild) {
      headerRo.observe(pageHeaderMeasureRef.value.firstElementChild);
    }
  }

  window.addEventListener("resize", measureHeaderContentHeight, {
    passive: true,
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", measureHeaderContentHeight);
  headerRo?.disconnect?.();
});

const isGalleryOpen = ref(false);
const galleryTitle = ref("");
const galleryImages = ref([]);
const galleryIndex = ref(0);

function openGallery(payload) {
  if (!payload?.images?.length) return;
  galleryTitle.value = payload.title || "Project Gallery";
  galleryImages.value = payload.images;
  galleryIndex.value = Number.isFinite(payload.index) ? payload.index : 0;
  isGalleryOpen.value = true;
}

function onGalleryClose() {
  // keep a stable hook if we want analytics or state cleanup later
}
</script>

<template>
  <RailLayout :rail-width-rem="16" :hide-rail-on-mobile="true">
    <template #rail>
      <ProjectsRailTimeline
        :years="years"
        :counts="yearCounts"
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
      <ProjectsMobileBar :years="years" />

      <div class="flex flex-col gap-6">
        <div class="block lg:hidden">
          <PageHeader
            title="All Projects"
            back-label="Benjamin Pletcher"
            :remove-top-padding="true"
          />
        </div>
        <div class="pb-6 lg:pb-16">
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

        <ProjectsLoadState variant="page" :count="4">
          <div class="flex flex-col gap-6">
            <div v-for="y in years" :key="y">
              <!-- Year anchor/section for timeline tracking -->
              <div
                :id="`year-${y}`"
                data-project-year-section
                :data-year="y"
                class="scroll-mt-28"
              />

              <!-- Semantic heading so cards (h3) don't skip levels -->
              <h2 class="sr-only">{{ y }}</h2>

              <ul class="grid gap-4 list-none p-0 m-0">
                <ProjectsCard
                  v-for="(project, idx) in projectsByYear[y]"
                  :key="project.id || `${y}-${idx}`"
                  :project-id="project.id"
                  :project-name="project.projectName"
                  :date="project.date"
                  :summary="project.description"
                  :images="project.images"
                  :href="project.url"
                  :technology="project.technology"
                  :featured="project.featured"
                  :meta="project.meta"
                  :show-date="false"
                  :show-featured="false"
                  :priority="project.id === projects[0]?.id"
                  :show-admin-controls="isAdmin"
                  :is-hidden="settingsStore.projects?.[project.id]?.hidden"
                  :on-edit="(id) => openEditById(id)"
                  :on-case-study="(id) => openCaseStudyById(id)"
                  @open-gallery="openGallery"
                />
              </ul>
            </div>
          </div>
        </ProjectsLoadState>
      </div>

      <ProjectsGalleryModal
        v-if="galleryMounted"
        v-model="isGalleryOpen"
        :title="galleryTitle"
        :images="galleryImages"
        :initial-index="galleryIndex"
        :origin-rect="galleryOriginRect"
        :get-origin-rect="getOriginRect"
        :share-url="galleryShareUrl"
        :case-study-href="galleryCaseStudyHref"
      />

      <!-- Admin upsert modal for editing an existing project (admin only) -->
      <AdminUpsertProject ref="adminUpsertRef" />

      <!-- Case study editor (admin only) -->
      <AdminCaseStudyEditor ref="caseStudyEditorRef" />
    </template>
  </RailLayout>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import RailLayout from "@/components/shared/rail-layout.vue";
import PageHeader from "@/components/shared/page-header.vue";
import ProjectsRailTimeline from "@/components/projects/projects-rail-timeline.vue";
import ProjectsCard from "@/components/projects/card/card.vue";
import {
  ProjectsGalleryModal,
  useProjectGallery,
} from "@/composables/useProjectGallery.js";
import ProjectsLoadState from "@/components/shared/projects-load-state.vue";
import AdminUpsertProject from "@/components/admin/admin-upsert-project.vue";
import ProjectsMobileBar from "@/components/projects/projects-mobile-bar.vue";
import AdminCaseStudyEditor from "@/components/admin/admin-case-study-editor.vue";
import { useSettingsStore } from "@/stores/settings.js";
import {
  getYearFromProjectDate,
  normalizeProjectDate,
} from "@/utils/projectDate.js";

const settingsStore = useSettingsStore();

const adminUpsertRef = ref(null);
const caseStudyEditorRef = ref(null);

const isAdmin = computed(() => settingsStore.isAdminView);

function openCaseStudyById(projectId) {
  if (!isAdmin.value) return;
  caseStudyEditorRef.value?.open?.(projectId);
}

function openEditById(projectId) {
  if (!isAdmin.value) return;
  const entry = settingsStore.projects?.[projectId];
  if (!entry) return;

  adminUpsertRef.value?.showModal?.({
    name: projectId,
    ...entry,
  });
}

const projects = computed(() => {
  const all = settingsStore.projects;
  if (!all) return [];

  return Object.entries(all)
    .map(([id, item]) => ({
      entryId: id,
      ...(item || {}),
    }))
    .filter((item) => {
      if (isAdmin.value) return true;
      return !item?.hidden;
    })
    .map((item) => {
      const normalizedDate = normalizeProjectDate(item.date);
      const yearFromDate = getYearFromProjectDate(normalizedDate);

      const projectName = item.projectName || "Untitled";

      return {
        id: item.entryId,
        projectName,
        date: normalizedDate,
        year: yearFromDate,
        description: item.description || "",
        images: Array.isArray(item.images) ? item.images : [],
        url: item.url || null,
        technology: item.technology || [],
        featured: Boolean(item.featured),
        hidden: Boolean(item.hidden),
        meta: item.meta,
      };
    })
    .filter(
      (p) => typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date),
    )
    .sort((a, b) => {
      const ad = a.date || "";
      const bd = b.date || "";
      if (ad !== bd) return bd.localeCompare(ad);

      const aName = (a.projectName || "").toString();
      const bName = (b.projectName || "").toString();
      return aName.localeCompare(bName);
    });
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

const yearCounts = computed(() =>
  Object.fromEntries(
    years.value.map((y) => [y, projectsByYear.value[y]?.length || 0]),
  ),
);

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

const {
  galleryMounted,
  isGalleryOpen,
  galleryTitle,
  galleryImages,
  galleryIndex,
  galleryOriginRect,
  getOriginRect,
  galleryShareUrl,
  galleryCaseStudyHref,
  openGallery,
} = useProjectGallery({ deepLink: true });
</script>

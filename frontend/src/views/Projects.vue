<template>
  <RailLayout :rail-width-rem="16" :hide-rail-on-mobile="true">
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

        <div>
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
                :show-admin-controls="isAdmin"
                :is-hidden="settingsStore.projects?.[project.id]?.hidden"
                :on-edit="(id) => openEditById(id)"
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
      />

      <!-- Admin upsert modal for editing an existing project (admin only) -->
      <AdminUpsertProject ref="adminUpsertRef" />
    </template>
  </RailLayout>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import RailLayout from "@/components/shared/rail-layout.vue";
import PageHeader from "@/components/shared/page-header.vue";
import ProjectsRailTimeline from "@/components/projects/projects-rail-timeline.vue";
import ProjectsCard from "@/components/projects/card/card.vue";
import ProjectsGalleryModal from "@/components/projects/projects-gallery-modal.vue";
import AdminUpsertProject from "@/components/admin/admin-upsert-project.vue";
import { useSettingsStore } from "@/stores/settings.js";
import {
  getYearFromProjectDate,
  normalizeProjectDate,
} from "@/utils/projectDate.js";

const settingsStore = useSettingsStore();

const adminUpsertRef = ref(null);

const isAdmin = computed(() => settingsStore.isAdminView);

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
</script>

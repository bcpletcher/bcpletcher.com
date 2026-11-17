<template>
  <template v-if="visible">
    <!-- Floating admin dock. Bottom-left on purpose: the top of every page belongs to the
         sticky header, and notifications use the bottom-right. -->
    <div
      ref="dockRef"
      class="fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2 sm:bottom-6 sm:left-6"
      @keydown.esc.stop="open = false"
    >
      <Transition
        enter-active-class="transition duration-150 ease-out motion-reduce:transition-none"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-100 ease-in motion-reduce:transition-none"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <section
          v-if="open"
          id="admin-dock-panel"
          class="flex max-h-[min(80vh,36rem)] w-88 max-w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-slate-200 shadow-2xl backdrop-blur-md"
          aria-label="Admin tools"
        >
          <header class="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-slate-100">Admin</h2>
              <p class="truncate text-xs text-slate-400">
                <template v-if="isLoggedIn">
                  {{ settingsStore.user?.email || "Signed in" }}
                </template>
                <template v-else>Not signed in</template>
              </p>
            </div>
            <button
              type="button"
              class="kbd-focus -mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-standard hover:bg-white/10 hover:text-slate-100"
              aria-label="Close admin tools"
              @click="open = false"
            >
              <AppIcon icon="fa-light fa-xmark" aria-hidden="true" />
            </button>
          </header>

          <div v-if="!isLoggedIn" class="px-4 pb-4">
            <button
              type="button"
              class="kbd-focus w-full cursor-pointer rounded-lg bg-sky-300 px-3 py-2 text-sm font-semibold text-slate-900 transition-standard hover:bg-sky-200"
              @click="signIn"
            >
              Sign in
            </button>
          </div>

          <template v-else>
            <div class="px-4 pb-3">
              <button
                type="button"
                class="kbd-focus inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-sky-300 px-3 py-2 text-sm font-semibold text-slate-900 transition-standard hover:bg-sky-200"
                @click="createProject"
              >
                <AppIcon icon="fa-solid fa-plus" aria-hidden="true" />
                New project
              </button>
            </div>

            <!-- The project this page is about, one tap away. -->
            <div v-if="currentProject" class="px-4 pb-3">
              <p class="mb-1.5 text-[0.65rem] font-semibold tracking-widest text-slate-500 uppercase">
                This page
              </p>
              <ProjectRow :row="currentProject" class="bg-white/5" @edit="edit" @case-study="caseStudy" />
            </div>

            <div class="flex min-h-0 flex-1 flex-col border-t border-white/10">
              <div class="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
                <p class="text-[0.65rem] font-semibold tracking-widest text-slate-500 uppercase">
                  {{ currentProject ? "Other projects" : "Projects" }} <span class="text-slate-600">({{ filteredRows.length }})</span>
                </p>
              </div>
              <div v-if="rows.length > 5" class="px-4 pb-2">
                <label class="sr-only" for="admin-dock-filter">Filter projects</label>
                <input
                  id="admin-dock-filter"
                  v-model="query"
                  type="search"
                  placeholder="Filter projects"
                  class="kbd-focus w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <ul class="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
                <li v-for="item in filteredRows" :key="item.id">
                  <ProjectRow :row="item" @edit="edit" @case-study="caseStudy" />
                </li>
                <li v-if="!filteredRows.length" class="px-2 py-3 text-sm text-slate-500">
                  {{ settingsStore.projects ? "No matching projects." : "Loading projects…" }}
                </li>
              </ul>
            </div>

            <footer class="flex flex-wrap items-center gap-1 border-t border-white/10 px-2 py-2">
              <button
                type="button"
                class="kbd-focus cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold transition-standard"
                :class="
                  settingsStore.impersonateUser
                    ? 'bg-sky-300/20 text-sky-100 hover:bg-sky-300/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-slate-100'
                "
                :aria-pressed="settingsStore.impersonateUser"
                @click="toggleImpersonate"
              >
                {{ settingsStore.impersonateUser ? "Viewing as visitor" : "View as visitor" }}
              </button>
              <button
                type="button"
                class="kbd-focus cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-standard hover:bg-white/10 hover:text-slate-100"
                @click="clearCache"
              >
                Clear cache
              </button>
              <button
                type="button"
                class="kbd-focus ml-auto cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-standard hover:bg-white/10 hover:text-slate-100"
                @click="logout"
              >
                Sign out
              </button>
            </footer>
          </template>
        </section>
      </Transition>

      <button
        type="button"
        class="kbd-focus inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-slate-950/90 py-2 pr-4 pl-3 text-xs font-semibold tracking-widest text-slate-200 uppercase shadow-lg backdrop-blur-md transition-standard hover:border-white/20 hover:text-white"
        :aria-expanded="open"
        aria-controls="admin-dock-panel"
        @click="open = !open"
      >
        <span
          class="h-2 w-2 rounded-full"
          :class="
            settingsStore.impersonateUser
              ? 'bg-amber-300'
              : isLoggedIn
                ? 'bg-emerald-300'
                : 'bg-slate-500'
          "
          aria-hidden="true"
        />
        Admin
      </button>
    </div>

    <AdminUpsertProject ref="upsertRef" />
    <AdminCaseStudyEditor ref="caseStudyRef" />
  </template>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";

import AdminCaseStudyEditor from "@/components/admin/admin-case-study-editor.vue";
import AdminUpsertProject from "@/components/admin/admin-upsert-project.vue";
import AppIcon from "@/components/shared/app-icon.vue";
import { registerAdminActions } from "@/composables/useAdminActions.js";
import { useCloudflareStore } from "@/stores/cloudflare.js";
import { useNotificationStore } from "@/stores/notification.js";
import { useSettingsStore } from "@/stores/settings.js";
import { clearProjectsCache } from "@/utils/cache.js";
import { normalizeProjectDate } from "@/utils/projectDate.js";
import { slugify } from "@/utils/slug.js";

const cloudflareStore = useCloudflareStore();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();
const route = useRoute();

const isEmulatorEnabled =
  String(import.meta.env.VITE_USE_EMULATOR).toLowerCase() === "true";

const visible = computed(() => settingsStore.isSignedIn || isEmulatorEnabled);
const isLoggedIn = computed(() => Boolean(settingsStore.user?.uid));

const open = ref(false);
const query = ref("");
const dockRef = useTemplateRef("dockRef");
const upsertRef = useTemplateRef("upsertRef");
const caseStudyRef = useTemplateRef("caseStudyRef");

// One compact row per project: name + status on the left, icon actions on the right.
const ProjectRow = defineComponent({
  props: { row: { type: Object, required: true } },
  emits: ["edit", "case-study"],
  setup(props, { emit }) {
    const iconButton = (label, icon, onClick, tone = "") =>
      h(
        "button",
        {
          type: "button",
          title: label,
          "aria-label": `${label}: ${props.row.name}`,
          class: `kbd-focus inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-standard hover:bg-white/10 hover:text-sky-300 ${tone || "text-slate-300"}`,
          onClick,
        },
        [h(AppIcon, { icon, "aria-hidden": "true" })],
      );

    return () => {
      const { row } = props;
      const caseStudyLabel =
        row.caseStudyState === "published"
          ? "Edit case study"
          : row.caseStudyState === "draft"
            ? "Edit case study draft"
            : "Add case study";
      const status = [
        row.hidden ? "Hidden" : null,
        row.caseStudyState === "published"
          ? "Case study live"
          : row.caseStudyState === "draft"
            ? "Case study draft"
            : null,
      ].filter(Boolean);

      return h(
        "div",
        { class: "flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5" },
        [
          h("div", { class: "min-w-0 flex-1" }, [
            h("p", { class: "truncate text-sm font-medium text-slate-100" }, row.name),
            h(
              "p",
              { class: "truncate text-xs text-slate-500" },
              [row.company, ...status].filter(Boolean).join(" · ") || "\u00A0",
            ),
          ]),
          iconButton("Edit project", "fa-light fa-pen-to-square", () => emit("edit", row.id)),
          iconButton(
            caseStudyLabel,
            "fa-light fa-file-lines",
            () => emit("case-study", row.id),
            row.caseStudyState === "published" ? "text-sky-300" : "text-slate-300",
          ),
        ],
      );
    };
  },
});

const rows = computed(() => {
  const all = settingsStore.projects || {};
  return Object.entries(all)
    .map(([id, p]) => ({
      id,
      name: p?.projectName || p?.title || id,
      company: p?.companyName || "",
      hidden: Boolean(p?.hidden),
      date: normalizeProjectDate(p?.date) || "",
      caseStudyState: p?.caseStudy ? (p.caseStudy.published ? "published" : "draft") : "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
});

// On a case study page (/work/:slug) the matching project is pinned to the top.
const currentProject = computed(() => {
  const slug = route.params?.slug;
  if (!slug) return null;
  return rows.value.find((r) => slugify(r.name) === slug) || null;
});

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase();
  const pinned = currentProject.value?.id;
  return rows.value.filter(
    (r) => r.id !== pinned && (!q || `${r.name} ${r.company}`.toLowerCase().includes(q)),
  );
});

function createProject() {
  open.value = false;
  upsertRef.value?.showModal?.();
}

function edit(id) {
  const entry = settingsStore.projects?.[id];
  if (!entry) return;
  open.value = false;
  upsertRef.value?.showModal?.({ name: id, ...entry });
}

function caseStudy(id) {
  open.value = false;
  caseStudyRef.value?.open?.(id);
}

function signIn() {
  open.value = false;
  settingsStore.showAdminModal = true;
}

function toggleImpersonate() {
  settingsStore.impersonateUser = !settingsStore.impersonateUser;
}

async function clearCache() {
  try {
    await clearProjectsCache();
    notificationStore.addNotification({
      variant: "success",
      title: "Cache cleared",
      message: "Projects cache cleared. Reloading…",
      duration: 2,
    });
    // Reload so boot sequence runs without cached payload.
    setTimeout(() => window.location.reload(), 600);
  } catch (e) {
    console.warn("Failed to clear projects cache", e);
    notificationStore.addNotification({
      variant: "danger",
      title: "Cache not cleared",
      message: "Couldn’t clear the cache. Check console for details.",
      duration: 4,
    });
  }
}

async function logout() {
  open.value = false;
  await cloudflareStore.adminSignOut();
  settingsStore.user = {};
  settingsStore.impersonateUser = false;
}

// Close when clicking elsewhere on the page.
function onPointerDown(event) {
  if (!open.value) return;
  if (dockRef.value && !dockRef.value.contains(event.target)) open.value = false;
}

let unregister = () => {};
onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  unregister = registerAdminActions({
    create: createProject,
    edit,
    caseStudy,
  });
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  unregister();
});
</script>

<template>
  <ModalWrapper
    v-model="visible"
    :labelledby="titleId"
    :describedby="descId"
    z-class="z-9999"
    initial-focus-selector="button[aria-label=Close]"
    panel-selector="[data-modal-panel]"
  >
    <div
      v-if="draft"
      data-modal-panel
      class="relative w-[94vw] max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-6"
      >
        <div class="min-w-0">
          <p
            :id="titleId"
            class="text-xs font-semibold uppercase tracking-widest text-slate-400"
          >
            Case study
          </p>
          <p :id="descId" class="truncate text-sm font-medium text-slate-100">
            {{ projectName }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a
            :href="`/work/${slug}`"
            target="_blank"
            rel="noopener"
            class="kbd-focus hidden h-9 items-center rounded-full border border-white/10 bg-white/5 px-3.5 text-xs font-semibold text-slate-200 transition-standard hover:bg-white/10 sm:inline-flex"
          >
            Open page
          </a>
          <button
            type="button"
            class="kbd-focus inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-standard hover:bg-white/10"
            aria-label="Close"
            @click="cancel"
          >
            <AppIcon icon="fa-regular fa-xmark" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="max-h-[72vh] overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <p
          v-if="error"
          role="alert"
          class="mb-4 rounded-xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
        >
          {{ error }}
        </p>

        <!-- Overview -->
        <section class="rounded-xl border border-white/10 bg-black/10 p-4 md:p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-300">
              Overview
            </p>
            <label class="inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-200">
              <input
                v-model="draft.published"
                type="checkbox"
                class="h-4 w-4 cursor-pointer accent-sky-300"
              />
              Published
              <span class="text-xs text-slate-500">
                (links from cards and is indexed; off keeps it a draft)
              </span>
            </label>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="md:col-span-2">
              <span :class="labelClass">Summary</span>
              <textarea
                v-model="draft.summary"
                rows="3"
                maxlength="1000"
                :class="inputClass"
                placeholder="One or two sentences shown at the top of the page."
              />
            </label>
            <label>
              <span :class="labelClass">Role</span>
              <input v-model="draft.role" type="text" maxlength="120" :class="inputClass" />
            </label>
            <label>
              <span :class="labelClass">Role note</span>
              <input
                v-model="draft.roleNote"
                type="text"
                maxlength="160"
                :class="inputClass"
                placeholder="e.g. Company, client engagement"
              />
            </label>
            <label>
              <span :class="labelClass">Focus</span>
              <input v-model="draft.focus" type="text" maxlength="200" :class="inputClass" />
            </label>
            <label>
              <span :class="labelClass">Industry</span>
              <input v-model="draft.industry" type="text" maxlength="100" :class="inputClass" />
            </label>
            <label class="md:col-span-2">
              <span :class="labelClass">Stack</span>
              <input
                v-model="draft.stackText"
                type="text"
                :class="inputClass"
                placeholder="Comma separated: React, TypeScript, Vite"
              />
            </label>
          </div>
        </section>

        <!-- Sections -->
        <section
          v-for="(section, si) in draft.sections"
          :key="section._k"
          class="mt-4 rounded-xl border border-white/10 bg-black/10 p-4 md:p-5"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold tabular-nums tracking-widest text-sky-300">
              {{ String(si + 1).padStart(2, "0") }}
            </span>
            <input
              v-model="section.title"
              type="text"
              maxlength="120"
              :class="[inputClass, 'font-semibold']"
              placeholder="Section title"
              :aria-label="`Section ${si + 1} title`"
            />
            <button
              type="button"
              :class="iconButtonClass"
              :disabled="si === 0"
              aria-label="Move section up"
              @click="move(draft.sections, si, -1)"
            >
              <AppIcon icon="fa-light fa-arrow-up" aria-hidden="true" />
            </button>
            <button
              type="button"
              :class="iconButtonClass"
              :disabled="si === draft.sections.length - 1"
              aria-label="Move section down"
              @click="move(draft.sections, si, 1)"
            >
              <AppIcon icon="fa-light fa-arrow-down" aria-hidden="true" />
            </button>
            <button
              type="button"
              :class="[iconButtonClass, 'hover:text-rose-300']"
              aria-label="Remove section"
              @click="removeSection(si)"
            >
              <AppIcon icon="fa-light fa-trash" aria-hidden="true" />
            </button>
          </div>

          <label class="mt-4 block">
            <span :class="labelClass">Text</span>
            <textarea
              v-model="section.bodyText"
              rows="5"
              :class="inputClass"
              placeholder="Blank lines start a new paragraph."
            />
          </label>

          <!-- Highlights -->
          <div class="mt-4">
            <div class="flex items-center justify-between">
              <p :class="labelClass">Highlights</p>
              <button type="button" :class="smallButtonClass" @click="addPoint(section)">
                <AppIcon icon="fa-light fa-plus" aria-hidden="true" /> Add highlight
              </button>
            </div>
            <div
              v-for="(point, pi) in section.points"
              :key="point._k"
              class="mt-2 grid gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 md:grid-cols-[1fr_2fr_auto]"
            >
              <input
                v-model="point.title"
                type="text"
                maxlength="120"
                :class="inputClass"
                placeholder="Title"
                :aria-label="`Highlight ${pi + 1} title`"
              />
              <input
                v-model="point.text"
                type="text"
                maxlength="1000"
                :class="inputClass"
                placeholder="Detail"
                :aria-label="`Highlight ${pi + 1} detail`"
              />
              <button
                type="button"
                :class="[iconButtonClass, 'hover:text-rose-300']"
                aria-label="Remove highlight"
                @click="section.points.splice(pi, 1)"
              >
                <AppIcon icon="fa-light fa-trash" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Figures -->
          <div class="mt-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p :class="labelClass">Screens</p>
              <div class="flex gap-2">
                <button type="button" :class="smallButtonClass" @click="addFigure(section, 'image')">
                  <AppIcon icon="fa-light fa-plus" aria-hidden="true" /> Screen
                </button>
                <button type="button" :class="smallButtonClass" @click="addFigure(section, 'compare')">
                  <AppIcon icon="fa-light fa-plus" aria-hidden="true" /> Before / after
                </button>
              </div>
            </div>

            <div
              v-for="(fig, fi) in section.figures"
              :key="fig._k"
              class="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {{ fig.kind === "compare" ? "Before / after" : "Screen" }}
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    :class="iconButtonClass"
                    :disabled="fi === 0"
                    aria-label="Move screen up"
                    @click="move(section.figures, fi, -1)"
                  >
                    <AppIcon icon="fa-light fa-arrow-up" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    :class="iconButtonClass"
                    :disabled="fi === section.figures.length - 1"
                    aria-label="Move screen down"
                    @click="move(section.figures, fi, 1)"
                  >
                    <AppIcon icon="fa-light fa-arrow-down" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    :class="[iconButtonClass, 'hover:text-rose-300']"
                    aria-label="Remove screen"
                    @click="section.figures.splice(fi, 1)"
                  >
                    <AppIcon icon="fa-light fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div
                class="mt-3 grid gap-3"
                :class="fig.kind === 'compare' ? 'sm:grid-cols-2' : ''"
              >
                <div
                  v-for="slot in slotsFor(fig)"
                  :key="slot.key"
                  class="flex flex-col gap-2"
                >
                  <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {{ slot.label }}
                  </p>
                  <div
                    class="aspect-video overflow-hidden rounded-lg border border-dashed border-white/15 bg-black/20"
                  >
                    <img
                      v-if="fig[slot.key]?.path"
                      :src="previewUrl(fig[slot.key].path)"
                      alt=""
                      class="h-full w-full object-cover object-top"
                    />
                    <p
                      v-else
                      class="flex h-full items-center justify-center text-xs text-slate-500"
                    >
                      No image yet
                    </p>
                  </div>
                  <label :class="[smallButtonClass, 'w-fit cursor-pointer']">
                    <AppIcon icon="fa-light fa-plus" aria-hidden="true" />
                    {{ fig[slot.key]?.path ? "Replace" : "Upload" }}
                    <input
                      type="file"
                      accept="image/*"
                      class="sr-only"
                      :disabled="uploading"
                      @change="(e) => onPickFile(e, fig, slot.key)"
                    />
                  </label>
                  <input
                    v-model="fig[slot.altKey]"
                    type="text"
                    maxlength="300"
                    :class="inputClass"
                    placeholder="Alt text (describe the screen)"
                    :aria-label="`${slot.label} alt text`"
                  />
                </div>
              </div>

              <input
                v-model="fig.caption"
                type="text"
                maxlength="600"
                :class="[inputClass, 'mt-3']"
                placeholder="Caption"
                aria-label="Caption"
              />
            </div>
          </div>
        </section>

        <button type="button" :class="[smallButtonClass, 'mt-4']" @click="addSection">
          <AppIcon icon="fa-light fa-plus" aria-hidden="true" /> Add section
        </button>
      </div>

      <!-- Footer -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 md:px-6"
      >
        <button
          type="button"
          class="kbd-focus cursor-pointer text-xs font-semibold text-rose-300/90 transition-colors hover:text-rose-200 disabled:opacity-40"
          :disabled="saving || !hadSaved"
          @click="removeCaseStudy"
        >
          Remove case study
        </button>

        <div class="flex items-center gap-3">
          <p v-if="uploading" class="text-xs text-slate-400">Uploading image…</p>
          <button
            type="button"
            class="kbd-focus h-10 cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition-standard hover:bg-white/10"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="kbd-focus h-10 cursor-pointer rounded-full bg-sky-300 px-6 text-sm font-semibold text-slate-900 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving || uploading"
            @click="save"
          >
            {{ saving ? "Saving…" : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { computed, ref } from "vue";

import ModalWrapper from "@/components/shared/modal-wrapper.vue";
import { useCloudflareStore } from "@/stores/cloudflare.js";
import { useNotificationStore } from "@/stores/notification.js";
import { useSettingsStore } from "@/stores/settings.js";
import { saveProjectsToCache } from "@/utils/cache.js";
import {
  buildMediaUrl,
  buildResizedStoragePath,
} from "@/utils/mediaStorageImages.js";
import { slugify } from "@/utils/slug.js";

const settingsStore = useSettingsStore();
const cloudflareStore = useCloudflareStore();
const notificationStore = useNotificationStore();

const titleId = `cs-editor-title-${Math.random().toString(36).slice(2)}`;
const descId = `cs-editor-desc-${Math.random().toString(36).slice(2)}`;

const visible = ref(false);
const projectId = ref("");
const draft = ref(null);
const hadSaved = ref(false);
const saving = ref(false);
const uploading = ref(false);
const error = ref("");

// Paths uploaded in this editing session and paths that were already saved with the case
// study when it opened: used to clean up R2 once the outcome of the edit is known.
let sessionUploads = [];
let savedPaths = new Set();

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-sky-300/50";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400";
const smallButtonClass =
  "kbd-focus inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 transition-standard hover:bg-white/10 hover:text-sky-300";
const iconButtonClass =
  "kbd-focus inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-standard hover:bg-white/10 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-30";

const project = computed(() => settingsStore.projects?.[projectId.value] || null);
const projectName = computed(() => project.value?.projectName || projectId.value);
const slug = computed(() => slugify(projectName.value));

let keySeed = 0;
const key = () => `k${(keySeed += 1)}`;

const DEFAULT_SECTIONS = ["The problem", "My role", "Process", "Outcome"];

function newFigure(kind) {
  return kind === "compare"
    ? {
        _k: key(),
        kind: "compare",
        before: null,
        after: null,
        beforeAlt: "",
        afterAlt: "",
        caption: "",
      }
    : { _k: key(), kind: "image", image: null, alt: "", caption: "" };
}

function toDraft(cs) {
  const src = cs || {};
  return {
    published: Boolean(src.published),
    summary: src.summary || "",
    role: src.role || "",
    roleNote: src.roleNote || "",
    focus: src.focus || "",
    industry: src.industry || "",
    stackText: (src.stack || []).join(", "),
    sections: (src.sections?.length
      ? src.sections
      : DEFAULT_SECTIONS.map((title) => ({ title }))
    ).map((s) => ({
      _k: key(),
      title: s.title || "",
      bodyText: (s.body || []).join("\n\n"),
      points: (s.points || []).map((p) => ({
        _k: key(),
        title: p.title || "",
        text: p.text || "",
      })),
      figures: (s.figures || []).map((f) => ({
        _k: key(),
        kind: f.kind === "compare" ? "compare" : "image",
        image: f.image || null,
        before: f.before || null,
        after: f.after || null,
        alt: f.alt || "",
        beforeAlt: f.beforeAlt || "",
        afterAlt: f.afterAlt || "",
        caption: f.caption || "",
      })),
    })),
  };
}

function toPayload(d) {
  const text = (v) => String(v || "").trim();
  return {
    published: Boolean(d.published),
    summary: text(d.summary),
    role: text(d.role),
    roleNote: text(d.roleNote),
    focus: text(d.focus),
    industry: text(d.industry),
    stack: d.stackText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    sections: d.sections.map((s) => ({
      title: text(s.title),
      body: String(s.bodyText || "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
      points: s.points
        .filter((p) => text(p.title))
        .map((p) => ({ title: text(p.title), text: text(p.text) })),
      figures: s.figures
        .map((f) =>
          f.kind === "compare"
            ? f.before?.path && f.after?.path
              ? {
                  kind: "compare",
                  before: { path: f.before.path },
                  after: { path: f.after.path },
                  beforeAlt: text(f.beforeAlt),
                  afterAlt: text(f.afterAlt),
                  caption: text(f.caption),
                }
              : null
            : f.image?.path
              ? {
                  kind: "image",
                  image: { path: f.image.path },
                  alt: text(f.alt),
                  caption: text(f.caption),
                }
              : null,
        )
        .filter(Boolean),
    })),
  };
}

function pathsIn(payload) {
  const out = new Set();
  payload?.sections?.forEach((s) =>
    s.figures?.forEach((f) => {
      [f.image, f.before, f.after].forEach((i) => i?.path && out.add(i.path));
    }),
  );
  return out;
}

function slotsFor(fig) {
  return fig.kind === "compare"
    ? [
        { key: "before", label: "Before", altKey: "beforeAlt" },
        { key: "after", label: "After", altKey: "afterAlt" },
      ]
    : [{ key: "image", label: "Screen", altKey: "alt" }];
}

function previewUrl(path) {
  const resized = buildResizedStoragePath(path, { width: 480 });
  return buildMediaUrl(resized || path) || "";
}

function move(list, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

function addSection() {
  draft.value.sections.push({
    _k: key(),
    title: "",
    bodyText: "",
    points: [],
    figures: [],
  });
}

function removeSection(index) {
  const s = draft.value.sections[index];
  const hasContent =
    s.title || s.bodyText || s.points.length || s.figures.length;
  if (hasContent && !window.confirm("Remove this section and its content?")) return;
  draft.value.sections.splice(index, 1);
}

function addPoint(section) {
  section.points.push({ _k: key(), title: "", text: "" });
}

function addFigure(section, kind) {
  section.figures.push(newFigure(kind));
}

async function onPickFile(event, fig, slotKey) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  error.value = "";
  uploading.value = true;
  try {
    const [uploaded] = await cloudflareStore.uploadProjectImages(projectId.value, [
      file,
    ]);
    if (!uploaded?.path) throw new Error("Upload did not return an image path");
    sessionUploads.push(uploaded.path);
    fig[slotKey] = { path: uploaded.path };
  } catch (e) {
    console.error("Case study image upload failed", e);
    error.value = e?.message || "The image could not be uploaded.";
  } finally {
    uploading.value = false;
  }
}

async function deletePaths(paths) {
  const galleryPaths = new Set(
    (project.value?.images || []).map((i) => i?.path).filter(Boolean),
  );
  await Promise.allSettled(
    [...paths]
      .filter((p) => !galleryPaths.has(p))
      .map((p) => cloudflareStore.deleteProjectImageByPath(p)),
  );
}

function open(id) {
  const entry = settingsStore.projects?.[id];
  if (!entry) return;
  projectId.value = id;
  error.value = "";
  sessionUploads = [];
  hadSaved.value = Boolean(entry.caseStudy);
  draft.value = toDraft(entry.caseStudy);
  savedPaths = pathsIn(entry.caseStudy);
  visible.value = true;
}

async function cancel() {
  // Anything uploaded this session was never saved; remove it.
  if (sessionUploads.length) await deletePaths(new Set(sessionUploads));
  sessionUploads = [];
  visible.value = false;
}

async function persist(nextCaseStudy) {
  const current = settingsStore.projects?.[projectId.value];
  if (!current) throw new Error("Project not found");

  const data = { ...current };
  if (nextCaseStudy) data.caseStudy = nextCaseStudy;
  else delete data.caseStudy;

  await cloudflareStore.dataUpdateProjectDocument({ id: projectId.value, data });
  settingsStore.projects = { ...(settingsStore.projects || {}), [projectId.value]: data };
  try {
    await saveProjectsToCache(settingsStore.projects);
  } catch (e) {
    console.warn("Failed to update projects cache", e);
  }
}

async function save() {
  error.value = "";
  const payload = toPayload(draft.value);
  if (!payload.sections.length) {
    error.value = "Add at least one section.";
    return;
  }
  if (payload.sections.some((s) => !s.title)) {
    error.value = "Every section needs a title.";
    return;
  }

  saving.value = true;
  try {
    await persist(payload);

    // Drop media that is no longer referenced: replaced uploads and removed screens.
    const keep = pathsIn(payload);
    const stale = new Set(
      [...sessionUploads, ...savedPaths].filter((p) => !keep.has(p)),
    );
    if (stale.size) await deletePaths(stale);

    sessionUploads = [];
    savedPaths = keep;
    notificationStore.addNotification({
      variant: "success",
      title: "Case study",
      message: payload.published ? "Saved and published." : "Saved as a draft.",
      duration: 3,
    });
    visible.value = false;
  } catch (e) {
    console.error("Failed to save case study", e);
    error.value = e?.message || "Couldn’t save the case study. Please try again.";
  } finally {
    saving.value = false;
  }
}

async function removeCaseStudy() {
  if (
    !window.confirm(
      "Remove this case study and its images? This can’t be undone.",
    )
  ) {
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    await persist(null);
    await deletePaths(new Set([...savedPaths, ...sessionUploads]));
    sessionUploads = [];
    savedPaths = new Set();
    notificationStore.addNotification({
      variant: "success",
      title: "Case study",
      message: "Case study removed.",
      duration: 3,
    });
    visible.value = false;
  } catch (e) {
    console.error("Failed to remove case study", e);
    error.value = e?.message || "Couldn’t remove the case study.";
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

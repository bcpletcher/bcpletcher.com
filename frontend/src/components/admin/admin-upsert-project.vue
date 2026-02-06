<template>
  <Teleport to="body">
    <!-- Always-mounted overlay to avoid blur snap and transition teardown hitches -->
    <div
      class="fixed left-0 top-0 z-9999 w-dvw h-dvh"
      :class="visible ? 'pointer-events-auto' : 'pointer-events-none'"
      aria-hidden="true"
    >
      <!-- Blur layer stays mounted; only opacity changes -->
      <div
        class="absolute inset-0 backdrop-blur-sm"
        :class="visible ? 'opacity-100' : 'opacity-0'"
        style="transition: opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)"
      />

      <!-- Tint layer (click-to-close) -->
      <button
        type="button"
        class="kbd-focus absolute inset-0 bg-black/70 cursor-pointer"
        :class="visible ? 'opacity-100' : 'opacity-0'"
        style="transition: opacity 260ms cubic-bezier(0.16, 1, 0.3, 1)"
        aria-label="Close project editor"
        @click="cancel"
      />
    </div>

    <!-- Always-mounted dialog wrapper; animate with opacity/transform to avoid unmount hitches -->
    <div
      ref="dialogRef"
      class="fixed left-0 top-0 z-10000 flex h-dvh w-dvw items-center justify-center"
      :class="visible ? 'pointer-events-auto' : 'pointer-events-none'"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="descId"
      tabindex="-1"
      @keydown.esc="cancel"
      @transitionend="onDialogTransitionEnd"
    >
      <div
        class="relative w-[92vw] max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur"
        :class="
          visible
            ? 'opacity-100 translate-y-0 scale-100 blur-0'
            : 'opacity-0 translate-y-3 scale-[0.985] blur-sm'
        "
        style="
          transition: opacity 320ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 360ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 360ms cubic-bezier(0.16, 1, 0.3, 1);
        "
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-6">
          <div class="flex flex-col">
            <p
              :id="titleId"
              class="text-xs font-semibold tracking-widest uppercase text-slate-400"
            >
              {{ isEdit ? 'Edit Project' : 'Create Project' }}
            </p>
            <p :id="descId" class="text-xs text-slate-500">
              {{ isEdit ? 'Update fields and save changes.' : 'Fill out fields and publish a new entry.' }}
            </p>
          </div>

          <button
            type="button"
            class="kbd-focus cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-standard"
            aria-label="Close"
            @click="cancel"
          >
            <i class="fa-regular fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-4 pb-4 pt-4 md:px-6 md:pb-6">
          <div class="max-h-[70vh] overflow-y-auto pr-1">
            <!-- Generated form fields -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div
                v-for="field in formFields"
                :key="field.key"
                :class="field.colSpan"
              >
                <!-- Standard label + side meta (like counters) -->
                <div
                  v-if="field.type !== 'toggle'"
                  class="flex items-center justify-between"
                >
                  <label
                    class="block text-xs font-semibold tracking-widest uppercase text-slate-400"
                  >
                    {{ field.label }}
                  </label>
                  <span
                    v-if="field.counter"
                    class="text-xs text-slate-500"
                  >
                    {{ field.counter() }}
                  </span>
                </div>

                <!-- Toggle field -->
                <div
                  v-else
                  class="flex items-center justify-between gap-4"
                >
                  <div>
                    <label
                      class="block text-xs font-semibold tracking-widest uppercase text-slate-400"
                    >
                      {{ field.label }}
                    </label>
                    <p v-if="field.help" class="mt-1 text-xs text-slate-500">
                      {{ field.help }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="kbd-focus cursor-pointer relative inline-flex h-7 w-12 items-center rounded-full border transition-standard focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    :class="
                      field.model.value
                        ? 'bg-sky-300 border-sky-300/60'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    "
                    :disabled="isSubmitting || field.disabled?.()"
                    :aria-label="field.ariaLabel || field.label"
                    @click="field.model.value = !field.model.value"
                  >
                    <span
                      class="inline-block h-5 w-5 transform rounded-full shadow transition-standard"
                      :class="
                        field.model.value
                          ? 'translate-x-6 bg-slate-900'
                          : 'translate-x-1 bg-slate-200/90'
                      "
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <!-- Input -->
                <input
                  v-if="field.type === 'input'"
                  v-model="field.model.value"
                  :disabled="isSubmitting || field.disabled?.()"
                  :type="field.inputType || 'text'"
                  :inputmode="field.inputMode"
                  :placeholder="field.placeholder"
                  class="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
                />

                <!-- Textarea -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="field.model.value"
                  :disabled="isSubmitting || field.disabled?.()"
                  :rows="field.rows || 3"
                  :maxlength="field.maxLength"
                  :placeholder="field.placeholder"
                  class="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
                />

                <!-- Help text (non-toggle) -->
                <p
                  v-if="field.type !== 'toggle' && field.help"
                  class="mt-1 text-xs text-slate-500"
                >
                  {{ field.help }}
                </p>
              </div>
            </div>

            <!-- Images -->
            <div class="mt-6">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold tracking-widest uppercase text-slate-400">Images</p>
                <p class="text-xs text-slate-500">Drag to reorder. Star sets the hero.</p>
              </div>

              <div
                class="mt-3 mb-2 rounded-xl border-2 border-dashed border-white/10 bg-black/20 px-4 py-6 text-center hover:border-sky-300/40 hover:bg-white/5 transition-standard cursor-pointer"
                @click="fileInputRef?.click()"
                @dragover.prevent
                @dragenter.prevent
                @drop.prevent="onImageFilesDropped($event)"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="onImageFilesSelected($event)"
                />
                <p class="text-sm text-slate-200 mb-1">
                  Drag & drop images here, or <span class="text-sky-300">click to browse</span>
                </p>
                <p class="text-xs text-slate-500">(16:9 recommended)</p>
              </div>

              <VueDraggableNext
                v-model="documentModel.data.images"
                :disabled="documentModel.data.images.length < 2 || isSubmitting"
                class="grid grid-cols-2 gap-4 sm:grid-cols-3"
              >
                <div
                  v-for="(item, index) in documentModel.data.images"
                  :key="getImageKey(item, index)"
                  class="relative group cursor-move overflow-hidden rounded-xl border border-white/10 bg-black/20"
                >
                  <div
                    class="w-full aspect-video bg-black/30 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-70"
                  >
                    <img
                      :src="getImagePreviewUrl(item)"
                      alt="Preview"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Hero button -->
                  <button
                    class="absolute top-2 left-2 pointer-events-auto w-8 h-8 flex items-center justify-center bg-black/70 rounded-full transition-opacity duration-200"
                    :class="[
                      index === 0
                         ? 'text-yellow-400 opacity-100'
                         : 'text-white opacity-0 group-hover:opacity-100',
                     ]"
                    type="button"
                    aria-label="Set hero image"
                    @click.stop="setHeroImage(item)"
                  >
                    <i
                      :class="
                         index === 0
                           ? 'fa-solid fa-star'
                           : 'fa-regular fa-star'
                       "
                      aria-hidden="true"
                    />
                  </button>

                  <!-- Remove image button -->
                  <button
                    class="absolute top-2 right-2 pointer-events-auto w-8 h-8 flex items-center justify-center text-red-300 bg-black/70 rounded-full transition-standard opacity-0 group-hover:opacity-100"
                    type="button"
                    aria-label="Remove image"
                    @click.stop="queueRemoval(index, 'images')"
                  >
                    <i class="fa-regular fa-minus" aria-hidden="true" />
                  </button>
                </div>
              </VueDraggableNext>

              <div
                v-if="!isSubmitting && pendingFiles.length"
                class="grid grid-cols-2 gap-4 mt-3 opacity-80 sm:grid-cols-3"
              >
                <div
                  v-for="(pending, pIndex) in pendingFiles"
                  :key="`pending-${pIndex}`"
                  class="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
                >
                  <div class="w-full aspect-video bg-black/30">
                    <img
                      :src="pending.previewUrl"
                      alt="Pending preview"
                      class="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <div
                    class="absolute bottom-2 left-2 px-2 py-1 text-[10px] uppercase tracking-wide bg-black/70 text-white rounded-full"
                  >
                    Pending
                  </div>
                </div>
              </div>
            </div>

            <!-- Technology -->
            <div class="mt-6">
              <!-- Title + add row (inline) -->
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-semibold tracking-widest uppercase text-slate-400">
                  Technology
                </p>

                <div class="w-full sm:max-w-md">
                  <label class="sr-only" for="tech-add">Add technology</label>
                  <div class="flex gap-2">
                    <input
                      id="tech-add"
                      v-model="techToAdd"
                      :disabled="isSubmitting"
                      type="text"
                      placeholder="Add a technology"
                      class="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
                      @keydown.enter.prevent="commitTechToAdd"
                    />
                    <button
                      type="button"
                      class="kbd-focus cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-standard disabled:opacity-60 disabled:cursor-not-allowed"
                      :disabled="isSubmitting || !techToAdd.trim()"
                      aria-label="Add technology"
                      @click="commitTechToAdd"
                    >
                      <i class="fa-regular fa-plus" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Technology pills list (below) -->
              <div class="mt-3 flex flex-wrap gap-2">
                <div
                  v-for="(tech, index) in documentModel.data.technology"
                  :key="`tech-${index}`"
                  class="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
                >
                  <input
                    v-model="documentModel.data.technology[index]"
                    :disabled="isSubmitting"
                    type="text"
                    class="w-[10ch] min-w-[8ch] max-w-[18ch] bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    :placeholder="tech ? '' : 'Tech'"
                    @blur="normalizeTechnology(index)"
                    @keydown.enter.prevent="normalizeTechnology(index)"
                  />

                  <button
                    type="button"
                    class="kbd-focus cursor-pointer inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-300/90 hover:text-red-200 hover:bg-white/10 transition-standard"
                    :disabled="isSubmitting"
                    aria-label="Remove technology"
                    @click="removeTechnology(index)"
                  >
                    <i class="fa-regular fa-xmark" aria-hidden="true" />
                  </button>
                </div>

                <div v-if="!documentModel.data.technology.length" class="text-sm text-slate-500">
                  Add technologies like Vue, Tailwind, Firebase
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-white/10 px-4 py-3 md:px-6">
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="kbd-focus cursor-pointer rounded px-4 py-1 border border-font-primary text-font-primary font-bold text-sm hover:bg-font-primary/10 transition-standard disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="isSubmitting"
              @click="cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              class="kbd-focus cursor-pointer rounded px-4 py-1 border border-gradient-start text-font-secondary font-bold text-sm hover:bg-gradient-start hover:text-font-tertiary transition-standard disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="isSubmitting"
              @click="submit"
            >
              <span v-if="isSubmitting">
                {{ isEdit ? "Updating..." : "Submitting..." }}
              </span>
              <span v-else>{{ isEdit ? "Update" : "Submit" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch, toRef } from "vue";
import { VueDraggableNext } from "vue-draggable-next";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { saveProjectsToCache } from "@/utils/cache.js";
import { useFocusTrap } from "@/composables/useFocusTrap.js";

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
const visible = ref(false);
const isEdit = ref(false);
const isSubmitting = ref(false);

// Close cleanup: keep mounted, but wipe expensive state after transition is done
const pendingCloseCleanup = ref(false);

const onDialogTransitionEnd = () => {
  if (!pendingCloseCleanup.value) return;
  pendingCloseCleanup.value = false;
  resetState();
};

const DESCRIPTION_MAX = 500;
const SUMMARY_MAX = 200;

const emptyDocument = () => ({
  id: null,
  data: {
    order: 0,
    eyebrow: null,
    date: null,
    year: null,
    title: null,
    summary: "",
    description: "",
    featured: false,
    images: [],
    technology: [],
    url: null,
    hidden: false,
  },
});

const documentModel = ref(emptyDocument());

const summaryCount = computed(
  () => (documentModel.value.data.summary || "").length
);
const descriptionCount = computed(
  () => (documentModel.value.data.description || "").length
);

// Enforce max lengths even if data is pasted or older entries have longer content.
watch(
  () => documentModel.value.data.summary,
  (val) => {
    if (typeof val !== "string") return;
    if (val.length > SUMMARY_MAX) {
      documentModel.value.data.summary = val.slice(0, SUMMARY_MAX);
    }
  }
);
watch(
  () => documentModel.value.data.description,
  (val) => {
    if (typeof val !== "string") return;
    if (val.length > DESCRIPTION_MAX) {
      documentModel.value.data.description = val.slice(0, DESCRIPTION_MAX);
    }
  }
);

const pendingRemovals = ref({
  images: [],
  technology: [],
});

// Track new files selected in this session (not yet uploaded)
const pendingFiles = ref([]); // { file: File, previewUrl: string }

const fileInputRef = ref(null);

function getImagePreviewUrl(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item.url) return item.url;
  return "";
}

function getImageKey(item, index) {
  if (typeof item === "string") return `img-url-${item}`;
  if (item && typeof item === "object" && item.path) return `img-path-${item.path}`;
  if (item && typeof item === "object" && item.url) return `img-url-${item.url}`;
  return `img-${index}`;
}

function imagesEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a === "string" && typeof b === "string") return a === b;

  // Compare objects by path, then url.
  const aPath = typeof a === "object" ? a.path : null;
  const bPath = typeof b === "object" ? b.path : null;
  if (aPath && bPath) return aPath === bPath;

  const aUrl = typeof a === "object" ? a.url : typeof a === "string" ? a : null;
  const bUrl = typeof b === "object" ? b.url : typeof b === "string" ? b : null;
  if (aUrl && bUrl) return aUrl === bUrl;

  return false;
}

const setHeroImage = (item) => {
  const images = documentModel.value.data.images;
  const index = images.findIndex((x) => imagesEqual(x, item));
  if (index <= 0) return; // already hero (first)

  images.splice(index, 1);
  images.unshift(item);
};

const queueRemoval = (index, key) => {
  const arr = documentModel.value.data[key];
  const value = arr[index];

  if (key === "images" && value) {
    pendingRemovals.value.images.push(value);
  }

  arr.splice(index, 1);
};

const onImageFilesDropped = async (event) => {
  const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
    file.type.startsWith("image/")
  );
  if (!files.length) return;

  console.log(
    "Files dropped:",
    files.map((f) => f.name)
  );
  addPendingFiles(files);
};

const onImageFilesSelected = async (event) => {
  const files = Array.from(event.target.files || event.target?.files || []);
  if (!files.length) return;

  console.log(
    "Files selected:",
    files.map((f) => f.name)
  );
  addPendingFiles(files);

  if (event.target) event.target.value = "";
};

const addPendingFiles = (files) => {
  files.forEach((file) => {
    const previewUrl = URL.createObjectURL(file);
    pendingFiles.value.push({ file, previewUrl });
  });
  console.log(
    "Pending files queue:",
    pendingFiles.value.map((p) => p.file.name)
  );
};

const submit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    // Normalize date/year for storage.
    // Store `date` as YYYY-MM-DD for predictable querying.
    // Keep `year` in sync for existing UI/sorts until the rest of the app migrates.
    const dateStr = (documentModel.value.data.date || "").toString().trim();
    if (dateStr) {
      // Basic guard: accept only YYYY-MM-DD
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr);
      if (m) {
        documentModel.value.data.date = dateStr;
        const yearNumber = Number(dateStr.slice(0, 4));
        if (!Number.isNaN(yearNumber)) documentModel.value.data.year = yearNumber;
      }
    } else {
      documentModel.value.data.date = null;
      // leave year as-is (may be set manually on older entries)
    }

    // Legacy: if year is set but date is missing, backfill an approximate date.
    if (!documentModel.value.data.date && documentModel.value.data.year) {
      const yearNumber = Number(documentModel.value.data.year);
      if (!Number.isNaN(yearNumber)) {
        documentModel.value.data.year = yearNumber;
        documentModel.value.data.date = `${yearNumber}-01-01`;
      }
    }

    if (
      documentModel.value.data.year !== null &&
      documentModel.value.data.year !== ""
    ) {
      const yearNumber = Number(documentModel.value.data.year);
      if (!Number.isNaN(yearNumber)) {
        documentModel.value.data.year = yearNumber;
      }
    }

    // Upload any pending files first
    if (pendingFiles.value.length) {
      const entryId = documentModel.value.id;
      if (!entryId) {
        alert("Please set an Id before uploading images.");
        isSubmitting.value = false;
        return;
      }

      const existingCount = Array.isArray(documentModel.value.data.images)
        ? documentModel.value.data.images.length
        : 0;

      try {
        const files = pendingFiles.value.map((p) => p.file);
        const uploaded = await firebaseStore.uploadProjectImages(
          entryId,
          files,
          existingCount
        );

        // Save as objects for robust delete/reorder.
        documentModel.value.data.images.push(...uploaded);
      } catch (e) {
        console.error("Failed to upload images", e);
        alert("Failed to upload one or more images. Please try again.");
        isSubmitting.value = false;
        return;
      }
    }

    ["images", "technology"].forEach((key) => {
      if (Array.isArray(documentModel.value.data[key])) {
        documentModel.value.data[key] = documentModel.value.data[key].filter(
          (v) => v !== null && v !== undefined && v !== ""
        );
      }
    });

    // Normalize + enforce caps before saving
    documentModel.value.data.featured = !!documentModel.value.data.featured;
    documentModel.value.data.summary = (documentModel.value.data.summary || "")
      .toString()
      .slice(0, SUMMARY_MAX);
    documentModel.value.data.description = (
      documentModel.value.data.description || ""
    )
      .toString()
      .slice(0, DESCRIPTION_MAX);

    if (isEdit.value) {
      const payload = documentModel.value;
      await firebaseStore.dataUpdateProjectDocument(payload);

      if (pendingRemovals.value.images.length) {
        await Promise.all(
          pendingRemovals.value.images.map((img) =>
            firebaseStore.deleteProjectImage(img)
          )
        );
        pendingRemovals.value.images = [];
      }

      if (settingsStore.projects && payload.id) {
        settingsStore.projects = {
          ...settingsStore.projects,
          [payload.id]: {
            ...(settingsStore.projects[payload.id] || {}),
            ...payload.data,
          },
        };

        try {
          await saveProjectsToCache(settingsStore.projects);
        } catch (e) {
          console.warn("Failed to update projects cache", e);
        }
      }
    } else {
      documentModel.value.data.order = settingsStore.projects
        ? Object.keys(settingsStore.projects).length + 1
        : 0;

      const payload = documentModel.value;
      const result = await firebaseStore.dataCreateProjectDocument(payload);

      const newId = (result && result.id) || payload.id;
      if (newId) {
        settingsStore.projects = {
          ...(settingsStore.projects || {}),
          [newId]: payload.data,
        };

        try {
          await saveProjectsToCache(settingsStore.projects);
        } catch (e) {
          console.warn("Failed to update projects cache", e);
        }
      }

      if (pendingRemovals.value.images.length) {
        try {
          await Promise.all(
            pendingRemovals.value.images.map((img) =>
              firebaseStore.deleteProjectImage(img)
            )
          );
        } catch (e) {
          console.error("Failed to delete one or more removed images", e);
        }
        pendingRemovals.value.images = [];
      }
    }

    console.log("Submit complete for entry:", documentModel.value.id);

    cancel();
  } finally {
    isSubmitting.value = false;
  }
};

const resetState = () => {
  documentModel.value = emptyDocument();
  isEdit.value = false;
  pendingRemovals.value.images = [];
  pendingRemovals.value.technology = [];

  pendingFiles.value.forEach(({ previewUrl }) => {
    URL.revokeObjectURL(previewUrl);
  });
  pendingFiles.value = [];

  isSubmitting.value = false;
};

const showModal = async (existingEntry) => {
  // Fresh state on open.
  resetState();
  pendingCloseCleanup.value = false;

  if (existingEntry) {
    isEdit.value = true;

    // Prefer `date`; fall back to existing `year`.
    const incomingDate = (existingEntry.date || "").toString().trim();
    const incomingYear = existingEntry.year ?? null;

    documentModel.value = {
      id: existingEntry.name,
      data: {
        order: existingEntry.order ?? 0,
        eyebrow: existingEntry.eyebrow ?? null,
        date: incomingDate
          ? incomingDate
          : incomingYear
            ? `${incomingYear}-01-01`
            : null,
        year: incomingYear ?? null,
        title: existingEntry.title ?? null,
        summary: existingEntry.summary ?? "",
        description: existingEntry.description ?? "",
        featured: existingEntry.featured ?? false,
        images: Array.isArray(existingEntry.images)
          ? [...existingEntry.images]
          : [],
        technology: Array.isArray(existingEntry.technology)
          ? [...existingEntry.technology]
          : [],
        url: existingEntry.url ?? null,
        hidden: existingEntry.hidden ?? false,
      },
    };
  }

  visible.value = true;
};

const cancel = () => {
  // Avoid double-close.
  if (!visible.value) return;

  // Start close animation; cleanup after the panel transition ends.
  pendingCloseCleanup.value = true;
  visible.value = false;
};

const dialogRef = ref(null);
const { activate: trapFocus, cleanup: cleanupFocusTrap } = useFocusTrap();

const titleId = `admin-upsert-title-${Math.random().toString(36).slice(2)}`;
const descId = `admin-upsert-desc-${Math.random().toString(36).slice(2)}`;

watch(
  visible,
  async (open) => {
    if (open) {
      // After open, trap focus inside the dialog wrapper and focus close button immediately
      await new Promise((r) => setTimeout(r, 0));
      const closeBtn = dialogRef.value?.querySelector?.('button[aria-label="Close"]');
      trapFocus({
        container: dialogRef.value,
        initialFocus: closeBtn || dialogRef.value,
      });
    } else {
      cleanupFocusTrap();
    }
  },
  { flush: "post", immediate: true },
);

onBeforeUnmount(() => {
  cleanupFocusTrap();
  resetState();
});

const techToAdd = ref("");

function normalizeTechnology(index) {
  const raw = (documentModel.value.data.technology?.[index] ?? "").toString();
  const normalized = raw.trim();

  // Remove empty pills.
  if (!normalized) {
    documentModel.value.data.technology.splice(index, 1);
    return;
  }

  // Deduplicate (case-insensitive) while keeping the current pill's casing.
  const lower = normalized.toLowerCase();
  const firstIndex = documentModel.value.data.technology.findIndex(
    (t, i) => i !== index && (t || "").toString().trim().toLowerCase() === lower,
  );

  if (firstIndex !== -1) {
    documentModel.value.data.technology.splice(index, 1);
    return;
  }

  documentModel.value.data.technology[index] = normalized;
}


function removeTechnology(index) {
  documentModel.value.data.technology.splice(index, 1);
}

function commitTechToAdd() {
  const normalized = techToAdd.value.trim();
  if (!normalized) return;

  // Avoid duplicates
  const lower = normalized.toLowerCase();
  const exists = documentModel.value.data.technology.some(
    (t) => (t || "").toString().trim().toLowerCase() === lower,
  );
  if (!exists) documentModel.value.data.technology.push(normalized);

  techToAdd.value = "";
}

defineExpose({
  showModal,
});

// Models for generated form fields
const formFields = computed(() => {
  // We use computed so it always reflects the current documentModel object.
  const data = documentModel.value.data;

  const summaryCounter = () => `${summaryCount.value}/${SUMMARY_MAX}`;
  const descriptionCounter = () => `${descriptionCount.value}/${DESCRIPTION_MAX}`;

  return [
    {
      key: "id",
      colSpan: "md:col-span-1",
      type: "input",
      label: "Project Id",
      placeholder: "unique-id",
      model: toRef(documentModel.value, "id"),
      disabled: () => isEdit.value,
    },
    {
      key: "date",
      colSpan: "md:col-span-1",
      type: "input",
      inputType: "date",
      label: "Date",
      model: toRef(data, "date"),
    },
    {
      key: "eyebrow",
      colSpan: "md:col-span-1",
      type: "input",
      label: "Company Name",
      placeholder: "Company",
      model: toRef(data, "eyebrow"),
    },
    {
      key: "title",
      colSpan: "md:col-span-1",
      type: "input",
      label: "Project Name",
      placeholder: "Project",
      model: toRef(data, "title"),
    },
    {
      key: "url",
      colSpan: "md:col-span-2",
      type: "input",
      inputType: "url",
      label: "Site URL",
      placeholder: "https://…",
      model: toRef(data, "url"),
    },
    {
      key: "featured",
      colSpan: "md:col-span-2",
      type: "toggle",
      label: "Featured",
      help: "Highlight this project in featured sections.",
      ariaLabel: "Toggle featured",
      model: toRef(data, "featured"),
    },
    {
      key: "summary",
      colSpan: "md:col-span-2",
      type: "textarea",
      label: "Summary",
      rows: 3,
      maxLength: SUMMARY_MAX,
      placeholder: "Short summary (max 200 characters)",
      counter: summaryCounter,
      model: toRef(data, "summary"),
    },
    {
      key: "description",
      colSpan: "md:col-span-2",
      type: "textarea",
      label: "Description",
      rows: 5,
      maxLength: DESCRIPTION_MAX,
      placeholder: "Description (max 500 characters)",
      counter: descriptionCounter,
      model: toRef(data, "description"),
    },
  ];
});

const SCROLL_LOCK_KEY = "__bc_scroll_lock_count__";

function getLockCount() {
  return Number(document.documentElement.dataset[SCROLL_LOCK_KEY] || 0);
}

function setLockCount(val) {
  document.documentElement.dataset[SCROLL_LOCK_KEY] = String(val);
}

function getScrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function lockBodyScroll() {
  const count = getLockCount();
  if (count === 0) {
    document.documentElement.dataset.__bc_prev_html_overflow__ =
      document.documentElement.style.overflow || "";
    document.documentElement.dataset.__bc_prev_html_padding_right__ =
      document.documentElement.style.paddingRight || "";
    document.body.dataset.__bc_prev_body_overflow__ =
      document.body.style.overflow || "";
    document.body.dataset.__bc_prev_body_padding_right__ =
      document.body.style.paddingRight || "";

    const sbw = getScrollbarWidth();

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (sbw > 0) {
      document.documentElement.style.paddingRight = `${sbw}px`;
      document.body.style.paddingRight = `${sbw}px`;
    }
  }
  setLockCount(count + 1);
}

function unlockBodyScroll() {
  const count = getLockCount();
  if (count <= 1) {
    document.documentElement.style.overflow =
      document.documentElement.dataset.__bc_prev_html_overflow__ || "";
    document.documentElement.style.paddingRight =
      document.documentElement.dataset.__bc_prev_html_padding_right__ || "";
    document.body.style.overflow =
      document.body.dataset.__bc_prev_body_overflow__ || "";
    document.body.style.paddingRight =
      document.body.dataset.__bc_prev_body_padding_right__ || "";

    delete document.documentElement.dataset.__bc_prev_html_overflow__;
    delete document.documentElement.dataset.__bc_prev_html_padding_right__;
    delete document.body.dataset.__bc_prev_body_overflow__;
    delete document.body.dataset.__bc_prev_body_padding_right__;

    setLockCount(0);
  } else {
    setLockCount(count - 1);
  }
}

watch(
  visible,
  (isOpen) => {
    if (isOpen) lockBodyScroll();
    else unlockBodyScroll();
  },
  { flush: "post" },
);

onBeforeUnmount(() => {
  unlockBodyScroll();
});
</script>

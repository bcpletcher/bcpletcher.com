<template>
  <ModalWrapper
    v-model="visible"
    :labelledby="titleId"
    :describedby="descId"
    z-class="z-9999"
    :initial-focus-selector="'button[aria-label=Close]'"
    panel-selector="[data-modal-panel]"
  >
    <div
      ref="dialogRef"
      data-modal-panel
      class="relative w-[92vw] max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-6"
      >
        <div class="flex flex-col">
          <p
            :id="titleId"
            class="text-xs font-semibold tracking-widest uppercase text-slate-400"
          >
            {{ isEdit ? "Edit Project" : "Create Project" }}
          </p>
          <p :id="descId" class="text-xs text-slate-500">
            {{
              isEdit
                ? "Update fields and save changes."
                : "Fill out fields and publish a new entry."
            }}
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
          <!-- BASICS -->
          <div class="rounded-xl border border-white/10 bg-black/10 p-4 md:p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class="text-xs font-semibold tracking-widest uppercase text-slate-300"
                >
                  Basics
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  Required fields used for sorting + display.
                </p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div
                v-for="field in formFields.filter((f) =>
                  [
                    'id',
                    'date',
                    'eyebrow',
                    'title',
                    'url',
                    'featured',
                  ].includes(f.key),
                )"
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

                  <div class="flex items-center gap-2">
                    <span
                      v-if="field.required"
                      class="text-[10px] font-semibold tracking-widest uppercase text-slate-500"
                    >
                      Required
                    </span>
                    <span v-if="field.counter" class="text-xs text-slate-500">
                      {{ field.counter() }}
                    </span>
                  </div>
                </div>

                <!-- Toggle field -->
                <div v-else class="flex h-full justify-between gap-4">
                  <div>
                    <label
                      class="block text-xs font-semibold tracking-widest uppercase text-slate-400"
                    >
                      {{ field.label }}
                    </label>
                    <p v-if="field.help" class="mt-5 text-xs text-slate-500">
                      {{ field.help }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="kbd-focus mt-auto cursor-pointer relative inline-flex h-7 w-12 items-center rounded-full border transition-standard focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
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
                  :class="inputClassFor(field.key)"
                  @input="clearError(field.key)"
                  @blur="clearError(field.key)"
                />

                <!-- Textarea -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="field.model.value"
                  :disabled="isSubmitting || field.disabled?.()"
                  :rows="field.rows || 3"
                  :maxlength="field.maxLength"
                  :placeholder="field.placeholder"
                  :class="inputClassFor(field.key)"
                  @input="clearError(field.key)"
                  @blur="clearError(field.key)"
                />

<!--                <p v-if="hasError(field.key)" class="mt-1 text-xs text-red-300">-->
<!--                  {{ errorMessage(field.key) }}-->
<!--                </p>-->
              </div>

              <div class="md:col-span-1">
                <div class="flex items-center justify-between">
                  <label
                    class="block text-xs font-semibold tracking-widest uppercase text-slate-400"
                  >
                    Meta
                  </label>
                </div>

                <select
                  v-model="selectedMetaIconClass"
                  :disabled="isSubmitting"
                  :class="inputClassFor('meta')"
                  @change="onMetaPresetChange"
                  @blur="clearError('meta')"
                >
                  <option value="">None</option>
                  <option
                    v-for="opt in metaIconOptions"
                    :key="opt.iconClass"
                    :value="opt.iconClass"
                  >
                    {{ opt.label }}
                  </option>
                </select>

                <div
                  v-if="documentModel.data.meta?.label && documentModel.data.meta?.iconClass"
                  class="mt-2 flex items-center gap-2 text-xs text-slate-400"
                >
                  <i :class="documentModel.data.meta.iconClass" aria-hidden="true" />
                  <span>{{ documentModel.data.meta.label }}</span>
                </div>

<!--                <p v-if="hasError('meta')" class="mt-1 text-xs text-red-300">-->
<!--                  {{ errorMessage('meta') }}-->
<!--                </p>-->
              </div>
            </div>
          </div>

          <!-- CONTENT -->
          <div
            class="mt-4 rounded-xl border border-white/10 bg-black/10 p-4 md:p-5"
          >
            <p
              class="text-xs font-semibold tracking-widest uppercase text-slate-300"
            >
              Content
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Copy that shows up on cards and detail views.
            </p>

            <div class="mt-4 grid grid-cols-1 gap-4">
              <div
                v-for="field in formFields.filter((f) =>
                  ['summary', 'description'].includes(f.key),
                )"
                :key="field.key"
                :class="field.colSpan"
              >
                <div class="flex items-center justify-between">
                  <label
                    class="block text-xs font-semibold tracking-widest uppercase text-slate-400"
                  >
                    {{ field.label }}
                  </label>
                  <div class="flex items-center gap-2">
                    <span
                      v-if="field.required"
                      class="text-[10px] font-semibold tracking-widest uppercase text-slate-500"
                    >
                      Required
                    </span>
                    <span v-if="field.counter" class="text-xs text-slate-500">{{
                      field.counter()
                    }}</span>
                  </div>
                </div>

                <textarea
                  v-model="field.model.value"
                  :disabled="isSubmitting || field.disabled?.()"
                  :rows="field.rows || 3"
                  :maxlength="field.maxLength"
                  :placeholder="field.placeholder"
                  :class="inputClassFor(field.key)"
                  @input="clearError(field.key)"
                  @blur="clearError(field.key)"
                />

<!--                <p v-if="hasError(field.key)" class="mt-1 text-xs text-red-300">-->
<!--                  {{ errorMessage(field.key) }}-->
<!--                </p>-->
              </div>
            </div>
          </div>

          <!-- TECHNOLOGY -->
          <div
            class="mt-4 rounded-xl border border-white/10 bg-black/10 p-4 md:p-5"
          >
            <p
              class="text-xs font-semibold tracking-widest uppercase text-slate-300"
            >
              Technology
            </p>
            <p class="mt-1 text-xs text-slate-500">Auto-sorted A–Z.</p>

            <!-- Technology block (existing) -->
            <div class="mt-6">
              <!-- Title + add row (inline) -->
              <div
                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p
                  class="text-xs font-semibold tracking-widest uppercase text-slate-400"
                >
                  Technology
                </p>

                <div class="w-full sm:max-w-md">
                  <label class="sr-only" for="tech-add">Add technology</label>
                  <div class="flex gap-2 justify-end">
                    <input
                      id="tech-add"
                      v-model="techToAdd"
                      :disabled="isSubmitting"
                      type="text"
                      placeholder="Add a technology"
                      class="max-w-sm rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
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

              <!-- TECHNOLOGY pills list (below) -->
              <div class="mt-3 flex flex-wrap gap-2">
                <div
                  v-for="item in sortedTechnology"
                  :key="`tech-${item.originalIndex}`"
                  class="group relative flex items-center gap-2 rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium leading-5 text-sky-300"
                >
                  <span class="text-xs font-medium leading-5">{{ item.value }}</span>

                  <button
                    type="button"
                    class="kbd-focus cursor-pointer inline-flex h-5 w-5 items-center justify-center rounded-full text-sky-300/80 hover:text-red-200 hover:bg-white/10 transition-standard"
                    :disabled="isSubmitting"
                    aria-label="Remove technology"
                    @click="removeTechnology(item.originalIndex)"
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

          <!-- MEDIA -->
          <div
            class="mt-4 rounded-xl border border-white/10 bg-black/10 p-4 md:p-5"
          >
            <p
              class="text-xs font-semibold tracking-widest uppercase text-slate-300"
            >
              Media
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Upload, reorder, and pick a hero image.
            </p>

            <!-- Images block (existing) -->
            <div class="mt-6">
              <div class="flex items-center justify-between">
                <p
                  class="text-xs font-semibold tracking-widest uppercase text-slate-400"
                >
                  Images
                </p>
                <p class="text-xs text-slate-500">
                  Drag to reorder. Star sets the hero.
                </p>
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
                  Drag & drop images here, or
                  <span class="text-sky-300">click to browse</span>
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
                        index === 0 ? 'fa-solid fa-star' : 'fa-regular fa-star'
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

                  <!-- Remove pending file -->
                  <button
                    type="button"
                    class="absolute top-2 right-2 pointer-events-auto w-8 h-8 flex items-center justify-center text-red-300 bg-black/70 rounded-full transition-standard opacity-100"
                    aria-label="Remove pending image"
                    @click.stop="removePendingFile(pIndex)"
                  >
                    <i class="fa-regular fa-minus" aria-hidden="true" />
                  </button>
                </div>
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
  </ModalWrapper>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch, toRef } from "vue";
import { VueDraggableNext } from "vue-draggable-next";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useNotificationStore } from "@/stores/notification.js";
import { saveProjectsToCache } from "@/utils/cache.js";
import { normalizeProjectDate } from "@/utils/projectDate.js";
import { PROJECT_META_ICON_OPTIONS } from "@/constants/projectMetaIconOptions.js";
import ModalWrapper from "@/components/shared/modal-wrapper.vue";

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
const notificationStore = useNotificationStore();
const visible = ref(false);
const isEdit = ref(false);
const isSubmitting = ref(false);

const DESCRIPTION_MAX = 500;
const SUMMARY_MAX = 200;

const emptyDocument = () => ({
  id: null,
  data: {
    eyebrow: null,
    date: null,
    title: null,
    summary: "",
    description: "",
    featured: false,
    images: [],
    technology: [],
    url: null,
    hidden: false,
    meta: null,
  },
});

const documentModel = ref(emptyDocument());

const summaryCount = computed(
  () => (documentModel.value.data.summary || "").length,
);
const descriptionCount = computed(
  () => (documentModel.value.data.description || "").length,
);

const sortedTechnology = computed(() => {
  const arr = Array.isArray(documentModel.value.data.technology)
    ? documentModel.value.data.technology
    : [];

  return arr
    .map((value, originalIndex) => ({ value, originalIndex }))
    .sort((a, b) =>
      (a.value || "")
        .toString()
        .trim()
        .toLowerCase()
        .localeCompare((b.value || "").toString().trim().toLowerCase()),
    );
});

// Enforce max lengths even if data is pasted or older entries have longer content.
watch(
  () => documentModel.value.data.summary,
  (val) => {
    if (typeof val !== "string") return;
    if (val.length > SUMMARY_MAX) {
      documentModel.value.data.summary = val.slice(0, SUMMARY_MAX);
    }
  },
);
watch(
  () => documentModel.value.data.description,
  (val) => {
    if (typeof val !== "string") return;
    if (val.length > DESCRIPTION_MAX) {
      documentModel.value.data.description = val.slice(0, DESCRIPTION_MAX);
    }
  },
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
  // If url isn't stored, derive it from path (public alt=media)
  if (typeof item === "object" && item.path) {
    const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(item.path)}?alt=media`;
  }
  return "";
}

function getImageKey(item, index) {
  if (typeof item === "string") return `img-url-${item}`;
  if (item && typeof item === "object" && item.path)
    return `img-path-${item.path}`;
  if (item && typeof item === "object" && item.url)
    return `img-url-${item.url}`;
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
    file.type.startsWith("image/"),
  );
  if (!files.length) return;

  console.log(
    "Files dropped:",
    files.map((f) => f.name),
  );
  addPendingFiles(files);
};

const onImageFilesSelected = async (event) => {
  const files = Array.from(event.target.files || event.target?.files || []);
  if (!files.length) return;

  console.log(
    "Files selected:",
    files.map((f) => f.name),
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
    pendingFiles.value.map((p) => p.file.name),
  );
};

const errors = ref({});

function clearError(key) {
  if (!errors.value?.[key]) return;
  const next = { ...(errors.value || {}) };
  delete next[key];
  errors.value = next;
}

function hasError(key) {
  return Boolean(errors.value?.[key]);
}

// function errorMessage(key) {
//   return errors.value?.[key] || "";
// }

const inputBaseClass =
  "mt-2 w-full rounded-lg border bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed";

function inputClassFor(key) {
  return hasError(key)
    ? `${inputBaseClass} border-red-300/60 focus:ring-red-300/30`
    : `${inputBaseClass} border-white/10 focus:ring-sky-300/40`;
}

function validateBeforeSubmit() {
  const nextErrors = {};

  // Project Id required (create only)
  if (!isEdit.value) {
    const id = (documentModel.value.id ?? "").toString().trim();
    if (!id) nextErrors.id = "Project Id is required.";
  }

  // Date required + valid
  const dateRaw = (documentModel.value.data.date ?? "").toString().trim();
  if (!dateRaw) {
    nextErrors.date = "Date is required.";
  } else {
    const normalized = normalizeProjectDate(dateRaw);
    if (!normalized) nextErrors.date = "Enter a valid date.";
  }

  // Company required
  const company = (documentModel.value.data.eyebrow ?? "").toString().trim();
  if (!company) nextErrors.eyebrow = "Company name is required.";

  // Project name required
  const title = (documentModel.value.data.title ?? "").toString().trim();
  if (!title) nextErrors.title = "Project name is required.";

  // Summary required
  const summary = (documentModel.value.data.summary ?? "").toString().trim();
  if (!summary) nextErrors.summary = "Summary is required.";

  // Description required
  const description = (documentModel.value.data.description ?? "")
    .toString()
    .trim();
  if (!description) nextErrors.description = "Description is required.";

  // Meta: nothing to validate beyond preset selection; normalize it.
  normalizeMetaInPlace();

  errors.value = nextErrors;

  if (Object.keys(nextErrors).length) {
    notificationStore.addNotification({
      variant: "danger",
      title: "Fix validation",
      message: "Please correct the highlighted fields and try again.",
      duration: 6,
    });
    return false;
  }

  return true;
}

const metaIconOptions = PROJECT_META_ICON_OPTIONS;

function resetState() {
  documentModel.value = emptyDocument();
  isEdit.value = false;
  pendingRemovals.value.images = [];
  pendingRemovals.value.technology = [];
  selectedMetaIconClass.value = "";

  pendingFiles.value.forEach(({ previewUrl }) => {
    URL.revokeObjectURL(previewUrl);
  });
  pendingFiles.value = [];

  errors.value = {};
  isSubmitting.value = false;
}

const showModal = async (existingEntry) => {
  // Fresh state on open.
  resetState();

  if (existingEntry) {
    isEdit.value = true;

    const incomingDate = (existingEntry.date || "").toString().trim();

    documentModel.value = {
      id: existingEntry.name,
      data: {
        eyebrow: existingEntry.eyebrow ?? null,
        date: incomingDate || null,
        title: existingEntry.title ?? null,
        summary: existingEntry.summary ?? "",
        description: existingEntry.description ?? "",
        featured: existingEntry.featured ?? false,
        images: Array.isArray(existingEntry.images)
          ? existingEntry.images
              .map((img) =>
                img && typeof img === "object" && img.path
                  ? { path: img.path }
                  : null,
              )
              .filter(Boolean)
          : [],
        technology: Array.isArray(existingEntry.technology)
          ? [...existingEntry.technology]
          : [],
        url: existingEntry.url ?? null,
        hidden: existingEntry.hidden ?? false,
        meta: existingEntry.meta ?? null,
      },
    };
  }

  normalizeAllTechnology();
  normalizeMetaInPlace();

  // Keep the select in sync with the normalized meta
  selectedMetaIconClass.value = documentModel.value.data.meta?.iconClass || "";

  visible.value = true;
};

const cancel = () => {
  // Avoid double-close.
  if (!visible.value) return;

  // Start close animation; cleanup after the panel transition ends.
  visible.value = false;
};

const titleId = `admin-upsert-title-${Math.random().toString(36).slice(2)}`;
const descId = `admin-upsert-desc-${Math.random().toString(36).slice(2)}`;

onBeforeUnmount(() => {
  resetState();
});

const techToAdd = ref("");

function sortTechnologyInPlace() {
  if (!Array.isArray(documentModel.value.data.technology)) {
    documentModel.value.data.technology = [];
    return;
  }

  documentModel.value.data.technology = [
    ...documentModel.value.data.technology,
  ].sort((a, b) =>
    (a || "")
      .toString()
      .trim()
      .toLowerCase()
      .localeCompare((b || "").toString().trim().toLowerCase()),
  );
}

function normalizeAllTechnology() {
  if (!Array.isArray(documentModel.value.data.technology)) {
    documentModel.value.data.technology = [];
    return;
  }

  // Trim, drop empties, dedupe case-insistently (keep first casing), then sort.
  const seen = new Set();
  const normalized = [];

  for (const raw of documentModel.value.data.technology) {
    const t = (raw ?? "").toString().trim();
    if (!t) continue;

    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(t);
  }

  documentModel.value.data.technology = normalized.sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
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

  // Keep list ordered.
  sortTechnologyInPlace();

  techToAdd.value = "";
}

const selectedMetaIconClass = ref("");

function applyMetaPresetByIconClass(iconClass) {
  const normalized = (iconClass ?? "").toString().trim();
  if (!normalized) {
    delete documentModel.value.data.meta;
    selectedMetaIconClass.value = "";
    return;
  }

  const preset = (metaIconOptions || []).find(
    (o) => o.iconClass === normalized,
  );
  if (!preset) {
    // Shouldn't happen via the select, but keep it safe.
    errors.value = {
      ...(errors.value || {}),
      meta: "Please select a valid meta option.",
    };
    notificationStore.addNotification({
      variant: "danger",
      title: "Invalid meta",
      message: "Please select a valid meta option.",
      duration: 5,
    });
    return;
  }

  documentModel.value.data.meta = {
    label: preset.label,
    iconClass: preset.iconClass,
  };
  selectedMetaIconClass.value = preset.iconClass;
  clearError("meta");
}

function onMetaPresetChange() {
  applyMetaPresetByIconClass(selectedMetaIconClass.value);
}

function normalizeMetaInPlace() {
  // Back-compat: existing entries may have { text, iconClass }. Convert if possible.
  const meta = documentModel.value.data.meta;
  if (!meta) {
    return;
  }

  // New format
  if (typeof meta === "object" && meta.label && meta.iconClass) {
    const iconClass = (meta.iconClass ?? "").toString().trim();
    const label = (meta.label ?? "").toString().trim();
    if (!iconClass || !label) {
      delete documentModel.value.data.meta;
      selectedMetaIconClass.value = "";
      return;
    }

    // Sanitize
    const cleanIcon = iconClass.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();
    documentModel.value.data.meta = { label, iconClass: cleanIcon };
    selectedMetaIconClass.value = cleanIcon;
    return;
  }

  // Old format -> attempt to map to preset by iconClass, else drop.
  const legacyIcon = (meta?.iconClass ?? "").toString().trim();
  if (legacyIcon) {
    const preset = (metaIconOptions || []).find(
      (o) => o.iconClass === legacyIcon,
    );
    if (preset) {
      documentModel.value.data.meta = {
        label: preset.label,
        iconClass: preset.iconClass,
      };
      selectedMetaIconClass.value = preset.iconClass;
      return;
    }
  }

  delete documentModel.value.data.meta;
  selectedMetaIconClass.value = "";
}

defineExpose({
  showModal,
});

// Models for generated form fields
const formFields = computed(() => {
  // We use computed so it always reflects the current documentModel object.
  const data = documentModel.value.data;

  const summaryCounter = () => `${summaryCount.value}/${SUMMARY_MAX}`;
  const descriptionCounter = () =>
    `${descriptionCount.value}/${DESCRIPTION_MAX}`;

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
      required: true,
      help: "Required. Used for sorting + timeline grouping.",
    },
    {
      key: "eyebrow",
      colSpan: "md:col-span-1",
      type: "input",
      label: "Company Name",
      placeholder: "Company",
      model: toRef(data, "eyebrow"),
      required: true,
    },
    {
      key: "title",
      colSpan: "md:col-span-1",
      type: "input",
      label: "Project Name",
      placeholder: "Project",
      model: toRef(data, "title"),
      required: true,
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
      colSpan: "md:col-span-1",
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
      required: true,
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
      required: true,
    },
  ];
});

const submit = async () => {
  if (isSubmitting.value) return;

  if (!validateBeforeSubmit()) return;

  isSubmitting.value = true;

  try {
    // Ensure technology is consistently normalized/sorted before persisting.
    normalizeAllTechnology();

    // Normalize date for storage.
    documentModel.value.data.date = normalizeProjectDate(
      documentModel.value.data.date,
    );

    // Delete removed images first.
    if (pendingRemovals.value.images.length) {
      try {
        await Promise.all(
          pendingRemovals.value.images.map((img) =>
            firebaseStore.deleteProjectImage(img),
          ),
        );
      } catch (e) {
        console.error("Failed to delete removed images", e);
        notificationStore.addNotification({
          variant: "danger",
          title: "Image delete failed",
          message:
            "Failed to delete one or more removed images. Please try again.",
          duration: 6,
        });
        return;
      } finally {
        pendingRemovals.value.images = [];
      }
    }

    // Upload pending files (requires id)
    if (pendingFiles.value.length) {
      const entryId = (documentModel.value.id ?? "").toString().trim();
      if (!entryId) {
        errors.value = {
          ...(errors.value || {}),
          id: "Project Id is required.",
        };
        notificationStore.addNotification({
          variant: "danger",
          title: "Missing Project Id",
          message: "Set a Project Id before uploading images.",
          duration: 6,
        });
        return;
      }

      try {
        const files = pendingFiles.value.map((p) => p.file);
        const uploaded = await firebaseStore.uploadProjectImages(
          entryId,
          files,
        );
        documentModel.value.data.images.push(
          ...uploaded.map((u) => ({ path: u.path })),
        );

        pendingFiles.value.forEach(({ previewUrl }) => {
          try {
            URL.revokeObjectURL(previewUrl);
          } catch {
            // no-op
          }
        });
        pendingFiles.value = [];
      } catch (e) {
        console.error("Upload failed", e);
        notificationStore.addNotification({
          variant: "danger",
          title: "Upload failed",
          message: "Failed to upload one or more images. Please try again.",
          duration: 6,
        });
        return;
      }
    }

    // Canonical images: path-only objects
    documentModel.value.data.images = (documentModel.value.data.images || [])
      .filter(Boolean)
      .map((img) =>
        img && typeof img === "object" && img.path ? { path: img.path } : null,
      )
      .filter(Boolean);

    // Normalize meta (preset-only)
    normalizeMetaInPlace();
    if (
      !documentModel.value.data.meta?.label ||
      !documentModel.value.data.meta?.iconClass
    ) {
      delete documentModel.value.data.meta;
    }

    // Persist
    if (isEdit.value) {
      await firebaseStore.dataUpdateProjectDocument(documentModel.value);
    } else {
      await firebaseStore.dataCreateProjectDocument(documentModel.value);
    }

    // Update local projects cache
    if (documentModel.value.id) {
      settingsStore.projects = {
        ...(settingsStore.projects || {}),
        [documentModel.value.id]: {
          ...(settingsStore.projects?.[documentModel.value.id] || {}),
          ...documentModel.value.data,
        },
      };

      try {
        await saveProjectsToCache(settingsStore.projects);
      } catch (e) {
        console.warn("Failed to update projects cache", e);
      }
    }

    notificationStore.addNotification({
      variant: "success",
      title: isEdit.value ? "Project updated" : "Project created",
      message:
        documentModel.value.data.title || documentModel.value.id || "Saved",
      duration: 4,
    });

    cancel();
  } catch (e) {
    console.error("Submit error:", e);
    notificationStore.addNotification({
      variant: "danger",
      title: "Save failed",
      message: "An error occurred while saving. Please try again.",
      duration: 6,
    });
  } finally {
    isSubmitting.value = false;
  }
};

function removeTechnology(index) {
  documentModel.value.data.technology.splice(index, 1);
}

function removePendingFile(index) {
  const item = pendingFiles.value?.[index];
  if (!item) return;

  try {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  } catch {
    // no-op
  }

  pendingFiles.value.splice(index, 1);
}
</script>

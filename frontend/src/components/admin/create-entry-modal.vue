<template>
  <Modal
    :visible="visible"
    :title="isEdit ? 'Edit Entry' : 'Create Entry'"
    @close="visible = false"
  >
    <div
      class="flex flex-col gap-2 max-h-[70vh] pr-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gradient-start scrollbar-track-black/30"
    >
      <tw-input-group
        :value="documentModel.id"
        label="Id"
        :disabled="isEdit"
        @update-value="documentModel.id = $event"
      />
      <tw-input-group
        :value="documentModel.data.year"
        label="Year"
        type="number"
        @update-value="documentModel.data.year = $event"
      />
      <tw-input-group
        :value="documentModel.data.eyebrow"
        label="Company Name"
        @update-value="documentModel.data.eyebrow = $event"
      />
      <tw-input-group
        :value="documentModel.data.title"
        label="Project Name"
        @update-value="documentModel.data.title = $event"
      />

      <!-- Featured toggle -->
      <div class="py-1">
        <label class="block text-sm text-font-primary leading-none"
          >Featured</label
        >
        <div class="mt-1 flex items-center gap-3">
          <input
            v-model="documentModel.data.featured"
            type="checkbox"
            class="h-4 w-4 rounded border border-border bg-gray-800"
            :disabled="isSubmitting"
          />
          <span class="text-sm text-font-primary/70">
            Mark this entry as featured
          </span>
        </div>
      </div>

      <!-- Summary (max 200) -->
      <div class="py-1">
        <div class="flex items-center justify-between">
          <label class="block text-sm text-font-primary leading-none"
            >Summary</label
          >
          <span class="text-xs text-font-primary/60">
            {{ summaryCount }}/200
          </span>
        </div>
        <textarea
          v-model="documentModel.data.summary"
          class="mt-1 w-full rounded-md border border-border bg-gray-800 text-white text-sm px-2 py-2 focus-ring-offset-primary ring-offset-primary"
          rows="3"
          maxlength="200"
          :disabled="isSubmitting"
          placeholder="Short summary (max 200 characters)"
        />
        <p class="mt-1 text-xs text-font-primary/60">Max 200 characters.</p>
      </div>

      <!-- Description (max 500) -->
      <div class="py-1">
        <div class="flex items-center justify-between">
          <label class="block text-sm text-font-primary leading-none"
            >Description</label
          >
          <span class="text-xs text-font-primary/60">
            {{ descriptionCount }}/500
          </span>
        </div>
        <textarea
          v-model="documentModel.data.description"
          class="mt-1 w-full rounded-md border border-border bg-gray-800 text-white text-sm px-2 py-2 focus-ring-offset-primary ring-offset-primary"
          rows="5"
          maxlength="500"
          :disabled="isSubmitting"
          placeholder="Description (max 500 characters)"
        />
        <p class="mt-1 text-xs text-font-primary/60">Max 500 characters.</p>
      </div>

      <tw-input-group
        :value="documentModel.data.url"
        label="Site URL"
        @update-value="documentModel.data.url = $event"
      />

      <div class="flex flex-col">
        <div class="flex justify-between py-1">
          <label class="my-auto">Images</label>
        </div>

        <div
          class="mb-2 border-2 border-dashed border-font-primary/40 rounded-lg bg-black/20 hover:border-gradient-start hover:bg-gradient-start/10 transition-standard cursor-pointer flex flex-col items-center justify-center px-4 py-4 text-center"
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
          <p class="text-sm text-font-primary mb-1">
            Drag & drop images here, or
            <span class="text-gradient-start">click to browse</span>
          </p>
          <p class="text-xs text-font-primary/60">
            (1080x1920 .webp recommended)
          </p>
        </div>

        <VueDraggableNext
          v-model="documentModel.data.images"
          :disabled="documentModel.data.images.length < 2 || isSubmitting"
          class="grid grid-cols-3 gap-4"
        >
          <div
            v-for="(item, index) in documentModel.data.images"
            :key="`committed-${index}`"
            class="relative group cursor-move rounded-lg overflow-hidden bg-black/20"
          >
            <div
              class="w-full aspect-video flex-shrink-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 group-hover:opacity-60"
            >
              <img
                :src="item"
                alt="Preview"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Featured star: always visible when active, hover-only when inactive -->
            <button
              class="absolute top-2 left-2 pointer-events-auto w-7 h-7 flex items-center justify-center bg-black/70 rounded-full transition-opacity duration-200"
              :class="[
                documentModel.data.hero === item
                  ? 'text-yellow-400 opacity-100'
                  : 'text-white opacity-0 group-hover:opacity-100',
              ]"
              type="button"
              @click.stop="setHeroImage(item)"
            >
              <i
                :class="
                  documentModel.data.hero === item
                    ? 'fa-solid fa-star'
                    : 'fa-regular fa-star'
                "
              ></i>
            </button>

            <!-- Delete: hover-only -->
            <button
              class="absolute top-2 right-2 pointer-events-auto w-7 h-7 flex flex-col justify-center text-red-500 bg-black/70 rounded-full transition-standard flex-shrink-0 opacity-0 group-hover:opacity-100"
              type="button"
              @click.stop="queueRemoval(index, 'images')"
            >
              <i class="far fa-minus mx-auto text-xl"></i>
            </button>
          </div>
        </VueDraggableNext>

        <!-- Pending (not yet uploaded) image previews -->
        <div
          v-if="!isSubmitting && pendingFiles.length"
          class="grid grid-cols-3 gap-4 mt-2 opacity-80"
        >
          <div
            v-for="(pending, pIndex) in pendingFiles"
            :key="`pending-${pIndex}`"
            class="relative rounded-lg overflow-hidden bg-black/20"
          >
            <div
              class="w-full aspect-video bg-black/30 flex items-center justify-center"
            >
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

      <div class="flex flex-col">
        <div class="flex justify-between py-1">
          <label class="my-auto">Technology</label>
          <button
            class="rounded-full w-6 h-6 border-2 border-font-primary flex flex-col justify-center hover:border-gradient-start hover:text-gradient-start transition-standard"
            @click="documentModel.data.technology.push(null)"
          >
            <i class="far fa-plus mx-auto"></i>
          </button>
        </div>

        <div
          v-for="(item, index) in documentModel.data.technology"
          :key="index"
          class="flex gap-2"
        >
          <tw-input-group
            :value="item"
            class="flex-1"
            @update-value="documentModel.data.technology[index] = $event"
          />
          <button
            class="w-6 flex flex-col justify-center text-red-500 transition-standard my-auto pt-1"
            @click="removeImage(index, 'technology')"
          >
            <i class="far fa-minus mx-auto text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-4">
        <button class="btn-secondary" :disabled="isSubmitting" @click="cancel">
          Cancel
        </button>
        <button class="btn-primary" :disabled="isSubmitting" @click="submit">
          <span v-if="isSubmitting">
            {{ isEdit ? "Updating..." : "Submitting..." }}
          </span>
          <span v-else>{{ isEdit ? "Update" : "Submit" }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>
<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Modal from "@/components/shared/modal.vue";
import TwInputGroup from "@/components/shared/tw-input-group.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { VueDraggableNext } from "vue-draggable-next";
import { saveScrapbookToCache } from "@/utils/cache.js";

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
const visible = ref(false);
const isEdit = ref(false);
const isSubmitting = ref(false);

const DESCRIPTION_MAX = 500;
const SUMMARY_MAX = 200;

const emptyDocument = () => ({
  id: null,
  data: {
    order: 0,
    eyebrow: null,
    year: null,
    title: null,
    summary: "",
    description: "",
    featured: false,
    hero: null,
    images: [], // committed image URLs only
    technology: [],
    url: null,
    deleted: false,
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

const setHeroImage = (url) => {
  // If this image is already the hero, do nothing (don't allow unselecting)
  if (documentModel.value.data.hero === url) return;

  documentModel.value.data.hero = url;

  const images = documentModel.value.data.images;
  const index = images.indexOf(url);
  if (index > 0) {
    images.splice(index, 1);
    images.unshift(url);
  }
};

const queueRemoval = (index, key) => {
  const arr = documentModel.value.data[key];
  const value = arr[index];

  if (key === "images" && value) {
    pendingRemovals.value.images.push(value);
    if (documentModel.value.data.hero === value) {
      documentModel.value.data.hero = null;
    }
  }

  arr.splice(index, 1);
};

// removeImage is no longer used in the template; keep a simple helper for non-image lists if needed
const removeImage = (index, key) => {
  documentModel.value.data[key].splice(index, 1);
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
        const urls = await firebaseStore.uploadScrapbookImages(
          entryId,
          files,
          existingCount
        );
        documentModel.value.data.images.push(...urls);
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
      await firebaseStore.dataUpdateScrapbookDocument(payload);

      if (pendingRemovals.value.images.length) {
        await Promise.all(
          pendingRemovals.value.images.map((url) =>
            firebaseStore.deleteScrapbookImageByUrl(url)
          )
        );
        pendingRemovals.value.images = [];
      }

      if (settingsStore.scrapbook && payload.id) {
        settingsStore.scrapbook = {
          ...settingsStore.scrapbook,
          [payload.id]: {
            ...(settingsStore.scrapbook[payload.id] || {}),
            ...payload.data,
          },
        };

        try {
          const { featured } = await saveScrapbookToCache(
            settingsStore.scrapbook
          );
          settingsStore.featuredScrapbook = featured;
        } catch (e) {
          console.warn("Failed to update scrapbook cache", e);
        }
      }
    } else {
      documentModel.value.data.order = settingsStore.scrapbook
        ? Object.keys(settingsStore.scrapbook).length + 1
        : 0;

      const payload = documentModel.value;
      const result = await firebaseStore.dataCreateScrapbookDocument(payload);

      const newId = (result && result.id) || payload.id;
      if (newId) {
        settingsStore.scrapbook = {
          ...(settingsStore.scrapbook || {}),
          [newId]: payload.data,
        };

        try {
          const { featured } = await saveScrapbookToCache(
            settingsStore.scrapbook
          );
          settingsStore.featuredScrapbook = featured;
        } catch (e) {
          console.warn("Failed to update scrapbook cache", e);
        }
      }

      if (pendingRemovals.value.images.length) {
        try {
          await Promise.all(
            pendingRemovals.value.images.map((url) =>
              firebaseStore.deleteScrapbookImageByUrl(url)
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
  resetState();

  if (existingEntry) {
    isEdit.value = true;
    documentModel.value = {
      id: existingEntry.name,
      data: {
        order: existingEntry.order ?? 0,
        eyebrow: existingEntry.eyebrow ?? null,
        year: existingEntry.year ?? null,
        title: existingEntry.title ?? null,
        summary: existingEntry.summary ?? "",
        description: existingEntry.description ?? "",
        featured: existingEntry.featured ?? false,
        hero: existingEntry.hero ?? null,
        images: Array.isArray(existingEntry.images)
          ? [...existingEntry.images]
          : [],
        technology: Array.isArray(existingEntry.technology)
          ? [...existingEntry.technology]
          : [],
        url: existingEntry.url ?? null,
        deleted: existingEntry.deleted ?? false,
      },
    };
  }

  visible.value = true;
};

const cancel = () => {
  visible.value = false;
  resetState();
};

onBeforeUnmount(() => {
  resetState();
});

defineExpose({
  showModal,
});
</script>

<template>
  <div
    v-if="show"
    class="absolute top-0 right-0 lg:right-auto lg:top-unset lg:left-0 lg:top-0 lg:-translate-x-full lg:pr-3 z-30"
  >
    <div
      class="flex lg:flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/70 backdrop-blur px-2 py-2 shadow-lg"
    >
      <button
        type="button"
        class="kbd-focus cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-sky-300 transition-standard"
        aria-label="Edit project"
        @click.stop="handleEdit"
      >
        <i class="fa-light fa-pen-to-square" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="kbd-focus cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-standard"
        :class="
          isHidden
            ? 'text-amber-200 hover:text-amber-100 hover:bg-amber-400/10'
            : 'text-slate-200 hover:text-amber-200 hover:bg-white/10'
        "
        :aria-label="isHidden ? 'Unhide project' : 'Hide project'"
        @click.stop="handleToggleHidden"
      >
        <i
          :class="isHidden ? 'fa-light fa-eye' : 'fa-light fa-eye-slash'"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useNotificationStore } from "@/stores/notification.js";
import { useSettingsStore } from "@/stores/settings.js";
import { saveProjectsToCache } from "@/utils/cache.js";

const props = defineProps({
  show: { type: Boolean, default: false },

  // Needed for store/cache updates
  projectId: { type: String, required: true },

  // Optional: parent can hand in the computed hidden value
  isHidden: { type: Boolean, default: false },

  // Optional: parent can provide a handler to open the edit modal.
  // This avoids emitting and keeps the control self-contained.
  onEdit: { type: Function, default: null },
});

const settingsStore = useSettingsStore();
const firebaseStore = useFirebaseStore();
const notificationStore = useNotificationStore();

const isAdmin = computed(() => settingsStore.isAdminView);

function handleEdit() {
  if (!isAdmin.value) return;
  if (typeof props.onEdit === "function") {
    props.onEdit(props.projectId);
  }
}

async function handleToggleHidden() {
  if (!isAdmin.value) {
    notificationStore.addNotification({
      variant: "danger",
      title: "Projects",
      message: "You must be signed in to hide projects.",
      duration: 4,
    });
    return;
  }

  const current = settingsStore.projects?.[props.projectId];
  if (!current) return;

  const nextHidden = !current.hidden;
  const payload = {
    id: props.projectId,
    data: {
      ...current,
      hidden: nextHidden,
    },
  };

  try {
    await firebaseStore.dataUpdateProjectDocument(payload);

    settingsStore.projects = {
      ...(settingsStore.projects || {}),
      [props.projectId]: payload.data,
    };

    try {
      await saveProjectsToCache(settingsStore.projects);
    } catch (e) {
      console.warn("Failed to update projects cache", e);
    }

    notificationStore.addNotification({
      variant: "success",
      title: "Projects",
      message: nextHidden ? "Project Hidden." : "Project Visible.",
      duration: 3,
    });
  } catch (e) {
    console.error("Failed to toggle project hidden state", e);
    notificationStore.addNotification({
      variant: "danger",
      title: "Projects",
      message: "Couldn’t update the project. Please try again.",
      duration: 5,
    });
  }
}
</script>

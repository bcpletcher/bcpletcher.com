<template>
  <!-- One loading/error treatment for every project list. Renders the default slot once loaded. -->
  <Transition name="swap" mode="out-in">
  <ol
    v-if="settingsStore.projectsLoading"
    class="group/list list-none p-0"
    :class="listClass"
    role="status"
    aria-label="Loading projects"
  >
    <ProjectSkeleton
      v-for="n in count"
      :key="n"
      :variant="variant"
      :is-last="n === count"
      :lead="n === 1 || count < 3"
    />
  </ol>

  <div
    v-else-if="settingsStore.projectsError"
    role="alert"
    class="rounded-md border border-white/10 bg-white/5 p-6"
  >
    <p class="font-medium text-slate-200">Couldn’t load projects.</p>
    <p class="mt-1 text-sm text-slate-400">
      Check your connection and try again.
    </p>
    <button
      type="button"
      class="kbd-focus mt-4 inline-flex cursor-pointer items-center rounded-full bg-sky-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sky-300 transition-standard hover:bg-sky-300/20 focus-visible:bg-sky-300/20"
      @click="retry"
    >
      Try again
    </button>
  </div>

  <slot v-else />
  </Transition>
</template>

<script setup>
import ProjectSkeleton from "@/components/shared/project-skeleton.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { loadProjects } from "@/utils/loadProjects.js";

defineProps({
  variant: {
    type: String,
    default: "home",
    validator: (v) => ["home", "page", "featured"].includes(v),
  },
  count: { type: Number, default: 3 },
  // Extra classes for the skeleton list, so it can mirror a grid used by the loaded list.
  listClass: { type: String, default: "" },
});

const settingsStore = useSettingsStore();

const retry = () => {
  // Clearing the error flips the list back to skeletons while the request runs.
  loadProjects();
};
</script>

<template>
  <div class="h-full">
    <base-layout>
      <template #header>
        <div class="flex gap-4 justify-end">
          <button class="btn-primary" @click="createEntryModalRef.showModal()">
            Create Document
          </button>
        </div>
      </template>
      <div class="h-full max-w-[1000px] mx-auto">
        <scrapbook-table v-slot="{ row }" :is-admin="true">
          <div class="flex gap-2">
            <button
              class="text-gradient-start/80 hover:text-gradient-start transition-standard"
              @click="editEntry(row)"
            >
              <i class="far fa-edit"></i>
            </button>
            <button
              v-if="!row.deleted"
              class="text-red-500/80 hover:text-red-500 transition-standard"
              @click="toggleSoftDelete(row)"
            >
              <i class="far fa-trash-alt"></i>
            </button>
            <button
              v-else
              class="text-green-400/80 hover:text-green-400 transition-standard"
              @click="toggleSoftDelete(row)"
            >
              <i class="far fa-rotate-left"></i>
            </button>
          </div>
        </scrapbook-table>
      </div>
    </base-layout>

    <create-entry-modal ref="createEntryModalRef" />
  </div>
</template>

<script setup>
import { useTemplateRef } from "vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

import BaseLayout from "@/components/shared/base-layout.vue";
import CreateEntryModal from "@/components/admin/create-entry-modal.vue";
import ScrapbookTable from "@/components/scrapbook/table.vue";

const createEntryModalRef = useTemplateRef("createEntryModalRef");

const editEntry = (row) => {
  createEntryModalRef.value.showModal(row);
};

const toggleSoftDelete = async (row) => {
  const firebaseStore = useFirebaseStore();
  const settingsStore = useSettingsStore();

  const id = row.name;
  const current = settingsStore.scrapbook?.[id] || row;
  const wasDeleted = !!current.deleted;

  const updated = { ...current };

  if (!wasDeleted) {
    updated.deleted = true;
    updated.order = null;
  } else {
    updated.deleted = false;
    const activeItems = Object.values(settingsStore.scrapbook || {}).filter(
      (item) => !item.deleted
    );
    const maxOrder = activeItems.reduce(
      (max, item) => (item.order && item.order > max ? item.order : max),
      0
    );
    updated.order = maxOrder + 1;
  }

  await firebaseStore.dataUpdateScrapbookDocument({
    id,
    data: updated,
  });

  // Update in-memory cache and localStorage
  settingsStore.scrapbook = {
    ...(settingsStore.scrapbook || {}),
    [id]: updated,
  };
  if (settingsStore.scrapbook) {
    localStorage.setItem(
      "scrapbookCache",
      JSON.stringify(settingsStore.scrapbook)
    );
  }
};
</script>

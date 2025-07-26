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
        <scrapbook-table :is-admin="true">
          <div class="flex gap-2">
            <button
              class="text-font-primary/80 hover:text-gradient-start transition-standard"
            >
              <i class="far fa-edit"></i>
            </button>
            <button
              class="text-font-primary/80 hover:text-gradient-start transition-standard"
            >
              <i class="far fa-trash-alt"></i>
            </button>
          </div>
        </scrapbook-table>
      </div>
    </base-layout>

    <create-entry-modal ref="createEntryModalRef" />
  </div>
</template>

<script setup>
import { ref, useTemplateRef } from "vue";
import BaseLayout from "@/components/shared/base-layout.vue";
import CreateEntryModal from "@/components/admin/create-entry-modal.vue";
import { useSettingsStore } from "@/stores/settings.js";
import ScrapbookTable from "@/components/scrapbook/table.vue";

const showModal = ref(false);
const createEntryModalRef = useTemplateRef("createEntryModalRef");
const settingsStore = useSettingsStore();
</script>

<template>
  <Modal :visible="visible" title="Create Entry" @close="visible = false">
    <div class="flex flex-col gap-2">
      <tw-input-group
        :value="documentModel.id"
        label="Id"
        @update-value="documentModel.id = $event"
      />
      <tw-input-group
        :value="documentModel.data.eyebrow"
        label="Eyebrow"
        @update-value="documentModel.data.eyebrow = $event"
      />
      <tw-input-group
        :value="documentModel.data.title"
        label="Title"
        @update-value="documentModel.data.title = $event"
      />
      <tw-input-group
        :value="documentModel.data.description"
        label="Description"
        @update-value="documentModel.data.description = $event"
      />
      <tw-input-group
        :value="documentModel.data.url"
        label="Site URL"
        @update-value="documentModel.data.url = $event"
      />
      <tw-input-group
        :value="documentModel.data.hero"
        label="Hero Image URL"
        @update-value="documentModel.data.hero = $event"
      />
      <div class="flex flex-col">
        <div class="flex justify-between py-1">
          <label class="my-auto">Images</label>
          <button
            class="rounded-full w-6 h-6 border-2 border-font-primary flex flex-col justify-center hover:border-gradient-start hover:text-gradient-start transition-standard"
            @click="documentModel.data.images.push(null)"
          >
            <i class="far fa-plus mx-auto"></i>
          </button>
        </div>

        <div
          v-for="(item, index) in documentModel.data.images"
          :key="index"
          class="flex gap-2"
        >
          <tw-input-group
            :value="item"
            class="flex-1"
            @update-value="documentModel.data.images[index] = $event"
          />
          <button
            class="w-6 flex flex-col justify-center text-red-500 transition-standard my-auto pt-1"
            @click="removeImage(index, 'images')"
          >
            <i class="far fa-minus mx-auto text-2xl"></i>
          </button>
        </div>
      </div>
      <div class="flex flex-col">
        <div class="flex justify-between py-1">
          <label class="my-auto">Summary</label>
          <button
            class="rounded-full w-6 h-6 border-2 border-font-primary flex flex-col justify-center hover:border-gradient-start hover:text-gradient-start transition-standard"
            @click="documentModel.data.summary.push(null)"
          >
            <i class="far fa-plus mx-auto"></i>
          </button>
        </div>

        <div
          v-for="(item, index) in documentModel.data.summary"
          :key="index"
          class="flex gap-2"
        >
          <tw-input-group
            :value="item"
            class="flex-1"
            @update-value="documentModel.data.summary[index] = $event"
          />
          <button
            class="w-6 flex flex-col justify-center text-red-500 transition-standard my-auto pt-1"
            @click="removeImage(index, 'summary')"
          >
            <i class="far fa-minus mx-auto text-2xl"></i>
          </button>
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
        <button class="btn-secondary" @click="cancel">Cancel</button>
        <button class="btn-primary" @click="submit">Submit</button>
      </div>
    </template>
  </Modal>
</template>
<script setup>
import { onBeforeUnmount, ref } from "vue";
import Modal from "@/components/shared/modal.vue";
import TwInputGroup from "@/components/shared/tw-input-group.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

const settingsStore = useSettingsStore();

const firebaseStore = useFirebaseStore();
const visible = ref(false);

const documentModel = ref({
  id: null,
  data: {
    order: 0,
    eyebrow: null,
    title: null,
    description: null,
    hero: null,
    images: [],
    summary: [],
    technology: [],
    url: null,
    deleted: false,
  },
});
const removeImage = (index, key) => {
  documentModel.value.data[key].splice(index, 1);
};
const submit = async () => {
  documentModel.value.order = settingsStore.scrapbook
    ? Object.keys(settingsStore.scrapbook).length + 1
    : 0;

  await firebaseStore.dataCreateScrapbookDocument(documentModel.value);
  cancel();
};

const showModal = async () => {
  visible.value = true;
};

const cancel = () => {
  documentModel.value = {
    id: null,
    data: {
      order: 0,
      eyebrow: null,
      title: null,
      description: null,
      hero: null,
      images: [],
      summary: [],
      technology: [],
      url: null,
      deleted: false,
    },
  };

  visible.value = false;
};

onBeforeUnmount(() => {
  cancel();
});

defineExpose({
  showModal,
});
</script>

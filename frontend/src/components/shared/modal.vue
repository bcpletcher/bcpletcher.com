<template>
  <Teleport to="body">
    <div
      v-if="props.visible"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]"
      @click.self="closeModal"
    >
      <div
        class="bg-base-sidebar p-6 rounded-lg shadow-lg w-[90vw] max-w-[600px] flex flex-col"
      >
        <div
          v-if="showHeader"
          class="flex justify-between text-font-primary border-b border-white/20 pb-4 mb-4"
        >
          <div>
            <h2 v-if="title" class="text-xl font-semibold">
              {{ props.title }}
            </h2>
          </div>
          <button
            class="opacity-80 hover:opacity-100 transition-standard"
            @click="closeModal"
          >
            <i class="far fa-times"></i>
          </button>
        </div>
        <div class="text-font-primary max-h-[70vh] overflow-auto">
          <slot></slot>
        </div>

        <div v-if="showFooter" class="border-t border-white/20 pt-4 mt-4">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  showHeader: {
    type: Boolean,
    required: false,
    default: true,
  },
  showFooter: {
    type: Boolean,
    required: false,
    default: true,
  },
  visible: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const closeModal = () => {
  emit("close", false);
};
</script>

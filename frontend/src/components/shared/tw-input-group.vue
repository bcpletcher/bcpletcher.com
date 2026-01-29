<template>
  <div class="py-1">
    <div class="flex flex-col gap-1">
      <label
        v-if="props.label !== ''"
        for="input"
        class="block text-sm text-font-primary leading-none"
      >
        {{ props.label }}
      </label>
      <div class="mt-1 flex rounded-md">
        <span
          v-if="
            props.trailingIcon !== '' && props.trailingIconAlignment === 'left'
          "
          class="rounded-l-md inline-flex items-center px-2 border border-r-0 text-sm text-font-primary border-primary background-gradient-br"
          @click="$emit('iconClick')"
        >
          {{ props.trailingIcon }}+
        </span>
        <div class="flex-1 min-w-0 block w-full relative">
          <input
            v-model="activeValue"
            name="input"
            :placeholder="props.placeholder"
            :disabled="props.disabled"
            :type="props.type"
            :class="[
              {
                'cursor-not-allowed  text-gray-500':
                  props.disabled,
              },
              {
                'pr-10 border-red-300! focus:border-red-500 dark:border-red-700! dark:focus:border-red-500 ':
                  props.invalid,
              },
              props.trailingIcon !== ''
                ? props.trailingIconAlignment === 'right'
                  ? 'rounded-none rounded-l-md'
                  : 'rounded-none rounded-r-md'
                : 'rounded-md',
              props.backgroundColor,
              props.borderColor,
            ]"
            class="w-full py-1.5 px-2 border border-base-border placeholder-gray-300 focus-ring-offset-primary ring-offset-primary text-sm bg-gray-800 text-white"
            @keyup.enter="$emit('enterEvent')"
          />
          <div
            class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
          >
            <tw-icon
              v-if="invalid"
              icon="exclamation-circle"
              weight="fas"
              size=""
              class="text-red-500"
            />
          </div>
        </div>
        <span
          v-if="
            props.trailingIcon !== '' && props.trailingIconAlignment === 'right'
          "
          class="rounded-r-md inline-flex items-center px-2 border border-l-0 text-sm text-white border-primary background-gradient-br"
          @click="$emit('iconClick')"
          >{{ props.trailingIcon }}</span
        >
      </div>
    </div>
    <p
      v-if="props.invalid && props.message !== ''"
      id="email-error"
      class="mt-2 text-xs text-red-500"
    >
      {{ props.message }}
    </p>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, defineEmits, watch } from "vue";
import TwIcon from "@/components/shared/tw-icon.vue";

const props = defineProps({
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  value: { type: [String, Number], default: "" },
  message: { type: String, default: "" },
  trailingIcon: { type: String, default: "" },
  max: { type: [String, Number], default: null },
  min: { type: [String, Number], default: null },
  borderColor: { type: String, default: "border-primary" },
  backgroundColor: { type: String, default: "background-secondary" },
  trailingIconAlignment: { type: String, default: "right" },
  type: { type: String, default: "text" },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["updateValue", "enterEvent", "iconClick"]);

const activeValue = ref("");

watch(
  () => props.value,
  () => {
    activeValue.value = props.value;
  },
  { immediate: true, deep: true }
);
watch(
  () => activeValue.value,
  () => {
    if (props.type === "number") {
      activeValue.value = parseInt(activeValue.value, 10).toString();
      if (props.max && activeValue.value > props.max) {
        activeValue.value = props.max.toString();
      }
      if (props.min && activeValue.value < props.min) {
        activeValue.value = props.min.toString();
      }
    }
    emit("updateValue", activeValue.value);
  }
);
onBeforeMount(() => {
  activeValue.value = props.value;
});
</script>

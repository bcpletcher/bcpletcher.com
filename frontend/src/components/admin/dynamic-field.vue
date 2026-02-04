<template>
  <div>
    <!-- Handle strings -->
    <template v-if="getType(value) === 'string'">
      <tw-input-group
        :value="internalValue"
        :label="fieldKey"
        :placeholder="fieldKey"
      />
    </template>

    <!-- Handle objects -->
    <template v-else-if="getType(value) === 'object'">
      <p v-if="value.type" class="text-sky-300">
        Custom handling required for type: {{ value.type }}
      </p>
      <div v-else class="flex flex-col gap-2 pl-4 border-l-2 border-gray-300">
        <DynamicField
          v-for="(nestedValue, nestedKey) in value"
          :key="nestedKey"
          :value="nestedValue"
          :field-key="`${fieldKey}.${nestedKey}`"
          @update="updateField"
        />
      </div>
    </template>

    <!-- Handle arrays -->
    <template v-else-if="getType(value) === 'array'">
      <div class="flex flex-col gap-2 pl-4 border-l-2 border-gray-300">
        <DynamicField
          v-for="(nestedValue, index) in value"
          :key="index"
          :value="nestedValue"
          :field-key="`${fieldKey}[${index}]`"
          @update="updateField"
        />

        <!-- Add new item button -->
        <button
          v-if="getType(value[0]) !== 'undefined'"
          class="mt-2 p-2 text-white bg-blue-500 rounded"
          @click="addNewItem"
        >
          Add New Item
        </button>
      </div>
    </template>

    <!-- Handle unknown types -->
    <template v-else>
      <p class="text-sky-300">Unknown type for key: {{ fieldKey }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import DynamicField from "./dynamic-field.vue";
import TwInputGroup from "@/components/shared/tw-input-group.vue"; // Adjust import as needed

const emit = defineEmits(["update"]);

const props = defineProps({
  value: {
    type: [String, Number, Boolean, Array, Object, null],
    required: true,
  },
  fieldKey: {
    type: String,
    required: true,
  },
});

const internalValue = ref(props.value);

watch(
  () => props.value,
  (newValue) => {
    internalValue.value = newValue;
  }
);

watch(internalValue, (newValue) => {
  emit("update", props.fieldKey, newValue);
});

const getType = (val) => {
  if (Array.isArray(val)) return "array";
  if (typeof val === "string") return "string";
  if (val && typeof val === "object") return "object";
  return "unknown";
};

const updateField = (key, value) => {
  emit("update", key, value);
};

const addNewItem = () => {
  const newItem = generateNewItem();
  internalValue.value.push(newItem);
  emit("update", props.fieldKey, internalValue.value);
};

const generateNewItem = () => {
  // This will create a new item based on the structure of the array
  if (internalValue.value.length > 0) {
    const firstItem = internalValue.value[0];
    if (typeof firstItem === "object") {
      return { ...firstItem }; // Duplicate the first item structure if it's an object
    }
    return ""; // Otherwise, return an empty string if the array items are not objects
  }
  return ""; // Return a default value if the array is empty
};
</script>

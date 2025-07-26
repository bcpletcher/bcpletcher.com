<template>
  <button
    class="bg-gradient-to-r from-gradient-start via-gradient-middle to-gradient-end rounded-full h-10 tracking-widest mx-auto p-1 relative uppercase z-10"
    :class="[props.buttonClasses]"
    @click="emit('click')"
  >
    <span
      class="px-4 flex items-center justify-center h-full rounded-full transition-colors duration-500 ease-in-out w-full"
      :class="[props.textColorClass, props.bgColorClass]"
    >
      <label class="text-base leading-none mt-1">{{ props.text }}</label>
    </span>
  </button>
</template>

<script setup>
const emit = defineEmits(["click"]);

const props = defineProps({
  text: { type: String, default: null },
  textColorClass: { type: String, default: "text-font-primary" },
  bgColorClass: { type: String, default: "bg-base-background " },
  buttonClasses: { type: String, default: "" },
});
</script>

<template>
  <button
    :class="[
      colorStyles.color,
      colorStyles.font,
      colorStyles.focus,
      colorStyles.border,
      colorStyles.offsetColor,
      shadow,
    ]"
    class="cursor-pointer inline-flex justify-center rounded-md border px-4 py-1 font-medium w-auto text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 relative transition-standard"
  >
    <span :class="{ 'opacity-0': props.loading }">{{ props.text }}</span>
    <span v-if="props.loading" class="absolute inset-0">
      <div class="h-full flex justify-center">
        <svg class="infinite" viewBox="-2000 -1000 4000 2000">
          <path
            id="inf"
            d="M354-354A500 500 0 1 1 354 354L-354-354A500 500 0 1 0-354 354z"
          ></path>
          <use
            class="stroke-current"
            :class="colorStyles.loader"
            xlink:href="#inf"
            stroke-dasharray="1570 5143"
            stroke-dashoffset="6713px"
          ></use>
        </svg>
      </div>
    </span>
  </button>
</template>

<script setup>
import { computed, defineProps } from "vue";

const props = defineProps({
  text: { type: String, default: "" },
  font: { type: String, default: "text-white" },
  focus: {
    type: String,
    default: "focus:ring-brand-light-to dark:focus:ring-brand-dark-to",
  },
  color: {
    type: String,
    default:
      "bg-brand-light-to hover:bg-brand-light-via dark:bg-brand-dark-to dark:hover:bg-brand-dark-via dark:bg-brand-dark-to dark:hover:bg-brand-dark-via",
  },
  border: { type: String, default: "border-transparent" },
  shadow: { type: String, default: "shadow-sm" },
  offsetColor: {
    type: String,
    default: "ring-offset-white dark:ring-offset-gray-900",
  },
  loader: {
    type: String,
    default: "text-brand-light-from dark:text-brand-dark-from",
  },
  defaultStyle: { type: [String, Object], default: null },
  showImage: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

const colorStyles = computed(() => {
  if (props.defaultStyle === "danger") {
    return {
      font: props.font,
      focus: "focus:ring-red-500",
      color: "bg-red-600 hover:bg-red-700",
      border: props.border,
      loader: props.loader,
    };
  } else if (props.defaultStyle === "cancel") {
    return {
      font: "text-gray-700 dark:text-gray-50",
      focus: "focus:ring-gray-300 dark:focus:ring-gray-500",
      color: "bg-gray-0 dark:bg-gray-600 hover-primary",
      border: "border-gray-200 dark:border-gray-800",
      offsetColor: props.offsetColor,
      // offsetRing: 'ring-offset-gray-100 dark:ring-offset-gray-700'
    };
  } else if (props.defaultStyle === "alternate") {
    return {
      font: props.font,
      focus: "focus:ring-brand-alternate-to",
      color: "background-gradient-alt-r",
      border: props.border,
      offsetColor: props.offsetColor,
      loader: props.loader,
    };
  } else if (props.defaultStyle === "gradient") {
    return {
      font: props.font,
      focus: "",
      color: "background-gradient-r",
      border: "border-gray-200 dark:border-gray-800",
      offsetColor: props.offsetColor,
      loader: props.loader,
    };
  } else {
    return {
      font: props.font,
      focus: props.focus,
      color: props.color,
      border: props.border,
      offsetColor: props.offsetColor,
      loader: props.loader,
    };
  }
});
</script>

<style scoped lang="scss">
svg.infinite {
  max-width: 50px;
  background: transparent;
  fill: none;
  stroke: rgba(0, 0, 0, 0.3);
  stroke-linecap: round;
  stroke-width: 8%;
}

use {
  animation: a 3s linear infinite;
}

@keyframes a {
  to {
    stroke-dashoffset: 0;
  }
}
</style>

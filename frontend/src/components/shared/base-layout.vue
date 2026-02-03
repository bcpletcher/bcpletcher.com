<template>
  <div class="base-layout h-full w-full flex flex-col gap-2">
    <div
      v-if="showHeader"
      :class="[
        {
          'border border-border rounded-lg p-4': headerBackground,
        },
      ]"
    >
      <slot name="header"></slot>
    </div>
    <div
      class="flex-1 scrollbar-thin scrollbar-thumb-gradient-start/60 scrollbar-track-base"
      :class="[
        scrollableY ? 'overflow-y-auto ' : 'overflow-y-hidden',
        scrollableX ? 'overflow-x-auto' : 'overflow-x-hidden',
        {
          'border border-border rounded-lg p-4': contentBackground,
        },
      ]"
    >
      <slot></slot>
    </div>
    <div
      v-if="showFooter"
      :class="[
        {
          'border border-border rounded-lg p-4': footerBackground,
        },
      ]"
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
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
    scrollableY: {
      type: Boolean,
      required: false,
      default: true,
    },
    scrollableX: {
      type: Boolean,
      required: false,
      default: false,
    },
    headerBackground: {
      type: Boolean,
      required: false,
      default: false,
    },
    contentBackground: {
      type: Boolean,
      required: false,
      default: false,
    },
    footerBackground: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {};
  },
};
</script>

<style scoped></style>

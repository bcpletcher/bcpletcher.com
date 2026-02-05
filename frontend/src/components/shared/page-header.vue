<template>
  <header
    :class="[
      'pb-6 lg:pb-16',
      removeTopPadding ? 'lg:pt-0' : 'lg:pt-24',
    ]"
  >
    <div class="flex items-start justify-between gap-6 h-full">
      <div class="min-w-0 flex flex-col gap-2">
        <router-link
          to="/"
          class="group/link inline-flex items-center gap-2 text-sm font-medium text-sky-300 hover:text-sky-300 focus-visible:text-sky-300 transition-standard"
          aria-label="Back to home"
        >
          <i
            class="fa-light fa-arrow-left transition-transform motion-reduce:transition-none group-hover/link:-translate-x-1 group-focus-visible/link:-translate-x-1"
            aria-hidden="true"
          />
          <span>{{ backLabel }}</span>
        </router-link>

        <h1
          v-if="title"
          class="text-4xl font-bold tracking-tight text-slate-200 sm:text-5xl"
        >
          {{ title }}
        </h1>
      </div>

      <div v-if="$slots.actions" class="flex shrink-0 h-full flex-col">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, default: "" },
  backLabel: { type: String, default: "Benjamin Pletcher" },
  removeTopPadding: { type: Boolean, default: false },
});
</script>

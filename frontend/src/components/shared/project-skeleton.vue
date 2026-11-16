<template>
  <!-- Mirrors the real project card layouts so nothing shifts when data lands.
       variant "home": compact card (image left). variant "page": /projects card (image right). -->
  <li
    v-if="variant === 'home'"
    class="grid gap-2 sm:grid-cols-8 sm:gap-8 md:gap-4"
    :class="isLast ? '' : 'mb-12'"
    aria-hidden="true"
  >
    <div
      class="mt-1 aspect-video w-full animate-pulse rounded border border-white/10 bg-white/5 motion-reduce:animate-none sm:col-span-2"
    />
    <div class="sm:col-span-6">
      <SkeletonBar class="h-5 w-2/5" />
      <div class="mt-3 space-y-2">
        <SkeletonBar class="h-3.5 w-full bg-white/5" />
        <SkeletonBar class="h-3.5 w-full bg-white/5" />
        <SkeletonBar class="h-3.5 w-3/5 bg-white/5" />
      </div>
      <div class="mt-4 flex flex-wrap gap-1.5">
        <SkeletonBar class="h-7 w-16 rounded-full bg-sky-300/10" />
        <SkeletonBar class="h-7 w-20 rounded-full bg-sky-300/10" />
        <SkeletonBar class="h-7 w-14 rounded-full bg-sky-300/10" />
      </div>
    </div>
  </li>

  <li
    v-else
    class="grid md:grid-cols-12 md:items-center md:gap-8"
    :class="isLast ? '' : 'mb-10'"
    aria-hidden="true"
  >
    <div class="md:col-span-7">
      <SkeletonBar class="h-5 w-1/3" />
      <div
        class="mt-3 space-y-2 md:rounded md:border md:border-slate-700 md:bg-slate-950/75 md:p-6"
      >
        <SkeletonBar class="h-3.5 w-full bg-white/5" />
        <SkeletonBar class="h-3.5 w-full bg-white/5" />
        <SkeletonBar class="h-3.5 w-full bg-white/5" />
        <SkeletonBar class="h-3.5 w-2/3 bg-white/5" />
      </div>
      <div class="mt-4 flex flex-wrap gap-1.5">
        <SkeletonBar class="h-7 w-16 rounded-full bg-sky-300/10" />
        <SkeletonBar class="h-7 w-20 rounded-full bg-sky-300/10" />
        <SkeletonBar class="h-7 w-14 rounded-full bg-sky-300/10" />
      </div>
    </div>
    <div class="hidden md:col-span-5 md:block">
      <div
        class="aspect-video w-full animate-pulse rounded-md border border-white/10 bg-white/5 motion-reduce:animate-none"
      />
    </div>
  </li>
</template>

<script setup>
import SkeletonBar from "@/components/shared/skeleton-bar.vue";

defineProps({
  variant: {
    type: String,
    default: "home",
    validator: (v) => ["home", "page"].includes(v),
  },
  isLast: { type: Boolean, default: false },
});
</script>

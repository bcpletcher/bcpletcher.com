<template>
  <div class="mt-12 space-y-6 max-sm:mt-10">
    <!-- Recognition: the awards the résumé lists, with the detail one tap away. -->
    <section
      class="rounded-xl border border-white/10 bg-white/5 p-5 sm:p-6"
      aria-labelledby="recognition-heading"
    >
      <div class="flex items-start gap-4">
        <AppIcon
          icon="fa-light fa-award"
          class="mt-0.5 h-6 w-6 shrink-0 text-sky-300"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <h3
            id="recognition-heading"
            class="text-xs font-semibold tracking-widest text-slate-400 uppercase"
          >
            Recognition
          </h3>
          <p class="mt-2 font-semibold leading-snug text-slate-100">
            {{ RECOGNITION_SUMMARY.title }}
          </p>
          <p class="mt-1 text-sm leading-normal text-slate-400">
            {{ RECOGNITION_SUMMARY.text }}
          </p>

          <details class="group/details mt-3">
            <summary
              class="kbd-focus inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-300 uppercase transition-colors hover:text-sky-300 [&::-webkit-details-marker]:hidden"
            >
              <span class="group-open/details:hidden">See the sites</span>
              <span class="hidden group-open/details:inline">Hide the sites</span>
              <AppIcon
                icon="fa-light fa-arrow-down"
                class="h-3.5 w-3.5 transition-transform motion-reduce:transition-none group-open/details:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <dl class="mt-2 space-y-3 text-sm leading-normal">
              <div v-for="group in RECOGNITION_SUMMARY.groups" :key="group.label">
                <dt class="font-medium text-slate-200">{{ group.label }}</dt>
                <dd
                  v-for="item in group.items"
                  :key="item"
                  class="text-slate-400"
                >
                  {{ item }}
                </dd>
              </div>
            </dl>
          </details>
        </div>
      </div>
    </section>

    <p class="text-sm leading-normal text-slate-400">
      <span class="font-semibold text-slate-300">Education</span>
      <span class="text-slate-600"> · </span>
      Bachelor of Computer Programming, Baker College, 2008 – 2012
    </p>
  </div>
</template>

<script setup>
import AppIcon from "@/components/shared/app-icon.vue";
import { RECOGNITION_SUMMARY } from "@/constants/projectRecognition.js";
</script>

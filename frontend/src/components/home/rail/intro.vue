<template>
  <div>
    <h1
      style="--enter-i: 0"
      class="enter text-4xl font-bold leading-[1.05] tracking-tight text-slate-100 sm:text-5xl"
    >
      {{ name }}
    </h1>
    <p
      style="--enter-i: 1"
      class="enter mt-3 text-xl font-medium tracking-tight text-slate-200"
    >
      {{ title }}
    </p>
    <p
      style="--enter-i: 2"
      class="enter mt-4 max-w-xs leading-relaxed text-slate-400"
    >
      {{ description }}
    </p>

    <p
      v-if="AVAILABILITY_TEXT"
      style="--enter-i: 3"
      class="enter mt-6 inline-flex items-center gap-2 text-sm text-slate-300"
    >
      <span class="relative flex h-2 w-2" aria-hidden="true">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none"
        />
        <span
          class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"
        />
      </span>
      {{ AVAILABILITY_TEXT }}
    </p>

    <!-- Buttons, and an optional slot beside them (the social icons below lg). The row
         wraps: where there is room the slot sits next to the buttons, on phones under them. -->
    <div
      style="--enter-i: 4"
      class="enter mt-8 flex flex-wrap items-center gap-x-6 gap-y-5"
    >
      <div class="flex flex-wrap gap-3">
        <a
          :href="CONTACT_EMAIL_HREF"
          class="kbd-focus inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-300 px-5 text-sm font-semibold text-slate-900 transition-colors motion-reduce:transition-none hover:bg-sky-200 focus-visible:bg-sky-200"
        >
          <AppIcon icon="fa fa-regular fa-envelope" aria-hidden="true" />
          Get in touch
        </a>
        <a
          :href="RESUME_HREF"
          target="_blank"
          rel="noopener noreferrer"
          class="kbd-focus group/link inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-600 px-5 text-sm font-semibold text-slate-200 transition-colors motion-reduce:transition-none hover:border-sky-300/60 hover:text-sky-300 focus-visible:border-sky-300/60 focus-visible:text-sky-300"
        >
          Résumé
          <span class="sr-only">(PDF, opens in a new tab)</span>
          <AppIcon
            icon="fa-solid fa-arrow-up-right"
            class="h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 group-focus-visible/link:-translate-y-0.5 group-focus-visible/link:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
      <slot name="after" />
    </div>
  </div>
</template>

<script setup>
import {
  AVAILABILITY_TEXT,
  CONTACT_EMAIL_HREF,
  RESUME_HREF,
} from "@/constants/contact.js";

defineProps({
  name: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
});
</script>

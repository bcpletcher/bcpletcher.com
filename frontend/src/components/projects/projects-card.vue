<template>
  <li class="overflow-visible" :class="isLast ? '' : 'mb-10'">
    <article
      v-gsap-reveal="{ once: true, start: 'top 92%' }"
      class="relative grid overflow-visible pb-1 sm:grid-cols-12 sm:items-center sm:gap-8 md:gap-4"
    >
      <!-- Content column (left) -->
      <div class="relative z-20 sm:col-span-7 sm:order-1">
        <div class="flex flex-col justify-center">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <a
                v-if="href"
                :href="href"
                target="_blank"
                rel="noreferrer noopener"
                class="group/title inline-flex min-w-0 items-start gap-2 text-slate-200 transition-colors motion-reduce:transition-none hover:text-accent focus-visible:text-accent"
                :aria-label="ariaLabel"
              >
                <h3 class="min-w-0 font-medium leading-snug wrap-break-word">
                  {{ title }}
                  <span
                    v-if="year"
                    class="ml-2 align-baseline text-xs font-semibold tracking-widest text-slate-400"
                  >
                    {{ year }}
                  </span>
                </h3>
                <i
                  class="fa-light fa-arrow-up-right mt-0.5 inline-block h-4 w-4 shrink-0 text-current transition-transform motion-reduce:transition-none group-hover/title:-translate-y-1 group-hover/title:translate-x-1 group-focus-visible/title:-translate-y-1 group-focus-visible/title:translate-x-1"
                  aria-hidden="true"
                />
              </a>

              <h3 v-else class="min-w-0 font-medium leading-snug text-slate-200 wrap-break-word">
                {{ title }}
                <span
                  v-if="year"
                  class="ml-2 align-baseline text-xs font-semibold tracking-widest text-slate-400"
                >
                  {{ year }}
                </span>
              </h3>
            </div>
          </div>

          <!-- Let only the description panel overlap further into the image column -->
          <div
            v-if="summary"
            class="mt-3 md:bg-surface-2/70 md:border md:border-border rounded md:p-6 md:backdrop-blur md:-mr-16 lg:-mr-28"
          >
            <p class="text-sm leading-normal">
              {{ summary }}
            </p>
          </div>

          <div
            v-if="technology?.length"
            class="mt-2 flex flex-wrap"
            aria-label="Technologies used"
          >
            <div v-for="tag in technology" :key="tag" class="mr-1.5 mt-2">
              <div
                class="flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium leading-5 text-accent"
              >
                {{ tag }}
              </div>
            </div>
          </div>

          <!-- Meta row (bottom) -->
          <div v-if="featured" class="mt-3 flex items-center gap-2 text-xs text-slate-300">
            <i class="fa-solid fa-star text-yellow-300" aria-hidden="true" />
            <span>Featured</span>
          </div>
        </div>
      </div>

      <!-- Images column (right) -->
      <div class="relative z-10 mb-2 sm:col-span-5 sm:order-2">
        <div class="relative mt-1 w-full">
          <div
            v-for="(src, i) in previewImages"
            :key="src + i"
            class="absolute top-0 left-0"
            :style="stackStyles[i]"
          >
            <img
              class="h-full w-full rounded border border-white/10 bg-white/5 object-cover shadow-lg"
              :src="src"
              :alt="imageAlt"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div class="w-full aspect-16/10" aria-hidden="true" />
        </div>
      </div>
    </article>
  </li>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  summary: { type: String, default: "" },

  year: { type: [Number, String], default: null },

  hero: { type: String, required: true },
  images: { type: Array, default: null },

  href: { type: String, default: null },
  technology: { type: Array, default: () => [] },

  ariaLabel: { type: String, default: "Project (opens in a new tab)" },
  imageAlt: { type: String, default: "Project screenshot" },
  isLast: { type: Boolean, default: false },

  featured: { type: Boolean, default: false },
});

const previewImages = computed(() => {
  const imgs = Array.isArray(props.images) && props.images.length ? props.images : [props.hero];
  return imgs.filter(Boolean).slice(0, 3);
});

const stackStyles = [
  { zIndex: 3, transform: "translate(0px, 0px) rotate(0deg)" },
  { zIndex: 2, transform: "translate(12px, 12px) rotate(2deg)" },
  { zIndex: 1, transform: "translate(24px, 24px) rotate(4deg)" },
];
</script>

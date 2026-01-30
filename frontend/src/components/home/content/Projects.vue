<template>
  <div>
    <ol class="group/list">
      <li
        v-for="(project, idx) in projects"
        :key="project.title"
        class="overflow-visible"
        :class="idx !== projects.length - 1 ? 'mb-12' : ''"
      >
        <div
          class="group relative grid overflow-visible pb-1 transition-all sm:grid-cols-8 sm:gap-8 md:gap-4 lg:hover:!opacity-100 lg:group-hover/list:opacity-50"
        >
          <!-- Card hover background -->
          <div
            class="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-y-4 lg:-inset-x-6 lg:block lg:group-hover:bg-slate-800/50 lg:group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:group-hover:drop-shadow-lg"
          />

          <!-- Full-card link overlay -->
          <a
            class="absolute -inset-x-4 -inset-y-4 z-20 hidden rounded-md lg:block"
            :href="project.href"
            target="_blank"
            rel="noreferrer noopener"
            :aria-label="project.ariaLabel"
          />

          <!-- Image column -->
          <div class="z-10 mb-2 sm:col-span-2">
            <img
              class="mt-1 w-full rounded border border-white/10 bg-white/5 object-cover"
              :src="project.imageSrc"
              :alt="project.imageAlt"
              loading="lazy"
              decoding="async"
            />
          </div>

          <!-- Content column -->
          <div class="z-10 sm:col-span-6">
            <div class="flex items-start justify-between gap-4">
              <h3
                class="font-medium leading-snug text-slate-200 transition-colors lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary"
              >
                {{ project.title }}
              </h3>

              <i
                :class="[
                  'fa-light fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0',
                  'text-slate-200 transition-[transform,color] motion-reduce:transition-none',
                  'lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary',
                  'lg:group-hover:-translate-y-2 lg:group-hover:translate-x-3',
                  'lg:group-focus-within:-translate-y-2 lg:group-focus-within:translate-x-3',
                ]"
                aria-hidden="true"
              />
            </div>

            <p class="mt-2 text-sm leading-normal">
              {{ project.description }}
            </p>

            <ul class="mt-3 flex flex-wrap" aria-label="Technologies used">
              <li v-for="tag in project.tags" :key="tag" class="mr-1.5 mt-2">
                <div
                  class="flex items-center rounded-full bg-font-secondary/10 px-3 py-1 text-xs font-medium leading-5 text-font-secondary"
                >
                  {{ tag }}
                </div>
              </li>
            </ul>

            <div
              v-if="project.meta"
              class="mt-3 flex items-center gap-6 text-xs text-font-primary/60"
            >
              <span
                v-if="project.meta.stars"
                class="inline-flex items-center gap-2"
              >
                <i class="fa-light fa-star" aria-hidden="true" />
                {{ project.meta.stars }}
              </span>
              <span
                v-if="project.meta.secondary"
                class="inline-flex items-center gap-2"
              >
                <i class="fa-light fa-arrow-down" aria-hidden="true" />
                {{ project.meta.secondary }}
              </span>
            </div>
          </div>
        </div>
      </li>
    </ol>

    <div class="mt-12">
      <router-link
        to="/projects"
        class="group/link inline-flex items-baseline gap-2 text-sm font-semibold tracking-widest uppercase text-slate-400 hover:text-font-secondary focus-visible:text-font-secondary transition-standard"
      >
        <span>View all projects</span>
        <i
          class="fa-light fa-arrow-right transition-transform motion-reduce:transition-none group-hover/link:translate-x-1 group-focus-visible/link:translate-x-1"
          aria-hidden="true"
        />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import demo1 from "@/assets/images/self-column.jpg";
import demo2 from "@/assets/images/self-column.jpg";
import demo3 from "@/assets/images/self-column.jpg";

const projects = [
  {
    title: "Lorem Ipsum Project 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    href: "https://example.com",
    ariaLabel: "Lorem Ipsum Project 1 (opens in a new tab)",
    imageSrc: demo1,
    imageAlt: "Project screenshot",
    tags: ["Vue", "Vite", "Tailwind"],
    meta: { stars: "707" },
  },
  {
    title: "Lorem Ipsum Project 2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation.",
    href: "https://example.com",
    ariaLabel: "Lorem Ipsum Project 2 (opens in a new tab)",
    imageSrc: demo2,
    imageAlt: "Project screenshot",
    tags: ["Firebase", "Vue", "Cloud Functions"],
    meta: { secondary: "100k+ Installs" },
  },
  {
    title: "Lorem Ipsum Project 3",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit.",
    href: "https://example.com",
    ariaLabel: "Lorem Ipsum Project 3 (opens in a new tab)",
    imageSrc: demo3,
    imageAlt: "Project screenshot",
    tags: ["TypeScript", "Vue", "Tailwind"],
  },
];
</script>

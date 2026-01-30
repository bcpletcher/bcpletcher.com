<template>
  <div>
    <ol class="group/list">
      <li
        v-for="(job, idx) in jobs"
        :key="job.rangeLabel"
        class="overflow-visible"
        :class="idx !== jobs.length - 1 ? 'mb-12' : ''"
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
            :href="job.href"
            target="_blank"
            rel="noreferrer noopener"
            :aria-label="job.company"
          />

          <header
            class="z-10 mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2"
            :aria-label="job.rangeLabel"
          >
            {{ job.rangeLabel }}
          </header>

          <div class="z-10 sm:col-span-6">
            <div class="flex justify-between items-center">
              <span
                class="font-medium leading-snug text-slate-200 transition-colors lg:group-hover:text-font-secondary lg:group-focus-within:text-font-secondary"
              >
                {{ job.title }}
              </span>
              <span class="inline-flex items-center">
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
              </span>
            </div>

            <p class="mt-1 text-sm leading-normal text-slate-200">
              {{ job.company }}
            </p>

            <p class="mt-2 text-sm leading-normal">
              {{ job.description }}
            </p>

            <ul class="mt-2 flex flex-wrap" aria-label="Technologies used">
              <li v-for="tech in job.tech" :key="tech" class="mr-1.5 mt-2">
                <div
                  class="flex items-center rounded-full bg-font-secondary/10 px-3 py-1 text-xs font-medium leading-5 text-font-secondary"
                >
                  {{ tech }}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup>
const jobs = [
  {
    rangeLabel: "2021 — Present",
    title: "Senior Web Developer",
    company: "BlueModus",
    href: "https://www.bluemodus.com",
    subtitles: [],
    description:
      "Lead frontend and full-stack development for enterprise-scale CMS and SPA projects, collaborating with designers, strategists, and engineers to deliver high-quality digital experiences for national and global clients.",
    tech: ["TypeScript", "Vue", "React", "Tailwind", "CMS", ".NET"],
  },
  {
    rangeLabel: "2019 — 2021",
    title: "Lead UX/UI Developer",
    company: "Premium Data 360",
    href: "https://premiumdata360.com",
    subtitles: [],
    description:
      "Designed and developed sites and applications for enterprise clients, owning UX/UI execution while contributing to full-stack delivery across CMS and SPA builds in varied tech environments.",
    tech: ["Vue", "Blazor", "JavaScript", ".NET"],
  },
  {
    rangeLabel: "2014 — 2019",
    title: "Front End Developer",
    company: "Hemisphere Design Works",
    href: "https://hemispheredesignworks.com",
    subtitles: [],
    description:
      "Started as a front-end developer and grew into lead UX/UI, setting design direction, improving site theming and structure, and helping build a Vue.js SPA for the commercial media industry.",
    tech: ["Vue", "JavaScript", "MSSQL", "Crystal Reports"],
  },
  {
    rangeLabel: "2012 — 2014",
    title: "Developer",
    company: "Johnston Boiler Company",
    href: "https://johnstonboiler.com",
    subtitles: [],
    description:
      "Built and maintained internal web and desktop tools, including a replacement for legacy .NET apps, plus data-driven reporting and order/shipment tracking systems backed by MSSQL.",
    tech: ["C#", ".NET", "MSSQL", "WPF"],
  },
];
</script>

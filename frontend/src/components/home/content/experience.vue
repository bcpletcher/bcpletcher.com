<template>
  <div>
    <ol class="group/list">
      <ExperienceCard
        v-for="(job, idx) in jobs"
        :key="job.rangeLabel"
        :range-label="job.rangeLabel"
        :title="job.title"
        :company="job.company"
        :href="job.href"
        :description="job.description"
        :technology="job.technology"
        :is-last="idx === jobs.length - 1"
      />
    </ol>
  </div>
</template>

<script setup>
import ExperienceCard from "@/components/home/content/experience-card.vue";

const jobs = [
  {
    rangeLabel: "2021 — Present",
    title: "Senior Web Developer",
    company: "BlueModus",
    href: "https://www.bluemodus.com",
    subtitles: [],
    description:
      "Lead frontend and full-stack development for enterprise-scale CMS and SPA projects, collaborating with designers, strategists, and engineers to deliver high-quality digital experiences for national and global clients.",
    technology: ["TypeScript", "Vue", "React", "Tailwind", "CMS", ".NET"],
  },
  {
    rangeLabel: "2019 — 2021",
    title: "Lead UX/UI Developer",
    company: "Premium Data 360",
    href: "https://premiumdata360.com",
    subtitles: [],
    description:
      "Designed and developed sites and applications for enterprise clients, owning UX/UI execution while contributing to full-stack delivery across CMS and SPA builds in varied tech environments.",
    technology: ["Vue", "Blazor", "JavaScript", ".NET"],
  },
  {
    rangeLabel: "2014 — 2019",
    title: "Front End Developer",
    company: "Hemisphere Design Works",
    href: "https://hemispheredesignworks.com",
    subtitles: [],
    description:
      "Started as a front-end developer and grew into lead UX/UI, setting design direction, improving site theming and structure, and helping build a Vue.js SPA for the commercial media industry.",
    technology: ["Vue", "JavaScript", "MSSQL", "Crystal Reports"],
  },
  {
    rangeLabel: "2012 — 2014",
    title: "Developer",
    company: "Johnston Boiler Company",
    href: "https://johnstonboiler.com",
    subtitles: [],
    description:
      "Built and maintained internal web and desktop tools, including a replacement for legacy .NET apps, plus data-driven reporting and order/shipment tracking systems backed by MSSQL.",
    technology: ["C#", ".NET", "MSSQL", "WPF"],
  },
];
</script>

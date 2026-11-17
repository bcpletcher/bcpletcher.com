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
        :collapsible="idx >= 2"
      />
    </ol>
  </div>
</template>

<script setup>
import ExperienceCard from "@/components/home/content/experience-card.vue";

const jobs = [
  {
    rangeLabel: "2021 — Present",
    title: "Web Development Lead",
    company: "BlueModus",
    href: "https://www.bluemodus.com",
    subtitles: [],
    description:
      "Lead architecture and delivery for enterprise CMS projects. Integrated React and TypeScript features, including Plan My Trip and Maps & Schedules, into Community Transit’s Sitefinity site and maintained its deployment pipelines. Built product catalog filters and contributed to comparison pages for Flow Waterjet’s Kentico sites.",
    technology: ["C#", ".NET", "Kentico", "Sitefinity", "React", "TypeScript", "Azure DevOps"],
  },
  {
    rangeLabel: "2019 — 2021",
    title: "Lead UX/UI Developer",
    company: "Premium Data 360",
    href: "https://premiumdata360.com",
    subtitles: [],
    description:
      "Led product design and built the Vue.js interface used by GIA Cloud and the CLIR suite for media order and invoice reconciliation. Set UI standards and led design reviews with developers and stakeholders.",
    technology: ["Vue.js", "JavaScript"],
  },
  {
    rangeLabel: "2014 — 2019",
    title: "Front End Developer",
    company: "Hemisphere Design Works",
    href: "https://hemispheredesignworks.com",
    subtitles: [],
    description:
      "Led a two-person team that replaced legacy .NET tools with Sandbar, an operations platform for more than 100 employees. Designed the SQL Server database and built workflows for purchasing, engineering changes, shipment tracking, and reporting.",
    technology: ["Node.js", "Express", "Vue.js", "SQL Server", "Crystal Reports"],
  },
  {
    rangeLabel: "2012 — 2014",
    title: "Developer",
    company: "Johnston Boiler Company",
    href: "https://johnstonboiler.com",
    subtitles: [],
    description:
      "Built a C# desktop quoting tool that read Excel price books and filtered out incompatible options as sales staff put together quotes for specialized orders.",
    technology: ["C#", ".NET", "Excel"],
  },
];
</script>

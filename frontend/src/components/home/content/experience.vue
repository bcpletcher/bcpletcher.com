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
    title: "Web Development Lead",
    company: "BlueModus",
    href: "https://www.bluemodus.com",
    description:
      "I lead technical discovery, architecture, and delivery for enterprise web and CMS projects, typically guiding two developers and supporting 3–5 clients at a time. I’ve contributed to 20+ client sites across about eight industries. For Community Transit, I integrated React and TypeScript maps, schedules, and trip planning into Sitefinity and maintained the Azure DevOps pipelines. The agency recorded 9.5M+ boardings in 2025. My Kentico work includes C#/.NET integrations and an internal tool for previewing live widgets. For Flow Waterjet, I built product catalog filters and contributed to comparison pages.",
    technology: ["C#", ".NET", "Kentico", "Sitefinity", "React", "TypeScript", "Azure DevOps"],
  },
  {
    rangeLabel: "2019 — 2021",
    title: "Lead UX/UI Developer",
    company: "Premium Data 360",
    href: "https://premiumdata360.com",
    description:
      "I was promoted from Frontend Developer to Lead UX/UI Developer, where I set UI standards and led design reviews. I designed and built the Vue.js interface for GIA Cloud and the CLIR suite. In 2020, Premium Data 360 reported that CLIR supported data exchange for 1,000+ TV stations and 700 advertising agencies and buying groups. NBCUniversal used the same interface in a workflow that Premium Data 360 reported went from 50 minutes to 20 seconds per order.",
    technology: ["Vue.js", "JavaScript"],
  },
  {
    rangeLabel: "2014 — 2019",
    title: "Front End Developer",
    company: "Hemisphere Design Works",
    href: "https://hemispheredesignworks.com",
    description:
      "I led a two-person team that replaced legacy .NET tools with Sandbar, an operations platform for 100+ employees. In a typical year, Sandbar tracked 14,000+ purchase requests and coordinated 15,000+ dock appointments across four locations. I designed the SQL Server database and role-based approval workflows, built shipment tracking, and integrated a catalog of 150+ Crystal Reports.",
    technology: ["Node.js", "Express", "Vue.js", "SQL Server", "Crystal Reports"],
  },
  {
    rangeLabel: "2012 — 2014",
    title: "Developer",
    company: "Johnston Boiler Company",
    href: "https://johnstonboiler.com",
    description:
      "I built a C# desktop quoting tool that read Excel price books and filtered out incompatible options as sales staff built quotes for specialized orders, reducing ordering errors.",
    technology: ["C#", ".NET", "Excel"],
  },
];
</script>

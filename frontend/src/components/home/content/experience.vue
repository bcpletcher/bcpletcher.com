<template>
  <div>
    <ol class="group/list">
      <ExperienceCard
        v-for="(job, idx) in jobs"
        :key="job.rangeLabel"
        :range-label="job.rangeLabel"
        :title="job.title"
        :company="job.company"
        :location="job.location"
        :href="job.href"
        :highlights="job.highlights"
        :technology="job.technology"
        :case-studies="resolveRelated(job.caseStudies)"
        :related="resolveRelated(job.related)"
        :is-last="idx === jobs.length - 1"
        :collapsible="job.highlights.length > 1"
        :preview="idx === 0 ? 2 : 1"
      />
    </ol>

    <ExperienceExtras />
  </div>
</template>

<script setup>
import ExperienceCard from "@/components/home/content/experience-card.vue";
import ExperienceExtras from "@/components/home/content/experience-extras.vue";
import { useSettingsStore } from "@/stores/settings.js";
import { caseStudyHrefFor, findProjectBySlug } from "@/utils/caseStudyData.js";
import { slugify } from "@/utils/slug.js";

const settingsStore = useSettingsStore();

// Related links point at this role's work on the site and only show while that work exists
// (a published case study, or a visible project): { caseStudy | project | to, label }.
function resolveRelated(specs = []) {
  return specs
    .map((spec) => {
      if (spec.caseStudy) {
        const to = caseStudyHrefFor(settingsStore.projects, spec.caseStudy);
        return to ? { label: spec.label, to } : null;
      }
      if (spec.project) {
        const slug = slugify(spec.project);
        return findProjectBySlug(settingsStore.projects, slug)
          ? { label: spec.label || spec.project, to: `/projects#project/${slug}` }
          : null;
      }
      return { label: spec.label, to: spec.to };
    })
    .filter(Boolean);
}

// Outcome lines come from the résumé. Figures the company or agency reported say so.
const jobs = [
  {
    rangeLabel: "2021 — Present",
    title: "Web Development Lead",
    company: "BlueModus",
    location: "Remote",
    href: "https://www.bluemodus.com",
    highlights: [
      "Contributed to over 20 enterprise client sites across about 8 industries, usually supporting 3 to 5 clients at a time. I own architecture and delivery from new builds through ongoing support, and typically guide two developers.",
      "Integrated React and TypeScript applications into Community Transit’s Sitefinity website, including tools for maps, schedules, and trip planning, and have maintained them and their Azure DevOps pipelines continuously since June 2024. The agency recorded 9.5M+ boardings in 2025.",
      "Built product catalog filters and contributed to comparison pages for Flow Waterjet’s multisite Kentico implementation, and contributed to Kentico 13 to Xperience by Kentico migrations for other clients.",
      "Work on accessibility remediation (WCAG) across client sites, verifying fixes with keyboard and screen-reader testing.",
    ],
    technology: ["C#", ".NET", "Kentico", "Sitefinity", "React", "TypeScript", "Azure DevOps"],
    caseStudies: [
      { caseStudy: "Community Transit", label: "Community Transit" },
      { caseStudy: "Flow", label: "Flow Waterjet" },
      { caseStudy: "United Community", label: "United Community" },
      { caseStudy: "Lytx", label: "Lytx" },
    ],
    related: [{ to: "/projects?company=bluemodus", label: "More BlueModus client work" }],
  },
  {
    rangeLabel: "2019 — 2021",
    title: "Lead UX/UI Developer",
    company: "Premium Data 360",
    location: "Remote",
    href: "https://premiumdata360.com",
    highlights: [
      "Designed and built the Vue.js interface used by GIA Cloud and the CLIR suite. In 2020 the company reported that CLIR supported data exchange for 1,000+ TV stations and 700 advertising agencies and buying groups.",
      "NBCUniversal used the same interface in an order-processing workflow that Premium Data 360 reported went from 50 minutes to 20 seconds per order.",
      "Promoted from Frontend Developer to Lead UX/UI Developer, taking ownership of product design direction, setting UI standards and leading design reviews.",
    ],
    technology: ["Vue.js", "JavaScript"],
    related: [{ project: "GIACloud" }],
  },
  {
    rangeLabel: "2014 — 2019",
    title: "Front End Developer",
    company: "Hemisphere Design Works",
    location: "Muskegon, MI",
    href: "https://hemispheredesignworks.com",
    highlights: [
      "Led a two-person team that replaced legacy .NET tools with Sandbar, an operations platform for 100+ employees covering purchasing, engineering changes, expenditure tracking, and reporting.",
      "In a typical year, Sandbar tracked 14,000+ purchase requests and coordinated 15,000+ dock appointments across four locations.",
      "Designed its SQL Server database and role-based approval workflows, built shipment tracking, and integrated a catalog of 150+ Crystal Reports.",
    ],
    technology: ["Node.js", "Express", "Vue.js", "SQL Server", "Crystal Reports"],
    related: [{ project: "Sandbar" }, { project: "Harbor" }, { project: "Lighthouse" }],
  },
  {
    rangeLabel: "2012 — 2014",
    title: "Developer",
    company: "Johnston Boiler Company",
    location: "Ferrysburg, MI",
    href: "https://johnstonboiler.com",
    highlights: [
      "Built a C# desktop quoting tool that read Excel price books and filtered out incompatible options as sales staff built quotes for specialized orders, reducing ordering errors.",
    ],
    technology: ["C#", ".NET", "Excel"],
    related: [{ project: "Sales Assistant" }],
  },
];
</script>

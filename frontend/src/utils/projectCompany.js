import { slugify } from "./slug.js";

export const employerProjectFilters = [
  { company: "bluemodus", label: "BlueModus clients" },
  { company: "premium-data-360", label: "Premium Data 360" },
  { company: "hemisphere-design-works", label: "Hemisphere Design Works" },
  { company: "johnston-boiler-company", label: "Johnston Boiler Company" },
];

export function matchesProjectCompany(id, project, company) {
  // The agency's own site belongs in All projects, outside its client collection.
  if (company === "bluemodus" && id === "bluemodus") return false;
  return slugify(project?.companyName) === company;
}

export function projectsFilterLocation(company) {
  return { path: "/projects", query: company ? { company } : {} };
}

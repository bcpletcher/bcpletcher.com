import { slugify } from "@/utils/slug.js";

// Kentico Site of the Year recognition, from the résumé and checked against Kentico's pages
// (work archive notes). Keyed by project-name slug so it follows the project card wherever it
// appears. Short labels: they sit in the card meta row. Only sites where the UX/UI role is
// clear get a badge; the Experience section lists the rest as sites worked on.
const RECOGNITION = {
  "broan-best-range-hoods": "Kentico Site of the Year · Category winner, 2021",
  flow: "Kentico Site of the Year · Category winner, 2023",
  ball: "Kentico Site of the Year · Finalist, 2021",
  "lexitas-legal": "Kentico Site of the Year · Finalist, 2022",
  "alcohol-detection-systems": "Kentico Site of the Year · Honorable mention, 2023",
};

/** The recognition label for a project name, or "" when it has none. */
export function recognitionFor(projectName) {
  return RECOGNITION[slugify(projectName)] || "";
}

// The overall summary shown in the Experience section.
export const RECOGNITION_SUMMARY = {
  title: "Kentico Site of the Year, 2021–2025",
  text: "Client sites I worked on earned 13 recognitions across 12 projects, including four category wins.",
  groups: [
    {
      label: "Category winners",
      items: [
        "Broan Best Range Hoods (2021)",
        "Flow Waterjet (2023)",
        "LivaNova and American Society of Landscape Architects (2025)",
      ],
    },
    {
      label: "Finalists",
      items: [
        "Ball, Red Rover and Ontario Physicians and Surgeons Discipline Tribunal (2021)",
        "Lexitas, Steinbach Credit Union and LivaNova (2022)",
      ],
    },
    {
      label: "Honorable mentions",
      items: [
        "Alcohol Detection Systems and Texas Association of Counties (2023)",
        "Best Best & Krieger (2025)",
      ],
    },
  ],
};

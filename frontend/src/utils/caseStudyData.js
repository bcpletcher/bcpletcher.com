// Case studies live on the project record (D1 `caseStudy`, images in R2) and are edited in
// the admin. Until a project has one saved there, the static copy in
// constants/caseStudyContent.js is used as a fallback so the site never loses a page.
import {
  CASE_STUDY_CONTENT,
  DEFAULT_ROLE,
} from "@/constants/caseStudyContent.js";
import { CASE_STUDY_SLUGS } from "@/constants/caseStudies.js";
import { buildResponsiveImageSourcesFromImageValue } from "@/utils/mediaStorageImages.js";
import { slugify } from "@/utils/slug.js";

export const caseStudyPath = (slug) => `/work/${slug}`;

export function sectionId(title, index) {
  const base = slugify(title);
  return `cs-${base || "section"}-${index + 1}`;
}

export function findProjectBySlug(projects, slug) {
  if (!projects || !slug) return null;
  return (
    Object.values(projects).find(
      (p) => !p?.hidden && slugify(p?.projectName || p?.title) === slug,
    ) || null
  );
}

const sourcesFor = (image) => {
  const sources = buildResponsiveImageSourcesFromImageValue(image, {
    widths: [480, 960],
  });
  return { src: sources.src, srcset: sources.srcset || "" };
};

function normalizeStored(cs) {
  return {
    source: "storage",
    published: Boolean(cs.published),
    summary: cs.summary || "",
    role: cs.role || DEFAULT_ROLE,
    roleNote: cs.roleNote || "",
    focus: cs.focus || "",
    industry: cs.industry || "",
    stack: Array.isArray(cs.stack) ? cs.stack : [],
    sections: (cs.sections || []).map((s, i) => ({
      id: sectionId(s.title, i),
      title: s.title,
      body: s.body || [],
      points: s.points || [],
      figures: (s.figures || []).map((f, n) =>
        f.kind === "compare"
          ? {
              key: `f-${i}-${n}`,
              kind: "compare",
              before: sourcesFor(f.before),
              after: sourcesFor(f.after),
              beforeAlt: f.beforeAlt || "Before",
              afterAlt: f.afterAlt || "After",
              caption: f.caption || "",
            }
          : {
              key: `f-${i}-${n}`,
              kind: "image",
              ...sourcesFor(f.image),
              alt: f.alt || "",
              caption: f.caption || "",
            },
      ),
    })),
  };
}

const LEGACY_SECTION_ORDER = ["The problem", "My role", "Process", "Outcome"];

function normalizeLegacy(content) {
  const titles = LEGACY_SECTION_ORDER.filter((t) => content.sections?.[t]);
  return {
    source: "legacy",
    published: true,
    summary: content.summary || "",
    role: content.role || DEFAULT_ROLE,
    roleNote: content.roleNote || "",
    focus: content.focus || "",
    industry: content.industry || "",
    stack: content.stack || [],
    sections: titles.map((title, i) => {
      const s = content.sections[title];
      return {
        id: sectionId(title, i),
        title,
        body: s.body || [],
        points: s.points || [],
        figures: (s.figures || []).map((f, n) =>
          f.kind === "compare"
            ? {
                key: `f-${i}-${n}`,
                kind: "compare",
                before: { src: f.before, srcset: "" },
                after: { src: f.after, srcset: "" },
                beforeAlt: f.beforeAlt,
                afterAlt: f.afterAlt,
                caption: f.caption || "",
              }
            : {
                key: `f-${i}-${n}`,
                kind: "image",
                src: f.src,
                srcset: "",
                alt: f.alt || "",
                caption: f.caption || "",
              },
        ),
      };
    }),
  };
}

/**
 * The case study for a slug, normalised for rendering, or null when the project has none.
 * `published` is false for a saved draft (the page exists but is not linked or indexed).
 */
export function resolveCaseStudy(projects, slug) {
  const stored = findProjectBySlug(projects, slug)?.caseStudy;
  if (stored && Array.isArray(stored.sections)) return normalizeStored(stored);
  if (CASE_STUDY_CONTENT[slug]) return normalizeLegacy(CASE_STUDY_CONTENT[slug]);
  return null;
}

/** True when cards and the lightbox should link to the case study. */
export function hasPublishedCaseStudy(projects, slug) {
  const stored = findProjectBySlug(projects, slug)?.caseStudy;
  if (stored) return Boolean(stored.published);
  return CASE_STUDY_SLUGS.includes(slug);
}

export function caseStudyHrefFor(projects, projectName) {
  const slug = slugify(projectName);
  return hasPublishedCaseStudy(projects, slug) ? caseStudyPath(slug) : "";
}

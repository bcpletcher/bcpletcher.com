// Projects that have a written case study. Add a project's slug (see utils/slug.js,
// e.g. "my-project") once its page at /work/<slug> has real content: the lightbox then
// shows a "Case study" link for it. Pages for slugs not listed here still render (as a
// preview stub, not indexed) but nothing links to them.
export const CASE_STUDY_SLUGS = ["community-transit"];

export const hasCaseStudy = (slug) => CASE_STUDY_SLUGS.includes(slug);
export const caseStudyPath = (slug) => `/work/${slug}`;

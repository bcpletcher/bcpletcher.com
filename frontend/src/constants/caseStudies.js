// Legacy fallback: slugs whose written case study still lives in code
// (constants/caseStudyContent.js) rather than on the project record. New case studies are
// written in the admin and saved with the project; once a project has one saved there, this
// list is ignored for it. Safe to remove an entry after its case study is saved in the admin.
export const CASE_STUDY_SLUGS = ["community-transit"];

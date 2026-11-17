// Admin modals (create/edit project, edit case study) are mounted once, by the admin dock.
// Anything else in the app (card controls, the dock's own list) opens them through these
// helpers, so they work from every page and there is a single instance of each modal.
let handlers = {};

/** Called by the dock to register the modal openers. Returns an unregister function. */
export function registerAdminActions(next) {
  handlers = next;
  return () => {
    if (handlers === next) handlers = {};
  };
}

export function useAdminActions() {
  return {
    createProject: () => handlers.create?.(),
    editProject: (id) => handlers.edit?.(id),
    editCaseStudy: (id) => handlers.caseStudy?.(id),
  };
}

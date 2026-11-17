// Per-route head tweaks that index.html can't know about (document title, robots).
const DEFAULT_TITLE = "Benjamin Pletcher - Senior Full-Stack Engineer & Technical Lead";

export function setPageTitle(title) {
  if (typeof document === "undefined") return;
  document.title = title || DEFAULT_TITLE;
}

// Adds (or removes) <meta name="robots" content="noindex"> for pages that are not ready.
export function setNoIndex(on) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector('meta[name="robots"][data-dynamic]');
  if (!on) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "robots");
    tag.setAttribute("data-dynamic", "robots");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", "noindex");
}

const DEFAULT_ORIGIN = "https://www.bcpletcher.com";

function getOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  // Build-time / SSR safety
  return import.meta.env.VITE_SITE_ORIGIN || DEFAULT_ORIGIN;
}

function normalizePath(pathname) {
  if (!pathname) return "/";
  // Ensure leading slash
  let p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  // Only keep trailing slash for root
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p;
}

export function setCanonical(pathname) {
  if (typeof document === "undefined") return;

  const origin = getOrigin();
  const path = normalizePath(pathname);
  const href = `${origin}${path}${path === "/" ? "/" : ""}`;

  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);

  // Keep og:url in sync (helps share previews and Lighthouse hints)
  const og = document.querySelector('meta[property="og:url"]');
  if (og) og.setAttribute("content", href);
}


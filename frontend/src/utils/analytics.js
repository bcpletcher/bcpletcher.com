// Minimal GA loader that avoids BFCache blockers.
// We *only* load analytics during normal navigations.
// On pageshow from BFCache, we don't re-initialize GA (and that keeps BFCache eligible).

export function initAnalytics() {
  // Skip analytics for local dev / tests
  if (import.meta.env.DEV) return;

  const gaId = import.meta.env.VITE_GA_ID || "";
  if (!gaId) return;

  let initialized = false;

  const load = () => {
    if (initialized) return;
    initialized = true;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    window.gtag("js", new Date());
    window.gtag("config", gaId, { send_page_view: true });
  };

  window.addEventListener(
    "pageshow",
    (e) => {
      if (e && e.persisted) return;
      load();
    },
    { once: true }
  );

  setTimeout(load, 1500);
}

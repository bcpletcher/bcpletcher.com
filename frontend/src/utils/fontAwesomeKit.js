let kitPromise;

/**
 * Loads the Font Awesome kit script once.
 *
 * We intentionally do this at runtime so we can skip loading it for routes like
 * `/resume` where we want the fastest possible first paint.
 */
export function loadFontAwesomeKit() {
  if (typeof document === "undefined") return Promise.resolve();
  if (kitPromise) return kitPromise;

  kitPromise = new Promise((resolve, reject) => {
    // Already present?
    const existing = document.querySelector(
      'script[data-fa-kit="true"], script[src*="kit.fontawesome.com/b5b13ceb62.js"]'
    );
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://kit.fontawesome.com/b5b13ceb62.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.dataset.faKit = "true";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Font Awesome kit"));

    document.head.appendChild(script);
  });

  return kitPromise;
}

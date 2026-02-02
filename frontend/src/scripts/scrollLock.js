// Scroll lock helpers.
//
// Used to prevent scrollbar/layout jitter while the fullscreen loader is visible.
//
// Notes:
// - We lock BOTH html + body because different browsers attach scrolling
//   to different roots.
// - We compensate for scrollbar width with paddingRight so the page width
//   doesn't jump when the scrollbar disappears.

let restore = null;

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (restore) return; // already locked

  const bodyStyle = document.body.style;
  const htmlStyle = document.documentElement.style;

  const prevBodyOverflow = bodyStyle.overflow;
  const prevBodyOverflowY = bodyStyle.overflowY;
  const prevBodyPaddingRight = bodyStyle.paddingRight;

  const prevHtmlOverflow = htmlStyle.overflow;
  const prevHtmlOverflowY = htmlStyle.overflowY;
  const prevHtmlPaddingRight = htmlStyle.paddingRight;

  // Preserve layout width by compensating for scrollbar removal.
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  bodyStyle.overflow = "hidden";
  bodyStyle.overflowY = "hidden";
  htmlStyle.overflow = "hidden";
  htmlStyle.overflowY = "hidden";

  if (scrollbarWidth > 0) {
    bodyStyle.paddingRight = `${scrollbarWidth}px`;
    htmlStyle.paddingRight = `${scrollbarWidth}px`;
  }

  restore = () => {
    bodyStyle.overflow = prevBodyOverflow;
    bodyStyle.overflowY = prevBodyOverflowY;
    bodyStyle.paddingRight = prevBodyPaddingRight;

    htmlStyle.overflow = prevHtmlOverflow;
    htmlStyle.overflowY = prevHtmlOverflowY;
    htmlStyle.paddingRight = prevHtmlPaddingRight;

    restore = null;
  };
}

export function unlockBodyScroll() {
  restore?.();
}

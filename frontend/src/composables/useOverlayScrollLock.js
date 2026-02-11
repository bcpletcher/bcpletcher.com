import { onBeforeUnmount, watchEffect } from "vue";

// Overlay scroll lock (clean + stable)
//
// Contract:
// - Never touch <html> styles (no overflow changes, no scrollbar-gutter).
// - Prevent background scroll reliably (desktop + iOS): body fixed + event suppression.
// - Avoid content shift when scrollbar disappears: compensate with body padding-right.
// - Reference counted.

let lockCount = 0;
let restoreFn = null;

let lockedScrollY = 0;
let lockedScrollbarWidth = 0;

const PASSIVE_FALSE = { passive: false };
let listenersAttached = false;

function isEditableTarget(target) {
  const t = target;
  const tag = t?.tagName?.toLowerCase?.();
  return (
    tag === "input" ||
    tag === "textarea" ||
    t?.isContentEditable === true ||
    t?.getAttribute?.("role") === "textbox"
  );
}

function hasScrollableAncestor(target) {
  if (typeof document === "undefined") return false;
  let el = target;
  // Walk up until body; if any ancestor can scroll, allow wheel/touch to proceed.
  while (el && el !== document.body && el !== document.documentElement) {
    try {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        const canScrollY =
          (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
          el.scrollHeight > el.clientHeight;
        const canScrollX =
          (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") &&
          el.scrollWidth > el.clientWidth;

        if (canScrollY || canScrollX) return true;
      }
    } catch {
      // ignore
    }
    el = el.parentElement;
  }
  return false;
}

function preventScrollEvent(e) {
  if (lockCount <= 0) return;
  // Allow scrolling inside scrollable containers (e.g., modal bodies).
  if (isEditableTarget(e.target)) return;
  if (hasScrollableAncestor(e.target)) return;
   e.preventDefault?.();
}

function preventKeyScroll(e) {
  if (lockCount <= 0) return;
  if (isEditableTarget(e.target)) return;

  const keys = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
    "Spacebar",
  ]);

  if (!keys.has(e.key)) return;
  e.preventDefault?.();
}

function attachListeners() {
  if (typeof document === "undefined") return;
  if (listenersAttached) return;
  listenersAttached = true;

  document.addEventListener("wheel", preventScrollEvent, {
    ...PASSIVE_FALSE,
    capture: true,
  });
  document.addEventListener("touchmove", preventScrollEvent, {
    ...PASSIVE_FALSE,
    capture: true,
  });
  document.addEventListener("keydown", preventKeyScroll, true);
}

function detachListeners() {
  if (typeof document === "undefined") return;
  if (!listenersAttached) return;
  listenersAttached = false;

  document.removeEventListener("wheel", preventScrollEvent, true);
  document.removeEventListener("touchmove", preventScrollEvent, true);
  document.removeEventListener("keydown", preventKeyScroll, true);
}

function getScrollbarWidthPx() {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;

  // If there is no scrollbar (overlay scrollbars/macOS), this will be 0.
  const docEl = document.documentElement;
  const width = window.innerWidth - docEl.clientWidth;
  return Number.isFinite(width) ? Math.max(0, width) : 0;
}

function parsePx(v) {
  if (!v) return 0;
  const n = Number(String(v).replace("px", ""));
  return Number.isFinite(n) ? n : 0;
}

export function overlayScrollLock() {
  if (typeof document === "undefined") return () => {};

  lockCount += 1;

  // Nested lock: do not re-compute scrollbar width/padding; outermost lock owns it.
  if (restoreFn) {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      overlayScrollUnlock();
    };
  }

  const bodyStyle = document.body.style;

  lockedScrollY = typeof window !== "undefined" ? window.scrollY || 0 : 0;
  lockedScrollbarWidth = getScrollbarWidthPx();

  const prev = {
    bodyPosition: bodyStyle.position,
    bodyTop: bodyStyle.top,
    bodyLeft: bodyStyle.left,
    bodyRight: bodyStyle.right,
    bodyWidth: bodyStyle.width,
    bodyMaxWidth: bodyStyle.maxWidth,
    bodyOverflow: bodyStyle.overflow,
    bodyOverflowY: bodyStyle.overflowY,
    bodyPaddingRight: bodyStyle.paddingRight,
  };

  // Only add padding when there is an actual layout scrollbar.
  if (lockedScrollbarWidth > 0) {
    const prevPad = parsePx(prev.bodyPaddingRight);
    bodyStyle.paddingRight = `${prevPad + lockedScrollbarWidth}px`;
  }

  // Freeze body.
  bodyStyle.position = "fixed";
  bodyStyle.top = `-${lockedScrollY}px`;
  bodyStyle.left = "0";
  bodyStyle.right = "0";
  bodyStyle.width = "100%";
  bodyStyle.maxWidth = "100%";
  bodyStyle.overflow = "hidden";
  bodyStyle.overflowY = "hidden";

  attachListeners();

  restoreFn = () => {
    if (lockCount > 0) return;

    detachListeners();

    bodyStyle.position = prev.bodyPosition;
    bodyStyle.top = prev.bodyTop;
    bodyStyle.left = prev.bodyLeft;
    bodyStyle.right = prev.bodyRight;
    bodyStyle.width = prev.bodyWidth;
    bodyStyle.maxWidth = prev.bodyMaxWidth;
    bodyStyle.overflow = prev.bodyOverflow;
    bodyStyle.overflowY = prev.bodyOverflowY;
    bodyStyle.paddingRight = prev.bodyPaddingRight;

    if (typeof window !== "undefined") {
      window.scrollTo(0, lockedScrollY);
    }

    lockedScrollbarWidth = 0;
    restoreFn = null;
  };

  let released = false;
  return () => {
    if (released) return;
    released = true;
    overlayScrollUnlock();
  };
}

export function overlayScrollUnlock() {
  if (typeof document === "undefined") return;
  if (lockCount <= 0) return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) restoreFn?.();
}

export function useOverlayScrollLock(isLockedGetter) {
  let release = null;

  watchEffect(() => {
    const shouldLock = typeof isLockedGetter === "function" && isLockedGetter();
    if (shouldLock) {
      if (!release) release = overlayScrollLock();
    } else {
      release?.();
      release = null;
    }
  });

  onBeforeUnmount(() => {
    release?.();
    release = null;
  });
}

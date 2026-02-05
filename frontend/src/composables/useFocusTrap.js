// Lightweight focus trap for dialogs/modals.
// Contract:
// - Call activate() after the dialog is in the DOM (nextTick).
// - Provide a container element that contains ALL focusable elements.
// - Returns cleanup() to remove listeners.

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      // Filter out elements not actually visible/focusable.
      const style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      if (el.hasAttribute('disabled')) return false;
      return true;
    },
  );
}

export function useFocusTrap() {
  let containerEl = null;
  let previouslyFocused = null;
  let onKeydown = null;

  const activate = ({ container, initialFocus } = {}) => {
    if (typeof window === 'undefined') return;
    containerEl = container || null;
    previouslyFocused = document.activeElement;

    // Ensure container is programmatically focusable.
    if (containerEl && containerEl instanceof HTMLElement) {
      if (!containerEl.hasAttribute('tabindex')) {
        containerEl.setAttribute('tabindex', '-1');
      }
    }

    const focusInitial = () => {
      const focusTarget = initialFocus || getFocusable(containerEl)[0] || containerEl;
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus({ preventScroll: true });
      }
    };

    onKeydown = (e) => {
      if (e.key !== 'Tab') return;
      if (!containerEl) return;

      const focusable = getFocusable(containerEl);
      if (!focusable.length) {
        e.preventDefault();
        (containerEl || document.body).focus?.({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !containerEl.contains(active)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener('keydown', onKeydown, true);
    // Defer to allow DOM to paint.
    setTimeout(focusInitial, 0);
  };

  const restore = () => {
    try {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    } catch {
      // no-op
    }
  };

  const cleanup = () => {
    try {
      if (onKeydown) document.removeEventListener('keydown', onKeydown, true);
    } catch {
      // no-op
    }
    onKeydown = null;
    containerEl = null;
    restore();
    previouslyFocused = null;
  };

  return { activate, cleanup, restore };
}

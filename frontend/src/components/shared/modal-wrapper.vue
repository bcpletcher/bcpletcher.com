<template>
  <teleport to="body">
    <Transition
      appear
      :enter-active-class="enterActiveClass"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      :leave-active-class="leaveActiveClass"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        ref="rootRef"
        class="fixed inset-0 w-screen h-screen"
        :class="[zClass, debug ? 'outline-2 outline-fuchsia-500 -outline-offset-2' : '']"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledby"
        :aria-describedby="describedby"
        tabindex="-1"
        @keydown.esc.stop.prevent="onEscape"
      >
        <!-- Backdrop (non-button so it won't interfere with wheel scrolling in Chrome) -->
        <div
          class="absolute inset-0"
          :class="backdropClass"
          aria-hidden="true"
        >
          <div
            class="absolute inset-0 bg-black/70"
            @click="onBackdrop"
          />
        </div>

        <div
          class="absolute inset-0 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10"
          @click.stop
        >
          <slot />
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useFocusTrap } from "@/composables/useFocusTrap.js";
import { useOverlayScrollLock } from "@/composables/useOverlayScrollLock.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  labelledby: { type: String, default: null },
  describedby: { type: String, default: null },
  zClass: { type: String, default: "z-200" },
  backdropClass: { type: String, default: "" },
  closeOnBackdrop: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true },

  // Standard behaviors
  lockScroll: { type: Boolean, default: true },

  // Focus management
  // - if provided, will focus that element when opening (string selector within root)
  // - otherwise focuses the root
  initialFocusSelector: { type: String, default: null },

  // Optional panel animation: selector within the modal root.
  // If set, we apply a consistent transform animation on open/close.
  panelSelector: { type: String, default: null },

  debug: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "close", "opened", "closed"]);

const rootRef = ref(null);

const { activate: trapFocus, cleanup: cleanupFocusTrap } = useFocusTrap();

function requestClose(reason) {
  emit("update:modelValue", false);
  emit("close", reason);
}

function onBackdrop() {
  if (!props.closeOnBackdrop) return;
  requestClose("backdrop");
}

function onEscape() {
  if (!props.closeOnEscape) return;
  requestClose("escape");
}

function getPanelEl() {
  const root = rootRef.value;
  if (!root || !props.panelSelector) return null;
  return root.querySelector(props.panelSelector);
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const enterActiveClass = computed(() =>
  prefersReducedMotion
    ? "transition-opacity duration-75 ease-out"
    : "transition-opacity duration-200 ease-out",
);

const leaveActiveClass = computed(() =>
  prefersReducedMotion
    ? "transition-opacity duration-75 ease-in"
    : "transition-opacity duration-150 ease-in",
);

async function animatePanelOpen() {
  if (prefersReducedMotion) return;
  const panel = getPanelEl();
  if (!panel) return;

  // Reset first so repeated opens don't accumulate.
  panel.style.willChange = "transform, opacity";
  panel.style.opacity = "0";
  panel.style.transform = "translateY(14px) scale(0.985)";

  // Next frame -> transition in.
  await new Promise((r) => requestAnimationFrame(r));
  panel.style.transition = "transform 380ms cubic-bezier(.22,1,.36,1), opacity 240ms ease-out";
  panel.style.opacity = "1";
  panel.style.transform = "translateY(0) scale(1)";
}

async function animatePanelClose() {
  if (prefersReducedMotion) return;
  const panel = getPanelEl();
  if (!panel) return;

  panel.style.willChange = "transform, opacity";
  panel.style.transition = "transform 220ms ease-in-out, opacity 220ms ease-in-out";
  panel.style.opacity = "0";
  panel.style.transform = "translateY(10px) scale(0.99)";
}

// Lock background scroll while the modal is open.
useOverlayScrollLock(() => props.lockScroll && props.modelValue);

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await nextTick();

      // Focus trap inside the modal root.
      const container = rootRef.value;
      if (container) {
        let initialFocus = container;
        if (props.initialFocusSelector) {
          const found = container.querySelector(props.initialFocusSelector);
          if (found) initialFocus = found;
        }

        trapFocus({
          container,
          initialFocus,
        });
      }

      // Panel animation (optional)
      await animatePanelOpen();

      emit("opened");
    } else {
      // animate close first (so it plays while wrapper fades out)
      await animatePanelClose();

      cleanupFocusTrap();
      emit("closed");
    }
  },
  { immediate: true, flush: "post" },
);

onBeforeUnmount(() => {
  cleanupFocusTrap();
});
</script>

<style scoped>
</style>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed left-0 top-0 z-10000 w-dvw h-dvh"
      role="dialog"
      aria-modal="true"
      aria-label="Admin login"
      @keydown.esc.stop.prevent
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <!-- Panel -->
      <div class="absolute inset-0 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
        <div
          class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur"
        >
          <header class="border-b border-white/10 px-4 py-6 sm:px-6">
            <div class="flex items-center gap-3">
              <img
                class="h-8 w-8 opacity-90"
                src="./../../assets/images/logo.svg"
                alt="BP Logo"
              />
              <div class="min-w-0">
                <p class="text-xs font-semibold tracking-widest uppercase text-slate-400">
                  Admin
                </p>
              </div>
            </div>
          </header>

          <div class="px-4 py-4 sm:px-6 sm:py-5">
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-xs font-semibold tracking-widest uppercase text-slate-400">Email</label>
                <input
                  v-model="credentials.email"
                  type="email"
                  autocomplete="email"
                  required
                  :disabled="isLoading"
                  class="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold tracking-widest uppercase text-slate-400">Password</label>
                <input
                  v-model="credentials.password"
                  type="password"
                  autocomplete="current-password"
                  required
                  :disabled="isLoading"
                  class="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:opacity-60 disabled:cursor-not-allowed"
                  @keydown.enter.prevent="signIn()"
                />
              </div>

              <div class="flex justify-end pt-1">
                <button
                  class="btn-primary"
                  :disabled="isLoading"
                  @click="signIn"
                >
                  <span v-if="isLoading">Signing In…</span>
                  <span v-else>Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useNotificationStore } from "@/stores/notification.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const credentials = ref({
  email: "",
  password: "",
});

const visible = computed(() => settingsStore.showAdminModal);

// If the user is already signed in (or becomes signed in), never show the login modal.
watch(
  () => settingsStore.isSignedIn,
  (signedIn) => {
    if (signedIn && settingsStore.showAdminModal) {
      settingsStore.showAdminModal = false;
    }
  },
  { immediate: true },
);

const signIn = () => {
  if (settingsStore.isSignedIn) {
    settingsStore.showAdminModal = false;
    notificationStore.addNotification({
      variant: "success",
      title: "Admin",
      message: "You’re already signed in.",
      duration: 4,
    });
    return;
  }

  if (isLoading.value) return;

  const email = (credentials.value.email || "").toString().trim();
  const password = (credentials.value.password || "").toString();

  // Client-side required validation
  if (!email) {
    notificationStore.addNotification({
      variant: "danger",
      title: "Authentication",
      message: "Please enter your email.",
      duration: 4,
    });
    return;
  }

  if (!password) {
    notificationStore.addNotification({
      variant: "danger",
      title: "Authentication",
      message: "Please enter your password.",
      duration: 4,
    });
    return;
  }

  isLoading.value = true;

  firebaseStore
    .adminSignIn(email, password)
    .then(() => {
      // Auth state is synced globally in app boot.
      // Close modal immediately; banner/session state will reflect shortly.
      settingsStore.showAdminModal = false;
    })
    .catch((errMsg) => {
      isLoading.value = false;

      const raw = (errMsg || "").toString().toLowerCase();

      // Never leak auth codes to the UI.
      // Treat credential issues as a single generic message.
      const isCredentialError =
        raw.includes("invalid") ||
        raw.includes("wrong") ||
        raw.includes("user-not-found") ||
        raw.includes("missing-password") ||
        raw.includes("invalid-credential") ||
        raw.includes("auth/");

      const message = isCredentialError
        ? "Invalid credentials."
        : "Sign-in failed. Please try again.";

      notificationStore.addNotification({
        variant: "danger",
        title: "Authentication",
        message,
        duration: 5,
      });
    });
};

// Lock background scroll while the login modal is mounted.
const SCROLL_LOCK_KEY = "__bc_scroll_lock_count__";

function getLockCount() {
  return Number(document.documentElement.dataset[SCROLL_LOCK_KEY] || 0);
}

function setLockCount(val) {
  document.documentElement.dataset[SCROLL_LOCK_KEY] = String(val);
}

function getScrollbarWidth() {
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

function lockBodyScroll() {
  const count = getLockCount();
  if (count === 0) {
    document.documentElement.dataset.__bc_prev_html_overflow__ =
      document.documentElement.style.overflow || "";
    document.documentElement.dataset.__bc_prev_html_padding_right__ =
      document.documentElement.style.paddingRight || "";
    document.body.dataset.__bc_prev_body_overflow__ =
      document.body.style.overflow || "";
    document.body.dataset.__bc_prev_body_padding_right__ =
      document.body.style.paddingRight || "";

    const sbw = getScrollbarWidth();

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (sbw > 0) {
      document.documentElement.style.paddingRight = `${sbw}px`;
      document.body.style.paddingRight = `${sbw}px`;
    }
  }
  setLockCount(count + 1);
}

function unlockBodyScroll() {
  const count = getLockCount();
  if (count <= 1) {
    document.documentElement.style.overflow =
      document.documentElement.dataset.__bc_prev_html_overflow__ || "";
    document.documentElement.style.paddingRight =
      document.documentElement.dataset.__bc_prev_html_padding_right__ || "";
    document.body.style.overflow =
      document.body.dataset.__bc_prev_body_overflow__ || "";
    document.body.style.paddingRight =
      document.body.dataset.__bc_prev_body_padding_right__ || "";

    delete document.documentElement.dataset.__bc_prev_html_overflow__;
    delete document.documentElement.dataset.__bc_prev_html_padding_right__;
    delete document.body.dataset.__bc_prev_body_overflow__;
    delete document.body.dataset.__bc_prev_body_padding_right__;

    setLockCount(0);
  } else {
    setLockCount(count - 1);
  }
}

watch(
  visible,
  (isOpen) => {
    if (isOpen) lockBodyScroll();
    else unlockBodyScroll();
  },
  { flush: "post", immediate: true },
);

// No need for a component unmount hook; the modal is always mounted in App.vue.
// Keep reset/cleanup when the modal closes.
watch(
  visible,
  (isOpen, wasOpen) => {
    if (wasOpen && !isOpen) {
      isLoading.value = false;
      credentials.value = { email: "", password: "" };
    }
  },
  { flush: "post" },
);
</script>

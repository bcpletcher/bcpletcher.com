<template>
  <ModalWrapper
    v-model="internalOpen"
    :labelledby="titleId"
    :describedby="descId"
    z-class="z-10000"
    :initial-focus-selector="'input[type=email]'"
    panel-selector="[data-modal-panel]"
    @close="close"
  >
    <div
      ref="panelRef"
      data-modal-panel
      class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur"
      @click.stop
    >
      <header class="flex items-start justify-between gap-4 px-5 pt-5 pb-1 sm:px-6 sm:pt-6">
        <div class="flex min-w-0 items-center gap-3">
          <img
            class="h-9 w-9 shrink-0 opacity-90"
            src="./../../assets/images/logo.svg"
            alt=""
            aria-hidden="true"
          />
          <div class="min-w-0">
            <h2 :id="titleId" class="text-lg font-semibold leading-tight text-slate-100">
              Admin sign in
            </h2>
            <p :id="descId" class="text-sm text-slate-400">
              Manage projects and case studies.
            </p>
          </div>
        </div>

        <button
          ref="closeButtonRef"
          type="button"
          class="kbd-focus -mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-standard hover:bg-white/10 hover:text-slate-100"
          aria-label="Close"
          @click="close"
        >
          <AppIcon icon="fa-regular fa-xmark" aria-hidden="true" />
        </button>
      </header>

      <!-- A real form with username + current-password, so password managers can fill and save. -->
      <form class="flex flex-col gap-4 px-5 pt-4 pb-5 sm:px-6 sm:pb-6" novalidate @submit.prevent="signIn">
        <div>
          <label
            :for="emailId"
            class="block text-xs font-semibold tracking-widest text-slate-400 uppercase"
          >Email</label>
          <input
            :id="emailId"
            ref="emailInputRef"
            v-model="credentials.email"
            type="email"
            name="username"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            inputmode="email"
            required
            :disabled="isLoading"
            :aria-invalid="errorMessage ? 'true' : undefined"
            :aria-describedby="errorMessage ? errorId : undefined"
            class="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            @input="errorMessage = ''"
          />
        </div>

        <div>
          <label
            :for="passwordId"
            class="block text-xs font-semibold tracking-widest text-slate-400 uppercase"
          >Password</label>
          <div class="relative mt-2">
            <input
              :id="passwordId"
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              required
              :disabled="isLoading"
              :aria-invalid="errorMessage ? 'true' : undefined"
              :aria-describedby="errorMessage ? errorId : undefined"
              class="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pr-11 pl-3 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              @input="errorMessage = ''"
            />
            <button
              type="button"
              class="kbd-focus absolute inset-y-0 right-0 inline-flex w-10 cursor-pointer items-center justify-center rounded-r-lg text-slate-400 transition-standard hover:text-slate-100"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <AppIcon :icon="showPassword ? 'fa-light fa-eye-slash' : 'fa-light fa-eye'" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p
          v-if="errorMessage"
          :id="errorId"
          class="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          class="kbd-focus inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-sky-300 px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isLoading"
        >
          {{ isLoading ? "Signing in…" : "Sign in" }}
        </button>
      </form>
    </div>
  </ModalWrapper>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import ModalWrapper from "@/components/shared/modal-wrapper.vue";
import { useCloudflareStore } from "@/stores/cloudflare.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useNotificationStore } from "@/stores/notification.js";

const cloudflareStore = useCloudflareStore();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const credentials = ref({
  email: "",
  password: "",
});
const showPassword = ref(false);
const errorMessage = ref("");
const emailInputRef = ref(null);
const panelRef = ref(null);
const closeButtonRef = ref(null);

const visible = computed(() => settingsStore.showAdminModal);
const titleId = `admin-login-title-${Math.random().toString(36).slice(2)}`;
const descId = `admin-login-desc-${Math.random().toString(36).slice(2)}`;
const emailId = `admin-login-email-${Math.random().toString(36).slice(2)}`;
const passwordId = `admin-login-password-${Math.random().toString(36).slice(2)}`;
const errorId = `admin-login-error-${Math.random().toString(36).slice(2)}`;

// A specific, safe message for each way a sign-in can fail (no details about which field).
function messageFor(error) {
  switch (error?.status) {
    case 401:
      return "Email or password is incorrect.";
    case 429:
      return "Too many attempts. Wait a few minutes and try again.";
    case 403:
      return "Sign-in isn’t allowed from this address. Use www.bcpletcher.com.";
    case undefined:
      return "Can’t reach the server. Check your connection and try again.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

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

const internalOpen = computed({
  get: () => visible.value,
  set: (v) => (settingsStore.showAdminModal = v),
});

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

  errorMessage.value = "";

  if (!email || !password) {
    errorMessage.value = !email
      ? "Enter your email."
      : "Enter your password.";
    return;
  }

  isLoading.value = true;

  cloudflareStore
    .adminSignIn(email, password)
    .then(() => {
      // Auth state is synced globally in app boot.
      settingsStore.showAdminModal = false;
    })
    .catch((error) => {
      isLoading.value = false;
      errorMessage.value = messageFor(error);
    });
};

// No need for a component unmount hook; the modal is always mounted in App.vue.
// Keep reset/cleanup when the modal closes.
watch(
  visible,
  (isOpen, wasOpen) => {
    if (wasOpen && !isOpen) {
      isLoading.value = false;
      showPassword.value = false;
      errorMessage.value = "";
      credentials.value = { email: "", password: "" };
    }
  },
  { flush: "post" },
);

function close() {
  settingsStore.showAdminModal = false;
}
</script>

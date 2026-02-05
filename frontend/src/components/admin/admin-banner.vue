<template>
  <div
    v-if="visible"
    class="fixed top-0 left-0 right-0 z-70 w-full border-b border-amber-400/20 bg-amber-950/80 text-amber-50 backdrop-blur"
    role="status"
    aria-live="polite"
  >
    <div
      class="mx-auto flex w-full max-w-7xl min-h-11 items-center justify-between gap-4 px-6 md:px-12"
    >
      <div class="flex min-w-0 items-center gap-3 py-2.5">
        <span
          class="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
          :class="isEmulatorEnabled ? 'bg-amber-300' : 'bg-sky-300'"
          aria-hidden="true"
        />
        <p class="min-w-0 truncate text-xs font-semibold tracking-widest uppercase">
          <span v-if="settingsStore.isSignedIn">Signed in</span>
          <span v-else>Admin tools</span>
          <span v-if="isEmulatorEnabled" class="opacity-80">
            &nbsp;• Emulator enabled
          </span>
        </p>
      </div>

      <!-- Keep a stable action area so height doesn't change when buttons appear/disappear -->
      <div class="flex items-center gap-2 py-2.5 min-h-11">
        <button
          v-if="isLoggedIn"
          type="button"
          class="kbd-focus cursor-pointer rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-amber-50 hover:bg-white/15 transition-standard"
          @click="openCreate"
        >
          Create Project
        </button>

        <button
          v-if="isLoggedIn"
          type="button"
          class="kbd-focus cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-amber-100/90 hover:bg-amber-900/40 hover:text-amber-50 transition-standard"
          @click="logout"
        >
          Logout
        </button>

        <!-- Spacer to keep height consistent when signed out -->
        <div v-else class="h-7 w-px opacity-0" aria-hidden="true" />
      </div>
    </div>

    <AdminUpsertProject ref="createEntryModalRef" />
  </div>
</template>

<script setup>
import { computed, useTemplateRef } from "vue";
import { signOut } from "firebase/auth";

import AdminUpsertProject from "@/components/admin/admin-upsert-project.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();

const isEmulatorEnabled =
  String(import.meta.env.VITE_USE_EMULATOR).toLowerCase() === "true";

const visible = computed(() => settingsStore.isSignedIn || isEmulatorEnabled);

const isLoggedIn = computed(() => Boolean(settingsStore.user?.uid));

const createEntryModalRef = useTemplateRef("createEntryModalRef");

/**
 * TODO(admin): Clear cache
 * - Clear any client-side caches used for content/scrapbook (localStorage + IndexedDB).
 * - Consider clearing: localStorage keys like `scrapbookCache` and any idb databases.
 * - Should also refresh in-memory store state after clearing.
 *
 * TODO(admin): Verify edits
 * - Add a lightweight "verify" step before persisting admin edits (esp. delete/reorder).
 * - Options: diff preview modal, validation checks, or a simple "Are you sure?".
 * - After save, re-fetch/reconcile with Firestore to ensure UI matches server.
 *
 * TODO(admin): Toggle non-admin view
 * - Provide a banner toggle to temporarily hide admin-only UI while still signed in.
 * - Intended for QA: ensure public layout/behaviors without signing out.
 * - Likely lives in settingsStore (e.g. `adminPreviewPublicMode`) and is checked by admin-only components.
 */

function openCreate() {
  createEntryModalRef.value?.showModal?.();
}

const logout = async () => {
  await signOut(firebaseStore.auth);
  // Defensive: ensure UI updates even if auth listener is elsewhere.
  settingsStore.user = {};
};
</script>

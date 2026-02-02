<template>
  <div class="w-full min-h-screen">
    <object
      v-if="resumeUrl"
      class="w-full h-screen"
      type="application/pdf"
      :data="resumeUrl"
    >
      <div class="p-6 text-slate-300">
        <p>
          Your browser can’t display PDFs inline.
          <a
            class="underline text-sky-300 hover:text-sky-200"
            :href="resumeUrl"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open the resume
          </a>
          .
        </p>
      </div>
    </object>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getDownloadURL, ref as storageRef } from "firebase/storage";

import { useFirebaseStore } from "@/stores/firebase.js";

// Stable storage path (upload/overwrite the resume here).
// This avoids tokenized URLs changing when you upload a new file.
const RESUME_STORAGE_PATH = "Files/bcpletcher-resume.pdf";

const firebaseStore = useFirebaseStore();

const resolvedStorageUrl = ref("");
const error = ref("");

onMounted(async () => {
  try {
    error.value = "";
    resolvedStorageUrl.value = await getDownloadURL(
      storageRef(firebaseStore.storage, RESUME_STORAGE_PATH)
    );
  } catch (e) {
    // If Storage resolution fails (rules/persistence/etc.), fall back to Firestore-supplied URL.
    resolvedStorageUrl.value = "";
    error.value = "Couldn’t load the resume file.";
  }
});

const resumeUrl = computed(() => {
  return resolvedStorageUrl.value || "";
});
</script>

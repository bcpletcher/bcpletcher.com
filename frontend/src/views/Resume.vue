<template>
  <div class="w-full min-h-screen">
    <iframe
      class="h-screen w-full"
      :src="resumeUrl"
      title="Resume PDF"
      loading="lazy"
    />

    <div class="p-6 text-slate-300">
      <p>
        Having trouble viewing the PDF?
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
  </div>
</template>

<script setup>
// Fast-path: the storage object is publicly readable via your rules.
// This URL stays stable as long as you overwrite the same file path.
const resumeUrl =
  "https://firebasestorage.googleapis.com/v0/b/pletcher-portfolio-app.firebasestorage.app/o/Files%2Fbcpletcher-resume.pdf?alt=media";
</script>

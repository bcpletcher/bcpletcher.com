<template>
  <div class="flex items-center gap-5 text-slate-400 text-2xl">
    <a
      v-for="link in links"
      :key="link.label"
      class="hover:text-slate-100 transition-standard"
      :href="link.href"
      :target="link.external ? '_blank' : undefined"
      :rel="link.external ? 'noreferrer' : undefined"
      :aria-label="link.label"
    >
      <i :class="link.iconClass" />
    </a>
  </div>
</template>

<script setup>
const links = [
  {
    label: "GitHub",
    href: "https://github.com/bcpletcher",
    iconClass: "fa fa-brands fa-github",
    external: true,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/bcpletcher",
    iconClass: "fa fa-brands fa-linkedin",
    external: true,
  },
  {
    label: "Email",
    href: "mailto:connect@bcpletcher.com",
    iconClass: "fa fa-regular fa-envelope",
    external: false,
  },
];
</script>

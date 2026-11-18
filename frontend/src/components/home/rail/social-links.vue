<template>
  <ul class="flex items-center gap-3 text-2xl text-slate-400">
    <li v-for="link in links" :key="link.label">
      <a
        class="kbd-focus -m-2.5 flex cursor-pointer p-2.5 hover:text-slate-100 transition-standard"
        :href="link.href"
        :target="link.external ? '_blank' : undefined"
        :rel="link.external ? 'noopener noreferrer' : undefined"
        :aria-label="link.external ? `${link.label} (opens in a new tab)` : link.label"
      >
        <AppIcon :icon="link.iconClass" />
      </a>
    </li>
  </ul>
</template>

<script setup>
import { CONTACT_EMAIL_HREF } from "@/constants/contact.js";

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
    href: CONTACT_EMAIL_HREF,
    iconClass: "fa fa-regular fa-envelope",
    external: false,
  },
];
</script>

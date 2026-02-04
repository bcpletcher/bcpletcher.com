<template>
  <div class="mt-10 lg:mt-auto flex lg:flex-col-reverse gap-14 lg:gap-10">
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
    <a
      class="group/link my-auto inline-flex items-baseline leading-tight text-slate-400 hover:text-sky-300 focus-visible:text-sky-300 font-semibold text-sm tracking-[0.25em] uppercase"
      href="/resume"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Resume (opens in a new tab)"
    >
      <span>
        Resume
        <span class="inline-block">
          <i
            class="fa-solid fa-arrow-up-right ml-1 translate-y-px inline-block h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none group-hover/link:-translate-y-1 group-hover/link:translate-x-1 group-focus-visible/link:-translate-y-1 group-focus-visible/link:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </span>
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

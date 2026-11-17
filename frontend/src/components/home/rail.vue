<template>
  <aside class="relative">
    <MobileSectionNav
      :nav-items="phoneNavItems"
      :active-section-id="activeSectionId"
      @nav="onNav"
    />

    <div class="hidden lg:block">
      <div class="flex min-h-[calc(100vh-12rem)] flex-col">
        <RailIntro :name="name" :title="title" :description="description" />

        <Navigation
          variant="desktop"
          :nav-items="navItems"
          :active-section-id="activeSectionId"
          @nav="onNav"
        />

        <div class="mt-auto pt-10">
          <SocialLinks />
        </div>
      </div>
    </div>

    <!-- Mobile rail content (normal flow) -->
    <div class="pb-10 md:pb-16 lg:hidden">
      <RailIntro :name="name" :title="title" :description="description" />
      <div class="mt-8">
        <SocialLinks />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";

import { useScrollSpy } from "@/composables/useScrollSpy.js";

import Navigation from "@/components/home/rail/navigation.vue";
import RailIntro from "@/components/home/rail/intro.vue";
import SocialLinks from "@/components/home/rail/social-links.vue";
import MobileSectionNav from "@/components/home/rail/mobile-section-nav.vue";

// Hero copy lives here only; swap these three strings to change the headline.
const name = "Benjamin Pletcher";
const title = "Senior Software Engineer";
const description =
  "I build accessible, pixel-perfect digital experiences, from interface to production.";

const props = defineProps({
  navItems: { type: Array, required: true },
});

// Below lg the About section leads the page (see content.vue), so the phone pills and the
// scroll-spy follow that order; the desktop rail keeps the given order.
const phoneNavItems = computed(() => {
  const about = props.navItems.find((n) => n.id === "about");
  return about
    ? [about, ...props.navItems.filter((n) => n.id !== "about")]
    : props.navItems;
});
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

// Scroll-spy + smooth scrolling for this page.
const { activeSectionId, scrollTo } = useScrollSpy({
  sections: () =>
    (isDesktop() ? props.navItems : phoneNavItems.value).map((n) => n.id),
  root: null,
});

const onNav = async (id) => {
   scrollTo(id);
 };
</script>

<template>
  <aside class="relative">
    <MobileSectionNav
      :nav-items="navItems"
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
    <div class="pb-2 md:pb-4 lg:hidden">
      <RailIntro :name="name" :title="title" :description="description">
        <template #after>
          <SocialLinks />
        </template>
      </RailIntro>
    </div>
  </aside>
</template>

<script setup>
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

// Scroll-spy + smooth scrolling for this page.
const { activeSectionId, scrollTo } = useScrollSpy({
  sections: props.navItems.map((n) => n.id),
  root: null,
});

const onNav = async (id) => {
   scrollTo(id);
 };
</script>

<template>
  <div
    class="h-full transition-slow overflow-hidden z-30"
    :class="[contentWidth]"
  >
    <div class="h-full w-full bg-base-sidebar border-r border-base-border">
      <transition name="fade">
        <div v-show="settingsStore.expanded" class="h-full flex flex-col">
          <div class="flex-1 flex flex-col overflow-hidden p-10">
            <div
              :class="settingsStore.expanded ? 'fadeInUp' : ''"
              class="flex justify-between animated"
            >
              <div
                class="h-10 w-10 cursor-pointer"
                :class="{ animationLogo: isHovered }"
                @mouseenter="isHovered = true"
                @mouseleave="isHovered = false"
                @click="goToAdmin()"
              >
                <img
                  v-if="settingsStore.resources"
                  class="w-full h-full"
                  :src="settingsStore.resources.images.logo"
                  alt="BP Logo"
                />
              </div>
              <button
                v-show="isBreakpointOrBelow('sm')"
                class="my-auto border-2 border-font-primary rounded-full px-5 h-8 opacity-50 hover:opacity-100"
                @click="settingsStore.expanded = !settingsStore.expanded"
              >
                <label class="text-font-primary uppercase text-sm leading-none">
                  Hide
                </label>
              </button>
            </div>

            <ul class="flex gap-8 pt-14">
              <li v-for="(item, index) in pages" :key="index">
                <button
                  :class="[
                    'animationTab' + item,
                    { fadeInUp: !settingsStore.expanded },
                    settingsStore.sidebarFocus === item
                      ? 'text-gradient-start after:left-0 after:w-full'
                      : 'after:left-1/2',
                    'animated fadeInUp',
                    'relative transition-standard cursor-pointer pb-[7px]',
                    'text-font-primary uppercase font-bold text-[11px] tracking-[0.2rem]',
                    'after:absolute after:content-[\'\'] after:transition-standard after:bottom-0 after:h-[2px] after:w-0 after:bg-gradient-start ',
                    'hover:text-gradient-start hover:after:w-full hover:after:left-0',
                  ]"
                  @click="settingsStore.sidebarFocus = item"
                >
                  {{ item }}
                </button>
              </li>
            </ul>

            <div
              :class="settingsStore.expanded ? 'fadeIn' : ''"
              class="flex-1 pt-14 overflow-hidden animated animationContent"
            >
              <template v-for="(item, index) in pages" :key="index">
                <component
                  :is="components[item]"
                  v-if="settingsStore.sidebarFocus === item"
                  :ref="item.ref"
                />
              </template>
            </div>
          </div>
          <div class="overflow-hidden border-t border-base-border">
            <ul
              :class="settingsStore.expanded ? 'fadeInUp' : ''"
              class="w-full my-3 p-0 flex gap-12 justify-center animated animationSocial"
            >
              <li v-for="(item, index) in socialLinks" :key="index">
                <a
                  :href="item.href"
                  target="_blank"
                  class="text-md text-font-primary opacity-60 transition-standard hover:opacity-100"
                >
                  <i :class="['fa', item.icon]" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useBreakpoints } from "@/composables/breakpoints";
import { useSettingsStore } from "@/stores/settings.js";
import About from "@/components/navigation/pages/about.vue";
import Contact from "@/components/navigation/pages/contact.vue";
import Experience from "@/components/navigation/pages/experience.vue";
import router from "@/router/index.js";
const { width, isBreakpointOrBelow } = useBreakpoints();

const settingsStore = useSettingsStore();
const isHovered = ref(false);

const components = {
  About,
  Experience,
  Contact,
};
const pages = ["About", "Experience", "Contact"];
const socialLinks = ref([
  {
    href: "https://github.com/bcpletcher",
    icon: "fa-github",
  },
  {
    href: "https://www.linkedin.com/in/bcpletcher",
    icon: "fa-linkedin",
  },
  {
    href: "https://dribbble.com/bcpletcher",
    icon: "fa-dribbble",
  },
]);
const contentWidth = computed(() => {
  if (settingsStore.expanded) {
    return width > 450 ? "w-[450px]" : "w-dvw";
  } else {
    return "w-0";
  }
});

const goToAdmin = () => {
  settingsStore.expanded = false;
  setTimeout(() => {
    router.push("/admin");
  }, 500);
};
</script>

<style lang="scss">
.fade-enter-active {
  transition-delay: 0.5s !important;
  transition: opacity 0.5s;
}
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.animationLogo img {
  animation-duration: 0.75s;
  -webkit-animation-name: rubberBand;
  animation-name: rubberBand;
}
.animationTabAbout {
  animation-duration: 0.75s;
  animation-delay: 0.45s;
}
.animationTabExperience {
  animation-duration: 0.75s;
  animation-delay: 0.65s;
}
.animationTabContact {
  animation-duration: 0.75s;
  animation-delay: 0.85s;
}
.animationContent {
  animation-duration: 1s;
  animation-delay: 1.05s;
}
.animationSocial {
  animation-duration: 0.75s;
  animation-delay: 1.25s;
}
</style>

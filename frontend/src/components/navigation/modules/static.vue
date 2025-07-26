<template>
  <div
    ref="sidebarRef"
    class="relative transition-[margin,width] ease-in-out duration-500 bg-base-sidebar border-base-border"
    :class="[animationClasses, viewportClasses]"
  >
    <div v-if="showMobile" class="absolute z-20">
      <div class="ml-20 triangle"></div>

      <div class="ml-3 mt-2 scale-90">
        <trigger @click="navClick()" />
      </div>
    </div>

    <div v-else class="h-full flex flex-col justify-center">
      <div class="flex items-center justify-center" @click="navClick()">
        <trigger />
      </div>
    </div>

    <transition name="fade" class="z-10">
      <div
        v-if="path === '/scrapbook' && !settingsStore.expanded"
        class="absolute top-3 left-0 right-0 w-screen flex justify-end"
      >
        <div
          class="mr-4 hover:bg-gradient-start/10 transition-standard rounded-full backdrop-blur-sm bg-base-sidebar/50 border border-base-border flex justify-center h-7 w-20 text-font-primary cursor-pointer transition-standard"
          @click="
            settingsStore.alternativeDisplay = !settingsStore.alternativeDisplay
          "
        >
          <div class="flex flex-col justify-center text-xl">
            <i
              v-if="settingsStore.alternativeDisplay"
              class="far fa-cards-blank"
            />
            <i v-else class="far fa-table-list" />
          </div>
        </div>
      </div>
    </transition>
    <transition v-if="isBreakpointOrBelow('md')" name="fade" class="z-10">
      <div
        v-if="path !== '/' && !settingsStore.expanded"
        class="absolute top-3 left-0 right-0 w-screen flex justify-center"
      >
        <router-link :to="{ path: '/' }" custom>
          <template #default="{ navigate }">
            <div @click="navigate">
              <div
                class="hover:bg-gradient-start/10 transition-standard rounded-full backdrop-blur-sm bg-base-sidebar/50 border border-base-border flex justify-center h-7 w-40 text-font-primary cursor-pointer transition-standard"
              >
                <div class="flex flex-col justify-center text-2xl">
                  <i class="far fa-chevron-up leading-none"></i>
                </div>
              </div>
            </div>
          </template>
        </router-link>
      </div>
    </transition>
    <transition v-if="!isBreakpointOrBelow('md')" name="fade">
      <div v-if="path !== '/'">
        <router-link :to="{ path: '/' }" custom>
          <template #default="{ navigate }">
            <div
              class="z-10 absolute top-4 left-0 right-0 text-[32px] flex justify-center text-font-primary opacity-40 hover:opacity-100 cursor-pointer transition-standard"
              @click="navigate"
            >
              <i class="far fa-arrow-to-top"></i>
            </div>
          </template>
        </router-link>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeMount, ref, watch } from "vue";
import { useSettingsStore } from "@/stores/settings.js";

const { isBreakpointOrBelow } = useBreakpoints();
import { useBreakpoints } from "@/composables/breakpoints.js";
import trigger from "@/components/navigation/modules/trigger.vue";
import { useRoute } from "vue-router";
const settingsStore = useSettingsStore();
const route = useRoute();

const showMobile = ref(false);
const animationClasses = ref("");
const viewportClasses = ref("");

const navClick = () => {
  settingsStore.expanded = !settingsStore.expanded;
};

const path = computed(() => {
  return route.path;
});

watch(
  () => isBreakpointOrBelow("md"),
  () => {
    settingsStore.expanded = false;
    if (isBreakpointOrBelow("md")) {
      animationClasses.value = "-ml-20";
      setTimeout(() => {
        showMobile.value = true;
        viewportClasses.value = "h-20 w-0 rounded-full flex-column";
      }, 510);
      setTimeout(() => {
        animationClasses.value = "";
      }, 520);
    } else {
      animationClasses.value = "-ml-20";
      setTimeout(() => {
        showMobile.value = false;
        viewportClasses.value =
          "h-dvh w-20 justify-center border-r flex-column";
      }, 510);
      setTimeout(() => {
        animationClasses.value = "";
      }, 520);
    }
  }
);

onBeforeMount(() => {
  if (isBreakpointOrBelow("md")) {
    showMobile.value = true;
    viewportClasses.value = "h-20 w-0 rounded-full flex-column";
  } else {
    showMobile.value = false;
    viewportClasses.value = "h-dvh w-20 justify-center border-r flex-column";
  }
});
</script>

<style lang="scss">
.triangle {
  &::before,
  &::after {
    content: "";
    position: absolute;
    top: -1px;
    left: -1px;
    border-color: transparent;
    border-style: solid;
  }
  &::before {
    border-width: 44px;
    border-left-color: theme("colors.base.border");
    border-top-color: theme("colors.base.border");
  }
  &::after {
    border-width: 44px;
    border-left-color: theme("colors.base.sidebar");
    border-top-color: theme("colors.base.sidebar");
  }
}
</style>

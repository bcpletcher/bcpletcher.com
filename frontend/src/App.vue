<template>
  <div
    v-if="isMounted"
    class="h-screen w-screen bg-base-background overflow-hidden relative defaultSlide animationController"
  >
    <!--    Radial gradient overlay-->
    <div
      class="pointer-events-none fixed inset-0 z-30 transition duration-300 lg:absolute"
      :style="{
        background: `radial-gradient(600px at ${mouseX}px ${mouseY}px, rgba(29, 78, 216, 0.05), transparent 50%)`,
      }"
    ></div>
    <router-view v-slot="{ Component }">
      <transition
        :name="
          isMounted ? (route.path !== '/' ? 'slideY-up' : 'slideY-down') : ''
        "
        mode="out-in"
      >
        <component
          :is="Component"
          class="h-full absolute inset-0 transition-fast"
          :style="contentPosition"
        />
      </transition>
    </router-view>

    <template v-if="!isBlankLayout">
      <sidebar />

      <transition name="fade">
        <div
          v-show="settingsStore.expanded"
          class="z-10 fixed inset-0 bg-black/30 pointer-events-all"
          @click="settingsStore.expanded = !settingsStore.expanded"
        />
      </transition>
    </template>

    <div
      aria-live="assertive"
      class="fixed inset-0 flex items-end justify-center p-4 pointer-events-none sm:justify-end z-50"
    >
      <notifications />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Sidebar from "@/components/navigation/sidebar.vue";
import Notifications from "@/components/shared/notifications.vue";
import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useBreakpoints } from "@/composables/breakpoints.js";
import { useRoute } from "vue-router";
// import { useNotificationStore } from "@/stores/notification.js";
const route = useRoute();

const firebaseStore = useFirebaseStore();
const { isBreakpointOrBelow } = useBreakpoints();

const isMounted = ref(false);
const isBlankLayout = false;
const settingsStore = useSettingsStore();

const contentPosition = computed(() => {
  let distance = isBreakpointOrBelow("md")
    ? 0
    : settingsStore.expanded
    ? 450 + 80
    : 80;
  let width = isBreakpointOrBelow("md") ? 0 : 80;
  return {
    left: `${distance}px`,
    width: `calc(100% - ${width}px)`,
  };
});

const mouseX = ref(window.innerWidth / 2); // Default to center of screen
const mouseY = ref(window.innerHeight / 2);

const updateMousePosition = (event) => {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
};

onMounted(async () => {
  await firebaseStore.auth.signOut();

  isMounted.value = true;
  window.addEventListener("mousemove", updateMousePosition);

  // Hydrate scrapbook from localStorage first for faster initial render
  const cachedScrapbook = localStorage.getItem("scrapbookCache");
  if (cachedScrapbook) {
    try {
      settingsStore.scrapbook = JSON.parse(cachedScrapbook);
    } catch (e) {
      console.warn("Failed to parse scrapbookCache from localStorage", e);
      localStorage.removeItem("scrapbookCache");
    }
  }

  // Always fetch fresh data from Firestore and overwrite cache
  settingsStore.resources = await firebaseStore.dataGetResourcesCollection();
  settingsStore.scrapbook = await firebaseStore.dataGetScrapbookCollection();

  // Keep scrapbook cached in localStorage whenever it changes
  watch(
    () => settingsStore.scrapbook,
    (val) => {
      if (val) {
        localStorage.setItem("scrapbookCache", JSON.stringify(val));
      } else {
        localStorage.removeItem("scrapbookCache");
      }
    },
    { deep: true, immediate: true }
  );
});
onUnmounted(() => {
  window.removeEventListener("mousemove", updateMousePosition);
});
</script>

<style lang="scss" scoped>
/*------------- ANIMATION -------------*/

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

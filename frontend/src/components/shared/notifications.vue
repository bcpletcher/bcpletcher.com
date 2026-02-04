<template>
  <div
    aria-live="assertive"
    class="fixed inset-0 flex items-end justify-center pointer-events-none sm:justify-end z-20000 p-4"
  >
    <div class="flex flex-col gap-4">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="transition-standard w-96 bg-slate-950 shadow-lg rounded-lg pointer-events-auto overflow-hidden"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="shrink-0">
              <i
                class="h-6 w-6 text-lg leading-none"
                :class="[notification.style.colorText, notification.style.iconClass]"
                aria-hidden="true"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="font-bold text-font-primary">
                {{ notification.title }}
              </p>
              <p class="mt-1 text-font-primary">
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 shrink-0 flex">
              <button
                class="bg-transparent text-font-primary/50 hover:text-font-primary focus:outline-none transition-standard"
                @click="clear(notification.id)"
              >
                <span class="sr-only">Close</span>
                <i class="fa-light fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <div class="relative pt-1">
          <div
            class="overflow-hidden h-2 text-xs flex"
            :class="notification.style.colorBar"
          >
            <div
              :ref="setProgressEl(notification.id)"
              class="transition-standard w-full shadow-none flex flex-col text-center whitespace-nowrap text-font-primary justify-center"
              :class="notification.style.colorProgress"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount, watch, nextTick, onBeforeUnmount } from "vue";
import { useNotificationStore } from "@/stores/notification.js";

const notificationStore = useNotificationStore();

const timers = new Map();
const progressEls = new Map();

const setProgressEl = (id) => (el) => {
  if (el) progressEls.set(id, el);
  else progressEls.delete(id);
};

const notifyTimer = (() => {
  function start(notification, $element) {
    let duration = notification.duration;
    let timeLeft = duration;
    notification.timer = setInterval(countdown, 100);

    function countdown() {
      if (timeLeft >= 0) {
        let progressBarWidth = (timeLeft / duration) * 100; // percentage width
        $element.style.width = `${progressBarWidth}%`;
        timeLeft -= 100;
      } else {
        clearInterval(notification.timer);
        notificationStore.removeNotification(notification.id);
        timers.delete(notification.id);
        progressEls.delete(notification.id);
      }
    }
  }

  function stop(notification) {
    clearInterval(notification.timer);
    timers.delete(notification.id);
    progressEls.delete(notification.id);
  }

  return {
    start,
    stop,
  };
})();

const startNotificationTimers = async () => {
  await nextTick(); // Ensure DOM updates are complete
  setTimeout(() => {
    notificationStore.notifications.forEach((notification) => {
      if (!timers.has(notification.id)) {
        const el = progressEls.get(notification.id);
        if (!el) return;
        notifyTimer.start(notification, el);
        timers.set(notification.id, notification.timer);
      }
    });
  }, 50); // Small delay to ensure the DOM is rendered
};

const clear = (id) => {
  const notification = notificationStore.notifications.find((n) => n.id === id);
  if (notification) {
    notifyTimer.stop(notification);
  }
  notificationStore.removeNotification(id);
};

// Watch for changes in notifications and start timers for new notifications
watch(
  () => notificationStore.notifications,
  async () => {
    await startNotificationTimers();
  },
  { immediate: true }
);

onBeforeMount(async () => {
  // setTimeout(() => {
  // notificationStore.addNotification({
  //   variant: "success",
  //   title: "Save to Library",
  //   message: "Item saved to library",
  //   duration: 5,
  // });
  // notificationStore.addNotification({
  //   variant: "error",
  //   title: "Save to Library",
  //   message: "Item saved to library",
  //   duration: 3,
  // });
  // }, 1000);
});

onBeforeUnmount(() => {
  // Clean up any intervals if the component ever unmounts.
  timers.forEach((timerId) => clearInterval(timerId));
  timers.clear();
  progressEls.clear();
});
</script>

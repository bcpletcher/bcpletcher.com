<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="notification in notificationStore.notifications"
      :key="notification.uuid"
      class="transition-standard w-96 bg-base-sidebar shadow-lg rounded-lg pointer-events-auto overflow-hidden"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <tw-icon
              class="h-6 w-6"
              :class="notification.style.colorText"
              :icon="notification.style.icon"
              size="lg"
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
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="bg-transparent text-font-primary/50 hover:text-font-primary focus:outline-none transition-standard"
              @click="clear(notification.uuid)"
            >
              <span class="sr-only">Close</span>
              <tw-icon icon="times" size="lg" />
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
            :id="notification.uuid"
            class="transition-standard w-full shadow-none flex flex-col text-center whitespace-nowrap text-font-primary justify-center"
            :class="notification.style.colorProgress"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount, watch, nextTick } from "vue";
import { useNotificationStore } from "@/stores/notification.js";
import TwIcon from "@/components/shared/tw-icon.vue";

const notificationStore = useNotificationStore();

const timers = new Map(); // Store timers by UUID

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
        notificationStore.removeNotification(notification.uuid);
        timers.delete(notification.uuid); // Clean up the timer
      }
    }
  }

  function stop(notification) {
    clearInterval(notification.timer);
    timers.delete(notification.uuid); // Clean up the timer
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
      if (!timers.has(notification.uuid)) {
        const el = document.getElementById(notification.uuid);
        if (el) {
          notifyTimer.start(notification, el);
          timers.set(notification.uuid, notification.timer); // Keep track of the timer
        }
      }
    });
  }, 50); // Small delay to ensure the DOM is rendered
};

const clear = (uuid) => {
  const notification = notificationStore.notifications.find(
    (n) => n.uuid === uuid
  );
  if (notification) {
    notifyTimer.stop(notification);
  }
  notificationStore.removeNotification(uuid);
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
</script>

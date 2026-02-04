import { defineStore } from "pinia";

let nextNotificationId = 1;

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
  }),
  actions: {
    addNotification({ variant, title, message, duration = 5 }) {
      const id = nextNotificationId++;

      let style = {
        iconClass: "fa-light fa-circle-exclamation",
        colorText: "text-sky-300",
        colorBar: "bg-sky-300/20",
        colorProgress: "bg-sky-300",
      };

      if (variant === "success") {
        style = {
          iconClass: "fa-light fa-circle-check",
          colorText: "text-emerald-300",
          colorBar: "bg-emerald-300/20",
          colorProgress: "bg-emerald-300",
        };
      } else if (variant === "danger") {
        style = {
          iconClass: "fa-light fa-circle-xmark",
          colorText: "text-red-300",
          colorBar: "bg-red-300/20",
          colorProgress: "bg-red-300",
        };
      }

      this.notifications = [
        ...this.notifications,
        {
          id,
          variant,
          title,
          message,
          style,
          duration: duration * 1000,
        },
      ];
    },
    removeNotification(id) {
      this.notifications = this.notifications.filter((n) => n.id !== id);
    },
  },
});

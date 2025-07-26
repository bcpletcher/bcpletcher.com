import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
  }),
  actions: {
    addNotification({ variant, title, message, duration = 5 }) {
      // Generate a unique ID for the notification
      const uuid = uuidv4();
      let style = {
        icon: "exclamation-circle",
        colorText: "text-primary",
        colorBar: "bg-blue-200",
        colorProgress: "bg-blue-500",
      };

      if (variant === "success") {
        style = {
          icon: "check-circle",
          colorText: "text-green-400",
          colorBar: "bg-green-200",
          colorProgress: "bg-green-500",
        };
      } else if (variant === "danger") {
        style = {
          icon: "times-circle",
          colorText: "text-red-400",
          colorBar: "bg-red-200",
          colorProgress: "bg-red-500",
        };
      }

      this.notifications = [
        ...this.notifications,
        {
          uuid,
          variant,
          title,
          message,
          style,
          duration: duration * 1000,
        },
      ];
    },
    removeNotification(id) {
      // Remove the notification by id
      this.notifications = this.notifications.filter((n) => n.uuid !== id);
    },
  },
});

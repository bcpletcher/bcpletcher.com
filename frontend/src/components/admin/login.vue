<template>
  <div class="h-full w-full flex flex-col justify-center">
    <div class="flex justify-center">
      <div class="h-20 cursor-pointer mb-10">
        <img
          v-if="settingsStore.resources"
          class="w-full h-full"
          :src="settingsStore.resources.images.logo"
          alt="BP Logo"
        />
      </div>
    </div>
    <div class="flex flex-col gap-2 max-w-96 w-[90%] mx-auto">
      <tw-input-group
        label="Email"
        :required="true"
        type="email"
        :value="credentials.email"
        @update-value="credentials.email = $event"
      />
      <tw-input-group
        label="Password"
        type="password"
        :required="true"
        :value="credentials.password"
        @update-value="credentials.password = $event"
        @enter-event="signIn()"
      />
      <div class="flex justify-end pt-2">
        <button class="bg-gradient-start rounded py-1 px-3" @click="signIn">
          Sign In
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from "vue";
import TwInputGroup from "@/components/shared/tw-input-group.vue";

import { useFirebaseStore } from "@/stores/firebase.js";
import { useSettingsStore } from "@/stores/settings.js";
import { useNotificationStore } from "@/stores/notification.js";

const firebaseStore = useFirebaseStore();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const credentials = ref({
  email: "",
  password: "",
});

const signIn = () => {
  if (isLoading.value) return;

  isLoading.value = true;

  firebaseStore
    .adminSignIn(credentials.value.email, credentials.value.password)
    .then(() => {
      firebaseStore.auth.onAuthStateChanged((user) => {
        if (user) {
          settingsStore.user = user;
        }
      });
    })
    .catch((errMsg) => {
      isLoading.value = false;
      notificationStore.addNotification({
        variant: "danger",
        title: "Authentication",
        message: errMsg,
        duration: 5,
      });
    });
};

onBeforeUnmount(() => {
  credentials.value = {
    email: "",
    password: "",
  };
});
</script>

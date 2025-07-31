<template>
  <div
    class="flex bg-base-background"
    :class="isReady ? 'opacity-100' : 'opacity-0'"
  >
    <div class="flex-1 relative overflow-y-auto">
      <div class="px-[8%] w-full h-full flex justify-between">
        <template v-for="i in 4" :key="i">
          <div
            class="line flex flex-col flex-none basis-[5px] bg-base-background"
            :class="{
              'pt-[10%] pb-[5%]': i === 1,
              'pt-[5%] pb-[15%]': i === 3,
            }"
          >
            <!-- Top Cap -->
            <div
              v-if="i !== 4"
              class="cap opacity-25 flex-none basis-[60px] rounded"
              :class="{
                'bg-gray-600': i === 2 || i === 3,
                'bg-gradient-to-t from-gradient-start to-gradient-end': i === 1,
              }"
            ></div>

            <!-- Spacer -->
            <div class="flex-1"></div>

            <!-- Bottom Cap -->
            <div
              class="cap opacity-25 flex-none rounded"
              :class="[
                i < 4 ? 'basis-[60px]' : 'basis-[25%]',
                {
                  'bg-gray-600': i === 2,
                  'bg-gradient-to-t from-gradient-start to-gradient-end':
                    i === 1 || i === 3,
                  'bg-gradient-to-b from-gradient-start to-gradient-end':
                    i === 4,
                },
              ]"
            ></div>
          </div>
        </template>
      </div>
      <div
        class="absolute top-0 left-0 z-10 w-full h-full flex flex-col justify-center"
      >
        <div
          class="px-8 md:px-[10%] flex flex-col pt-20 pb-12 h-full sm:h-auto md:py-8 md:gap-6 gap-8"
        >
          <div class="flex flex-col uppercase">
            <p
              class="leading-none text-[24px] mb-2 text-transparent bg-gradient-to-r from-gradient-start to-gradient-start bg-clip-text"
            >
              HI I'M
            </p>
            <p
              class="leading-none font-light text-[30px] md:text-[50px] xl:text-[60px] md:ml-[-4px] text-transparent bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text"
            >
              BENJAMIN PLETCHER
            </p>
          </div>
          <div
            class="text-font-primary text-base flex flex-col gap-2 max-w-[600px] opacity-90 leading-snug"
          >
            <p
              v-for="(line, index) in aboutCopy"
              :key="index"
              class="text-font-primary/75 tracking-wide leading-normal text-sm md:text-base"
            >
              {{ line }}
            </p>
          </div>
          <div class="flex gap-8 sm:gap-6 flex-col sm:flex-row mt-auto">
            <router-link to="/scrapbook" custom>
              <template #default="{ href, navigate }">
                <a
                  :href="href"
                  :class="[
                    'rounded-[40px] text-font-primary uppercase p-1 tracking-widest inline-block',
                    'bg-gradient-to-r from-gradient-start to-gradient-end',
                    'mx-auto sm:mx-0',
                  ]"
                  @click="navigate"
                >
                  <div
                    :class="[
                      'px-4 py-3 pointer-events-none w-full h-full flex items-center justify-center ',
                      'bg-base-background rounded-[40px]',
                    ]"
                  >
                    <p
                      class="leading-none mt-1 pointer-events-none text-sm pb-0.5"
                    >
                      VIEW SCRAPBOOK
                    </p>
                  </div>
                </a>
              </template>
            </router-link>
            <p
              :class="[
                'tracking-widest text-font-primary/75 content-center text-sm',
                'hidden sm:inline-block',
              ]"
            >
              OR JUST
            </p>
            <a
              :class="[
                'my-auto text-font-primary inline-block cursor-pointer tracking-widest text-sm mb-10 sm:mb-auto',
                'relative after:content-[\'\'] after:absolute after:-bottom-2 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-gradient-start after:to-gradient-end',
                'mx-auto sm:mx-0',
              ]"
              @click="showContact"
            >
              <p>GET IN TOUCH</p>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="hidden lg:flex flex-none basis-[25%] h-full relative w-[300px]">
      <div
        class="absolute inset-0 z-[2] bg-base-background opacity-[92%]"
      ></div>
      <img
        class="z-[1] min-w-full h-full object-cover bg-cover bg-left bg-no-repeat"
        :src="heroSrc"
        alt="hero-column"
      />
    </div>
    <div class="hidden lg:flex flex-none basis-[10%] bg-base-background"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useSettingsStore } from "@/stores/settings.js";

const isReady = ref(false);
const settingsStore = useSettingsStore();

const heroSrc = ref(
  "https://firebasestorage.googleapis.com/v0/b/pletcher-portfolio-app.firebasestorage.app/o/Assets%2Fself-column.jpg?alt=media&token=0cab3d20-86f9-4b05-82c8-caceb460c65a"
);

const aboutCopy = ref([
  "I'm a developer who loves building clean, accessible, and well-crafted user interfaces. I enjoy working where design and development meet, bringing ideas to life with a focus on polish, performance, and usability.",
  "Right now, I'm working as a full stack developer, with a strong focus on front-end engineering and accessibility. I help build and maintain UI components that serve as the foundation for scalable, inclusive interfaces, while also contributing to the backend to support robust, end-to-end functionality.",
  "Over the years, I’ve worked in a variety of environments from small studios and startups to large teams and enterprise projects helping shape products across different industries. In my free time, I’ve been building a platform, which helps designers easily create professional cover art. I've led development across the full stack, from designing the API and integrating third-party services to crafting a smooth, responsive front-end experience.",
]);

const showContact = () => {
  settingsStore.sidebarFocus = "Contact";
  settingsStore.expanded = true;
};
onMounted(() => {
  setTimeout(() => {
    isReady.value = true;
  }, 100);
});
</script>

<style scoped lang="scss"></style>

<template>
  <div
    id="pageHomepage"
    class="flex bg-base-background"
    :class="isReady ? 'opacity-100' : 'opacity-0'"
  >
    <div class="content flex-1 relative">
      <div class="lines ml-[8%] w-full h-full flex">
        <template v-for="i in 4" :key="i">
          <div class="line flex flex-col bg-base-background">
            <div v-if="i !== 4" class="top cap opacity-25"></div>
            <div class="flex-1"></div>
            <div class="bottom cap opacity-25"></div>
          </div>
          <div class="flex-1"></div>
        </template>
      </div>
      <div class="primaryBox">
        <div class="flex-1"></div>
        <div class="contentHolder">
          <div class="name gradientText">
            <p>HI I'M</p>
            <p>BENJAMIN PLETCHER</p>
          </div>
          <div class="introduction">
            <p>
              I am a UX/UI Designer & Full Stack Developer from Norton Shores,
              Michigan
            </p>
            <p>Enthusiast in all phases of the development process.</p>
            <p>I'm a minimalist who truly believes that less is more.</p>
          </div>
          <div class="actions">
            <router-link :to="{ path: '/scrapbook' }">
              <template #default="{ href, navigate }">
                <a :href="href" class="btnScrapbook" @click="navigate">
                  <span class="pointer-events-none">
                    <label class="leading-none mt-1 pointer-events-none"
                      >VIEW SCRAPBOOK</label
                    >
                  </span>
                </a>
              </template>
            </router-link>
            <p class="spaceText">OR JUST</p>
            <a
              class="btnContact pb-1 text-font-primary inline-block relative cursor-pointer"
              @click="showContact"
            >
              <p>GET IN TOUCH</p>
            </a>
          </div>
        </div>
        <div class="flex-1"></div>
      </div>
    </div>
    <div class="banner">
      <div class="overlay"></div>
      <transition name="fade">
        <img
          :src="heroSrc"
          alt="hero-column"
        />
      </transition>
    </div>
    <div class="end"></div>
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

<style scoped lang="scss">
#pageHomepage {
  .content {
    .primaryBox {
      z-index: 10;
      height: 100%;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      .contentHolder {
        flex: 0 0 1;
      }
      .name,
      .introduction,
      .actions {
        margin-left: 10%;
      }
    }
  }
  .banner {
    flex: 0 0 25%;
    width: 300px; /*or 70%, or what you want*/
    height: 100%; /*or 70%, or what you want*/
    position: relative;
    .overlay {
      z-index: 2;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: rgb(33, 31, 44);
      opacity: 0.92;
    }
    img {
      z-index: 1;
      min-width: 100%;
      height: 100%;
      object-fit: cover;
      background-size: cover;
      background-position: center left;
      background-repeat: no-repeat;
    }
  }
  .end {
    flex: 0 0 10%;
    background: theme("colors.base.background");
  }
}

.content .lines {
  .line {
    flex: 0 0 5px;
    &:nth-child(1) {
      padding: 10% 0 5% 0;
      .cap {
        flex: 0 0 60px;
        background: linear-gradient(
          to bottom,
          theme("colors.gradient.end"),
          theme("colors.gradient.start")
        );
      }
    }
    &:nth-child(3) {
      padding: 5% 0 15% 0;
      .cap {
        flex: 0 0 60px;
        background: #504e5a;
      }
    }
    &:nth-child(5) {
      padding: 15% 0 10% 0;
      .cap {
        flex: 0 0 60px;
        &:first-child {
          background: #504e5a;
        }
        &:last-child {
          background: linear-gradient(
            to bottom,
            theme("colors.gradient.end"),
            theme("colors.gradient.start")
          );
        }
      }
    }
    &:nth-child(7) {
      .cap {
        flex: 0 0 25%;
        background: linear-gradient(
          to bottom,
          theme("colors.gradient.start"),
          theme("colors.gradient.end")
        );
      }
    }
  }
}

.contentHolder {
  .name {
    p {
      clear: both;
      float: left;
    }
    p:first-of-type {
      font-size: 24px;
    }
    p:last-of-type {
      font-size: 64px;
      line-height: 64px;
      height: 64px;
    }
  }
  .introduction {
    padding: 20px 0;
    color: #dadada;
    p {
      font-size: 1.2rem;
      margin-bottom: 10px;
    }
  }
}
.gradientText {
  &.name p:last-of-type {
    margin-left: -4px;
  }
  p:first-of-type {
    background: theme("colors.gradient.start");
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p:last-of-type {
    background: -webkit-linear-gradient(
      0deg,
      theme("colors.gradient.start"),
      theme("colors.gradient.end")
    );
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 0;
}
.btnScrapbook {
  background-image: linear-gradient(
    to right,
    theme("colors.gradient.start"),
    theme("colors.gradient.end")
  );
  border-radius: 40px;
  box-sizing: border-box;
  color: var(--fontPrimary);
  display: inline-block;
  height: 50px;
  letter-spacing: 1px;
  outline: none;
  margin: 0 auto;
  padding: 4px;
  position: relative;
  text-decoration: none;
  text-transform: uppercase;
  width: 200px;
  z-index: 2;
  span {
    align-items: center;
    background: #211f2c;
    border-radius: 40px;
    display: flex;
    justify-content: center;
    height: 100%;
    transition: background 0.5s ease;
    width: 100%;
    label {
      height: 16px;
      font-size: 16px;
    }
  }
}
.spaceText {
  letter-spacing: 1px;
  color: #ffffff;
  display: inline-block;
  padding: 0 40px;
  height: 50px;
  font-size: 16px;
}
.btnContact {
  letter-spacing: 1px;
  border: solid 1px transparent;
  border-bottom: none;
}

.btnContact:after {
  content: "";
  background-image: linear-gradient(
    to right,
    theme("colors.gradient.start"),
    theme("colors.gradient.end")
  );
  display: block;
  height: 2px;
  width: 120px;
  position: absolute;
  bottom: 0;
}
@media screen and (min-width: 901px) and (max-width: 1140px) {
  .name.gradientText,
  .introduction,
  .actions {
    margin-left: 5% !important;
  }
  .name.gradientText p {
    &:first-of-type {
      font-size: 1.5rem !important;
    }
    &:last-of-type {
      font-size: 3rem !important;
    }
  }
}

@media screen and (min-width: 0px) and (max-width: 900px) {
  .name.gradientText p {
    &:first-of-type {
      font-size: 1.3rem !important;
    }
    &:last-of-type {
      font-size: 2.3rem !important;
    }
  }
}
@media screen and (min-width: 0px) and (max-width: 900px) {
  .actions .btnScrapbook,
  .actions .btnContact,
  .actions .spaceText {
    display: block;
    margin: 0 auto;
  }
  .actions .spaceText {
    height: 70px;
    line-height: 70px !important;
    width: 100% !important;
    text-align: center !important;
    padding: 0 !important;
  }
  .actions .btnContact {
    width: 125px;
  }
}
@media screen and (max-width: 600px) {
  .name.gradientText,
  .introduction,
  .actions {
    margin: 0 5% !important;
  }
  .name.gradientText {
    display: block;
    margin: 0 auto !important;
    -webkit-text-fill-color: transparent;
    p {
      float: none;
      background-image: linear-gradient(
        0deg,
        theme("colors.gradient.start"),
        theme("colors.gradient.end")
      );
    }
  }
  .name.gradientText p,
  .introduction p {
    text-align: center;
  }
  .banner,
  .end {
    display: none;
  }
}
</style>

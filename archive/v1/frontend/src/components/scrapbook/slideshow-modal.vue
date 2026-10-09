<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[9999] backdrop-blur"
      @click.self="closeModal"
    >
      <div class="shadow-lg w-[90vw] max-w-[1000px] flex flex-col">
        <div class="flex justify-end text-font-primary pb-4 mb-4">
          <button
            class="opacity-80 hover:opacity-100 transition-standard text-2xl"
            @click="closeModal"
          >
            <i class="far fa-times"></i>
          </button>
        </div>
        <div class="text-font-primary max-h-[70vh]">
          <swiper
            :lazy="true"
            :loop="true"
            :pagination="{
              el: '.custom-pagination',
              clickable: true,
            }"
            :navigation="{
              nextEl: '.custom-button-next',
              prevEl: '.custom-button-prev',
            }"
            :modules="[Pagination, Navigation]"
            class="mySwiper"
          >
            <swiper-slide v-for="(image, index) in images" :key="index">
              <img :src="image" loading="lazy" :alt="index" />
              <div class="swiper-lazy-preloader swiper-lazy-preloader-white" />
            </swiper-slide>
          </swiper>
          <div class="pt-2 flex justify-between">
            <button class="custom-button-prev text-font-secondary text-2xl">
              <i class="fa fa-chevron-left"></i>
            </button>
            <div>
              <div class="custom-pagination"></div>
            </div>
            <button class="custom-button-next text-font-secondary text-2xl">
              <i class="fa fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, ref } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Navigation } from "swiper/modules";

import "swiper/css";

import "swiper/css/pagination";
import "swiper/css/navigation";

const visible = ref(false);
const images = ref([]);

const showModal = async (obj) => {
  images.value = obj.images;
  visible.value = true;
};

const closeModal = () => {
  visible.value = false;
  images.value = [];
};

onBeforeUnmount(() => {
  closeModal();
});

defineExpose({
  showModal,
});
</script>

<style lang="scss">
.swiper-pagination-bullet {
  background-color: theme("colors.font.primary");
}
.swiper-pagination-bullet-active {
  background-color: theme("colors.gradient.start");
}
</style>

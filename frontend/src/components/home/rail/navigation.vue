<template>
  <nav aria-label="Page" :class="wrapperClass">
    <component :is="isDesktop ? 'ul' : 'div'" :class="listClass">
      <component
        :is="isDesktop ? 'li' : 'span'"
        v-for="item in navItems"
        :key="item.id"
      >
        <button :class="buttonClass" @click="$emit('nav', item.id)">
          <template v-if="isDesktop">
            <span
              class="h-px transition-all duration-200"
              :class="
                activeSectionId === item.id
                  ? 'bg-slate-100 w-16'
                  : 'bg-slate-500 w-9'
              "
            />
            <span
              class="text-xs font-bold tracking-widest uppercase transition-standard"
              :class="
                activeSectionId === item.id
                  ? 'text-slate-100'
                  : 'text-slate-500 group-hover:text-slate-100'
              "
            >
              {{ item.label }}
            </span>
          </template>

          <template v-else>
            {{ item.label }}
          </template>
        </button>
      </component>
    </component>
  </nav>
</template>

<script setup>
const props = defineProps({
  navItems: { type: Array, required: true },
  activeSectionId: { type: String, default: null },
  variant: {
    type: String,
    default: "desktop",
    validator: (v) => ["desktop", "mobile"].includes(v),
  },
});

defineEmits(["nav"]);

const isDesktop = props.variant === "desktop";

const wrapperClass = isDesktop ? "mt-16" : "mt-8";

const listClass = isDesktop ? "space-y-4" : "flex flex-wrap gap-3";

const buttonClass = isDesktop
  ? "group flex items-center gap-4 w-full text-left"
  : "px-3 py-2 rounded-full border border-font-primary/15 text-xs tracking-[0.2em] uppercase";
</script>

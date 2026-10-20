<template>
  <svg
    v-if="resolved.kind === 'github'"
    class="app-icon"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="siGithub.path" />
  </svg>
  <svg
    v-else-if="resolved.kind === 'linkedin'"
    class="app-icon"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    :stroke-width="resolved.strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
    />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
  <component
    :is="resolved.component"
    v-else-if="resolved.component"
    class="app-icon"
    size="1em"
    :stroke-width="resolved.strokeWidth"
    :fill="resolved.filled ? 'currentColor' : 'none'"
    aria-hidden="true"
    focusable="false"
  />
</template>

<script setup>
// Inline SVG icons (no icon font, no third-party script). `icon` accepts the legacy
// Font Awesome class strings the app still stores, e.g. "fa-light fa-arrow-up-right".
import { computed } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Expand,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Images,
  Mail,
  Minus,
  Newspaper,
  Plus,
  Search,
  SquarePen,
  Star,
  X,
} from "lucide-vue-next";
import { siGithub } from "simple-icons";

const props = defineProps({
  icon: { type: String, default: "" },
});

const COMPONENTS = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  award: Award,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "circle-check": CircleCheck,
  "circle-exclamation": CircleAlert,
  "circle-xmark": CircleX,
  envelope: Mail,
  expand: Expand,
  eye: Eye,
  "eye-slash": EyeOff,
  "file-lines": FileText,
  heart: Heart,
  images: Images,
  "magnifying-glass": Search,
  minus: Minus,
  newspaper: Newspaper,
  "pen-to-square": SquarePen,
  plus: Plus,
  star: Star,
  xmark: X,
};

// Only these read as "filled" in their solid weight; other solid icons get a heavier stroke.
const FILLED_WHEN_SOLID = new Set(["star", "heart"]);

const resolved = computed(() => {
  const tokens = props.icon.split(/\s+/).filter(Boolean);
  const weight = tokens.find((t) =>
    ["fa-light", "fa-thin", "fa-regular", "fa-solid", "fa-brands"].includes(t),
  );
  const name = tokens
    .filter((t) => t.startsWith("fa-") && t !== weight)
    .map((t) => t.slice(3))[0];
  const solid = weight === "fa-solid";
  const strokeWidth = solid ? 2 : weight === "fa-regular" ? 1.75 : 1.5;
  if (name === "github") return { kind: "github" };
  if (name === "linkedin") return { kind: "linkedin", strokeWidth: 1.75 };
  return {
    kind: "lucide",
    component: COMPONENTS[name],
    strokeWidth,
    filled: solid && FILLED_WHEN_SOLID.has(name),
  };
});
</script>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.125em;
}
</style>

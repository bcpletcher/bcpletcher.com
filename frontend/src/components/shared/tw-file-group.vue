<template>
  <div class="py-1">
    <div class="flex flex-col gap-1">
      <label
        v-if="props.label !== ''"
        for="input"
        class="block text-sm text-font-primary leading-none"
      >
        {{ props.label }}
      </label>
      <div class="mt-1 flex rounded-md shadow-sm">
        <div class="w-full flex gap-4">
          <label
            for="file-upload"
            class="w-40 mb-auto cursor-pointer bg-white text-font-tertiary px-4 py-2 rounded-md h-10"
          >
            Choose a file
          </label>

          <input
            id="file-upload"
            type="file"
            :accept="props.accept"
            class="hidden"
            @change="previewFile"
          />

          <!-- File preview (if file selected) -->
          <div class="flex-1" :class="props.imageHeight">
            <div v-if="filePreview">
              <!-- PDF Preview (display file name or icon) -->
              <div v-if="isPdf" class="flex items-center space-x-2">
                <i class="fas fa-file-pdf text-red-500 text-3xl"></i>
                <span class="text-sm text-font-primary">
                  {{ filePreview.name }}
                </span>
              </div>

              <!-- Image Preview (for images) -->
              <div v-else class="relative">
                <img
                  :src="filePreview"
                  alt="File Preview"
                  class="object-contain ml-auto"
                  :class="props.imageHeight"
                />
                <button
                  class="absolute top-1 right-1 bg-red-500 text-white flex flex-col justify-center h-8 w-8 rounded-full hover:bg-red-600 transition duration-300"
                  @click="removeFile"
                >
                  <i class="far fa-times mx-auto"></i>
                </button>
              </div>
            </div>

            <!-- Default image or file URL (if existingUrl provided) -->
            <img
              v-else
              :src="initialUrl"
              class="object-contain ml-auto"
              :class="props.imageHeight"
              alt=""
            />
          </div>

          <!-- Error message for invalid file type -->
          <p v-if="errorMessage" class="text-red-500 text-sm">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  label: { type: String, default: "" },
  accept: { type: String, default: "image/*" }, // Default accept type is image
  existingUrl: { type: String, default: "" },
  value: { type: [String], default: "" },
  imageHeight: { type: String, default: "h-44" },
});
const initialUrl = ref(null); // To store the initial URL

// To emit file change
const emit = defineEmits(["updateValue"]);

// State to store the preview of the file
const filePreview = ref(null);
const errorMessage = ref(null);

// Computed property to determine if the accepted file type includes PDF
const isPdf = computed(() => {
  return props.accept.includes("application/pdf");
});

// Handle file input change
const previewFile = (event) => {
  const file = event.target.files[0];

  // Clear previous error message
  errorMessage.value = null;

  // Validate if file is either image or pdf
  if (file) {
    const fileType = file.type;
    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreview.value = e.target.result; // Set image preview URL
        emit("updateValue", file); // Emit the image file
      };
      reader.readAsDataURL(file);
    } else if (isPdf.value && fileType === "application/pdf") {
      filePreview.value = file;
      emit("updateValue", file); // Emit the PDF file
    } else {
      errorMessage.value = "Please upload a valid image or PDF file.";
      filePreview.value = null; // Clear the preview if invalid file
      emit("updateValue", null); // Emit null if invalid file
    }
  }
};

// Remove file preview
const removeFile = () => {
  filePreview.value = null; // Clear the file preview
  emit("updateValue", null); // Emit null when the file is removed
};
onMounted(() => {
  // Set the initial file preview if existing URL is provided
  if (props.existingUrl) {
    initialUrl.value = props.existingUrl;
  }
});
</script>

<template>
  <div class="image-upload">
    <div class="upload-header">
      <label class="upload-label">
        {{ label }}
        <span v-if="required" class="required">*</span>
      </label>
      <span v-if="multiple" class="upload-count"
        >{{ images.length }}/{{ max }}</span
      >
    </div>

    <div class="images-grid">
      <div v-for="(image, index) in images" :key="index" class="image-item">
        <img :src="image" :alt="`参考图 ${index + 1}`" class="image-preview" />
        <button
          class="remove-button"
          @click="removeImage(index)"
          :aria-label="`删除图片 ${index + 1}`"
        >
          ✕
        </button>
      </div>

      <div
        v-if="canAddMore"
        class="upload-area"
        :style="images.length > 0 ? 'aspect-ratio:initial;' : ''"
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="{ dragging: isDragging }"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          :multiple="multiple"
          @change="handleFileSelect"
          class="file-input"
        />
        <div class="upload-content">
          <img
            src="@/assets/icons/add-image.svg"
            alt="上传"
            class="upload-icon"
          />
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  max: {
    type: Number,
    default: 10,
  },
  label: {
    type: String,
    default: "参考图",
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const fileInput = ref(null);
const isDragging = ref(false);
const error = ref("");

const images = computed(() => props.modelValue);

const canAddMore = computed(() => {
  if (!props.multiple) {
    return images.value.length === 0;
  }
  return images.value.length < props.max;
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  processFiles(files);
  event.target.value = ""; // Reset input
};

const handleDrop = (event) => {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files).filter((file) =>
    file.type.startsWith("image/")
  );
  processFiles(files);
};

// 压缩图片函数
const compressImage = async (file, targetSizeInMB = 10) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 如果文件小于目标大小，直接返回原图
        if (file.size <= targetSizeInMB * 1024 * 1024) {
          resolve(e.target.result);
          return;
        }

        // 使用二分查找找到最佳质量
        let minQuality = 0.1;
        let maxQuality = 0.95;
        let bestQuality = 0.95;
        let bestDataUrl = null;

        const tryCompress = (quality) => {
          return new Promise((resolveCompress) => {
            canvas.toBlob(
              (blob) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  resolveCompress({
                    dataUrl: e.target.result,
                    size: blob.size,
                    quality: quality
                  });
                };
                reader.readAsDataURL(blob);
              },
              'image/jpeg',
              quality
            );
          });
        };

        // 二分查找最佳质量
        const binarySearch = async () => {
          let iterations = 0;
          const maxIterations = 10;

          while (maxQuality - minQuality > 0.01 && iterations < maxIterations) {
            const midQuality = (minQuality + maxQuality) / 2;
            const result = await tryCompress(midQuality);

            if (result.size <= targetSizeInMB * 1024 * 1024) {
              bestQuality = result.quality;
              bestDataUrl = result.dataUrl;
              minQuality = midQuality;
            } else {
              maxQuality = midQuality;
            }

            iterations++;
          }

          // 如果还是没找到合适的，使用最低质量
          if (!bestDataUrl) {
            const result = await tryCompress(minQuality);
            bestDataUrl = result.dataUrl;
          }

          resolve(bestDataUrl);
        };

        binarySearch();
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
};

const processFiles = async (files) => {
  error.value = "";

  const remainingSlots = props.multiple ? props.max - images.value.length : 1;
  const filesToProcess = files.slice(0, remainingSlots);

  if (files.length > filesToProcess.length) {
    error.value = `最多只能上传 ${props.max} 张图片`;
  }

  for (const file of filesToProcess) {
    try {
      const dataUrl = await compressImage(file);
      const newImages = props.multiple
        ? [...images.value, dataUrl]
        : [dataUrl];
      emit("update:modelValue", newImages);
    } catch (err) {
      error.value = err.message || "图片处理失败";
      console.error('Image processing error:', err);
    }
  }
};

const removeImage = (index) => {
  const newImages = images.value.filter((_, i) => i !== index);
  emit("update:modelValue", newImages);
  error.value = "";
};
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.upload-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--c-text);
}

.required {
  color: var(--c-error);
}

.upload-count {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-button);
  overflow: hidden;
  background-color: var(--c-input);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-button {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--motion-base) var(--easing);
}

.image-item:hover .remove-button {
  opacity: 1;
}

.remove-button:hover {
  background-color: var(--c-error);
}

.upload-area {
  aspect-ratio: 1;
  /* border: 2px dashed #ddd !important; */
  border: 2px dashed var(--c-img-border);
  border-radius: var(--radius-button);
  background-color: var(--c-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--motion-base) var(--easing);
  box-sizing: border-box;
}

.upload-area:hover {
  border-color: var(--c-primary);
  background-color: var(--c-input);
}

.upload-area.dragging {
  border-color: var(--c-primary);
  background-color: var(--c-input);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.15);
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.upload-icon {
  width: 20px;
  height: 20px;
  opacity: 0.5;
}

.error-message {
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--c-error);
  border-radius: var(--radius-button);
  color: var(--c-error);
  font-size: var(--font-size-sm);
}
</style>

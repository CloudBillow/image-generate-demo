<template>
  <div class="image-upload">
    <div class="upload-header">
      <label class="upload-label">{{ label }}</label>
      <span v-if="multiple" class="upload-count">{{ images.length }}/{{ max }}</span>
    </div>

    <div class="images-grid">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="image-item"
      >
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
          <span class="upload-icon">📷</span>
          <span class="upload-text">点击或拖拽上传</span>
          <span class="upload-hint">支持 JPG、PNG 格式</span>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  multiple: {
    type: Boolean,
    default: false
  },
  max: {
    type: Number,
    default: 10
  },
  label: {
    type: String,
    default: '参考图'
  }
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const isDragging = ref(false)
const error = ref('')

const images = computed(() => props.modelValue)

const canAddMore = computed(() => {
  if (!props.multiple) {
    return images.value.length === 0
  }
  return images.value.length < props.max
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  processFiles(files)
  event.target.value = '' // Reset input
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files).filter(file =>
    file.type.startsWith('image/')
  )
  processFiles(files)
}

const processFiles = (files) => {
  error.value = ''

  const remainingSlots = props.multiple ? props.max - images.value.length : 1
  const filesToProcess = files.slice(0, remainingSlots)

  if (files.length > filesToProcess.length) {
    error.value = `最多只能上传 ${props.max} 张图片`
  }

  filesToProcess.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      error.value = '图片大小不能超过 10MB'
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const newImages = props.multiple
        ? [...images.value, e.target.result]
        : [e.target.result]
      emit('update:modelValue', newImages)
    }
    reader.onerror = () => {
      error.value = '图片读取失败'
    }
    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  const newImages = images.value.filter((_, i) => i !== index)
  emit('update:modelValue', newImages)
  error.value = ''
}
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

.upload-count {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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
  border: 2px dashed var(--c-border);
  border-radius: var(--radius-button);
  background-color: var(--c-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--motion-base) var(--easing);
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
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  text-align: center;
}

.upload-icon {
  font-size: var(--font-size-2xl);
}

.upload-text {
  font-size: var(--font-size-sm);
  color: var(--c-text);
  font-weight: 500;
}

.upload-hint {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
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

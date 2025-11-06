<template>
  <div class="parameter-form">
    <div class="form-group">
      <label for="apiKey" class="form-label">
        API Key
        <span class="required">*</span>
      </label>
      <input
        id="apiKey"
        v-model="formData.apiKey"
        type="password"
        class="form-input"
        placeholder="输入您的 ARK API Key"
        @blur="saveApiKey"
      />
      <span class="form-hint">API Key 将保存在浏览器本地</span>
    </div>

    <div class="form-group">
      <label for="prompt" class="form-label">
        提示词
        <span class="required">*</span>
      </label>
      <textarea
        id="prompt"
        v-model="formData.prompt"
        class="form-textarea"
        placeholder="描述您想生成的图片..."
        rows="4"
      ></textarea>
    </div>

    <div v-if="needsReferenceImage" class="form-group">
      <ImageUpload
        v-model="formData.images"
        :multiple="mode === 'images-to-images'"
        :max="mode === 'images-to-images' ? 4 : 1"
        :label="mode === 'images-to-images' ? '参考图 (2-4张)' : '参考图'"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="size" class="form-label">图片尺寸</label>
        <select id="size" v-model="formData.size" class="form-select">
          <option value="512x512">512×512</option>
          <option value="1024x1024">1024×1024</option>
          <option value="1536x1536">1536×1536</option>
          <option value="2K">2K</option>
          <option value="4K">4K</option>
        </select>
      </div>

      <div v-if="supportsMultipleImages" class="form-group">
        <label for="maxImages" class="form-label">输出张数</label>
        <select id="maxImages" v-model.number="formData.maxImages" class="form-select">
          <option :value="2">2 张</option>
          <option :value="3">3 张</option>
          <option :value="4">4 张</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            v-model="formData.watermark"
            type="checkbox"
            class="form-checkbox"
          />
          <span>添加水印</span>
        </label>
      </div>

      <div v-if="supportsMultipleImages" class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            v-model="formData.stream"
            type="checkbox"
            class="form-checkbox"
          />
          <span>流式输出</span>
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button
        class="btn-primary"
        @click="handleSubmit"
        :disabled="!isValid || isLoading"
      >
        {{ isLoading ? '生成中...' : '生成图片' }}
      </button>
      <button
        v-if="isLoading"
        class="btn-secondary"
        @click="$emit('cancel')"
      >
        取消
      </button>
    </div>

    <div v-if="validationError" class="error-message">
      {{ validationError }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ImageUpload from './ImageUpload.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  apiKey: '',
  prompt: '',
  images: [],
  size: '2K',
  watermark: true,
  maxImages: 3,
  stream: true
})

const validationError = ref('')

// Load API Key from localStorage
onMounted(() => {
  const savedApiKey = localStorage.getItem('ark_api_key')
  if (savedApiKey) {
    formData.value.apiKey = savedApiKey
  }
})

// Save API Key to localStorage
const saveApiKey = () => {
  if (formData.value.apiKey) {
    localStorage.setItem('ark_api_key', formData.value.apiKey)
  }
}

// Computed properties
const needsReferenceImage = computed(() => {
  return props.mode === 'image-to-image' || props.mode === 'images-to-images'
})

const supportsMultipleImages = computed(() => {
  return props.mode === 'text-to-images' || props.mode === 'images-to-images'
})

const isValid = computed(() => {
  if (!formData.value.apiKey || !formData.value.prompt) {
    return false
  }

  if (props.mode === 'image-to-image' && formData.value.images.length !== 1) {
    return false
  }

  if (props.mode === 'images-to-images' && (formData.value.images.length < 2 || formData.value.images.length > 4)) {
    return false
  }

  return true
})

// Watch mode changes and reset relevant fields
watch(() => props.mode, () => {
  formData.value.images = []
  validationError.value = ''
})

const handleSubmit = () => {
  validationError.value = ''

  // Validation
  if (!formData.value.apiKey) {
    validationError.value = '请输入 API Key'
    return
  }

  if (!formData.value.prompt) {
    validationError.value = '请输入提示词'
    return
  }

  if (props.mode === 'image-to-image' && formData.value.images.length !== 1) {
    validationError.value = '请上传 1 张参考图'
    return
  }

  if (props.mode === 'images-to-images') {
    if (formData.value.images.length < 2) {
      validationError.value = '请至少上传 2 张参考图'
      return
    }
    if (formData.value.images.length > 4) {
      validationError.value = '最多上传 4 张参考图'
      return
    }
  }

  // Build request payload
  const payload = {
    model: 'doubao-seedream-4-0-250828',
    prompt: formData.value.prompt,
    size: formData.value.size,
    watermark: formData.value.watermark,
    response_format: 'url'
  }

  // Mode-specific configurations
  switch (props.mode) {
    case 'text-to-image':
      payload.sequential_image_generation = 'disabled'
      payload.stream = false
      break

    case 'text-to-images':
      payload.sequential_image_generation = 'auto'
      payload.sequential_image_generation_options = {
        max_images: formData.value.maxImages
      }
      payload.stream = formData.value.stream
      break

    case 'image-to-image':
      payload.image = formData.value.images[0]
      payload.sequential_image_generation = 'disabled'
      payload.stream = false
      break

    case 'images-to-images':
      payload.image = formData.value.images
      payload.sequential_image_generation = 'auto'
      payload.sequential_image_generation_options = {
        max_images: formData.value.maxImages
      }
      payload.stream = formData.value.stream
      break
  }

  emit('submit', {
    apiKey: formData.value.apiKey,
    payload
  })
}
</script>

<style scoped>
.parameter-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--c-text);
}

.required {
  color: var(--c-error);
}

.form-input,
.form-select {
  padding: var(--space-md);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  background-color: var(--c-input);
  color: var(--c-text);
  font-size: var(--font-size-base);
  transition: all var(--motion-base) var(--easing);
}

.form-textarea {
  padding: var(--space-md);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  background-color: var(--c-input);
  color: var(--c-text);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  resize: vertical;
  transition: all var(--motion-base) var(--easing);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--c-text);
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--c-primary);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
}

.btn-primary,
.btn-secondary {
  padding: var(--space-md) var(--space-2xl);
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all var(--motion-base) var(--easing);
}

.btn-primary {
  flex: 1;
  background: var(--g-primary);
  color: white;
  box-shadow: var(--shadow-low);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: var(--shadow-mid);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary {
  padding: var(--space-md) var(--space-xl);
  background-color: transparent;
  color: var(--c-text-2);
  border: 1px solid var(--c-border);
}

.btn-secondary:hover {
  background-color: var(--c-input);
  color: var(--c-text);
}

.error-message {
  padding: var(--space-md);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--c-error);
  border-radius: var(--radius-button);
  color: var(--c-error);
  font-size: var(--font-size-sm);
}
</style>

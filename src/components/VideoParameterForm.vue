<template>
  <div class="parameter-form">
    <div class="form-group">
      <label for="apiKey" class="form-label">
        <span>API Key<span class="required">*</span></span>
        <a href="https://api.apiyi.com" target="_blank" class="help-link">如何获取?</a>
      </label>
      <input
        id="apiKey"
        v-model="formData.apiKey"
        type="password"
        class="form-input"
        placeholder="输入您的 API易 API Key"
        @blur="saveApiKey"
      />
      <span class="form-hint">API Key 将保存在浏览器本地</span>
    </div>

    <div class="form-group">
      <label for="model" class="form-label">
        模型选择<span class="required">*</span>
      </label>
      <select id="model" v-model="formData.model" class="form-select">
        <option v-for="model in availableModels" :key="model.id" :value="model.id">
          {{ model.name }} - {{ model.resolution }} ({{ model.duration }})
        </option>
      </select>
      <span class="form-hint">
        {{ selectedModelDescription }}
      </span>
    </div>

    <div class="form-group">
      <label for="prompt" class="form-label">
        提示词<span class="required">*</span>
      </label>
      <textarea
        id="prompt"
        v-model="formData.prompt"
        class="form-textarea"
        :placeholder="mode === 'text-to-video' ? '描述您想生成的视频场景...' : '描述如何让这个场景动起来...'"
        rows="4"
      ></textarea>
      <span class="form-hint">建议使用清晰具体的描述，包含动作、场景、情感等细节</span>
    </div>

    <div v-if="mode === 'image-to-video'" class="form-group">
      <ImageUpload
        v-model="formData.images"
        :multiple="false"
        :max="1"
        label="参考图片"
      />
      <span class="form-hint">上传一张图片作为视频生成的起始画面</span>
    </div>

    <div class="form-actions">
      <button
        class="btn-primary"
        @click="handleSubmit"
        :disabled="!isValid || isLoading"
      >
        {{ isLoading ? '生成中...' : '生成视频' }}
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
import { ref, computed, onMounted, watch } from 'vue'
import ImageUpload from './ImageUpload.vue'
import { SORA_MODELS } from '../services/soraApi.js'

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

// 表单数据
const formData = ref({
  apiKey: '',
  prompt: '',
  model: 'sora_video2',
  images: []
})

// 验证错误
const validationError = ref('')

// 可用模型列表
const availableModels = computed(() => SORA_MODELS)

// 选中模型的描述
const selectedModelDescription = computed(() => {
  const model = SORA_MODELS.find(m => m.id === formData.value.model)
  return model ? `${model.description} - 预计生成时间 2-4 分钟` : ''
})

// 表单验证
const isValid = computed(() => {
  const hasApiKey = formData.value.apiKey.trim().length > 0
  const hasPrompt = formData.value.prompt.trim().length > 0
  const hasImage = props.mode === 'text-to-video' || formData.value.images.length > 0

  return hasApiKey && hasPrompt && hasImage
})

// 从 localStorage 加载 API Key
onMounted(() => {
  const savedApiKey = localStorage.getItem('sora_api_key')
  if (savedApiKey) {
    formData.value.apiKey = savedApiKey
  }
})

// 保存 API Key 到 localStorage
const saveApiKey = () => {
  if (formData.value.apiKey.trim()) {
    localStorage.setItem('sora_api_key', formData.value.apiKey.trim())
  }
}

// 监听模式变化，清空图片
watch(() => props.mode, (newMode) => {
  if (newMode === 'text-to-video') {
    formData.value.images = []
  }
})

// 提交表单
const handleSubmit = () => {
  validationError.value = ''

  // 验证
  if (!formData.value.apiKey.trim()) {
    validationError.value = '请输入 API Key'
    return
  }

  if (!formData.value.prompt.trim()) {
    validationError.value = '请输入提示词'
    return
  }

  if (props.mode === 'image-to-video' && formData.value.images.length === 0) {
    validationError.value = '请上传参考图片'
    return
  }

  // 发送提交事件
  emit('submit', {
    apiKey: formData.value.apiKey.trim(),
    prompt: formData.value.prompt.trim(),
    model: formData.value.model,
    imageUrl: props.mode === 'image-to-video' ? formData.value.images[0] : null
  })
}
</script>

<style scoped>
.parameter-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--c-text);
  display: flex;
  align-items: center;
}

.required {
  color: var(--c-error);
}

.help-link {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
  text-decoration: none;
  margin-left: auto;
}

.help-link:hover {
  color: var(--c-primary);
  text-decoration: underline;
}

.form-input,
.form-select,
.form-textarea {
  padding: var(--space-sm);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  background-color: var(--c-input);
  color: var(--c-text);
  font-size: var(--font-size-sm);
  transition: all var(--motion-base) var(--easing);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--c-text-2);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.25);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-md);
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--motion-base) var(--easing);
}

.btn-primary {
  background: var(--c-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--c-primary-600);
  box-shadow: var(--shadow-low);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--c-surface);
  color: var(--c-text);
  border: 1px solid var(--c-border);
}

.btn-secondary:hover {
  background: var(--c-input);
}

.error-message {
  padding: var(--space-sm) var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-button);
  color: #ef4444;
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

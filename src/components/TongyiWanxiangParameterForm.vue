<template>
  <div class="parameter-form">
    <div class="form-group">
      <label for="apiKey" class="form-label">
        <span>API Key<span class="required">*</span></span>
        <a href="https://dashscope.console.aliyun.com/" target="_blank" class="help-link">如何获取?</a>
      </label>
      <input
        id="apiKey"
        v-model="formData.apiKey"
        type="password"
        class="form-input"
        placeholder="输入您的阿里云百炼 API Key"
        @blur="saveApiKey"
      />
      <span class="form-hint">API Key 将保存在浏览器本地</span>
    </div>

    <div class="form-group">
      <label for="prompt" class="form-label">
        提示词<span class="required">*</span>
      </label>
      <textarea
        id="prompt"
        v-model="formData.prompt"
        class="form-textarea"
        placeholder="描述如何让这个场景动起来..."
        rows="4"
        maxlength="2000"
      ></textarea>
      <span class="form-hint">支持中英文，最多2000字符 ({{ formData.prompt.length }}/2000)</span>
    </div>

    <div class="form-group">
      <ImageUpload
        v-model="formData.images"
        :multiple="false"
        :max="1"
        label="参考图片"
      />
      <span class="form-hint">上传一张图片作为视频生成的起始画面</span>
    </div>

    <div class="form-group">
      <label for="resolution" class="form-label">
        分辨率
      </label>
      <select id="resolution" v-model="formData.resolution" class="form-select">
        <option v-for="option in resolutionOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="form-hint">分辨率越高，生成视频质量越好，费用也越高</span>
    </div>

    <div class="form-group">
      <label for="duration" class="form-label">
        视频时长
      </label>
      <select id="duration" v-model="formData.duration" class="form-select">
        <option v-for="option in durationOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="form-hint">时长越长，费用越高</span>
    </div>

    <div class="form-group">
      <div class="advanced-options">
        <div class="advanced-header" @click="showAdvanced = !showAdvanced">
          <span>高级选项</span>
          <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
        </div>
        <div v-if="showAdvanced" class="advanced-content">
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.promptExtend" />
              <span>Prompt智能改写</span>
            </label>
            <span class="form-hint">使用大模型对提示词进行智能优化，提升生成效果</span>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.audio" />
              <span>自动配音</span>
            </label>
            <span class="form-hint">为视频自动添加背景音频</span>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.watermark" />
              <span>添加水印</span>
            </label>
            <span class="form-hint">在视频右下角添加"AI生成"水印</span>
          </div>
        </div>
      </div>
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
import { ref, computed, onMounted } from 'vue'
import ImageUpload from './ImageUpload.vue'
import { RESOLUTION_OPTIONS, DURATION_OPTIONS } from '../services/tongyiWanxiangApi.js'

const props = defineProps({
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
  images: [],
  resolution: '1080P',
  duration: 5,
  promptExtend: true,
  watermark: false,
  audio: true
})

// 验证错误
const validationError = ref('')

// 是否显示高级选项
const showAdvanced = ref(false)

// 选项列表
const resolutionOptions = RESOLUTION_OPTIONS
const durationOptions = DURATION_OPTIONS

// 表单验证
const isValid = computed(() => {
  const hasApiKey = formData.value.apiKey.trim().length > 0
  const hasPrompt = formData.value.prompt.trim().length > 0
  const hasImage = formData.value.images.length > 0
  const promptNotTooLong = formData.value.prompt.length <= 2000

  return hasApiKey && hasPrompt && hasImage && promptNotTooLong
})

// 从 localStorage 加载 API Key
onMounted(() => {
  const savedApiKey = localStorage.getItem('tongyi_wanxiang_api_key')
  if (savedApiKey) {
    formData.value.apiKey = savedApiKey
  }
})

// 保存 API Key 到 localStorage
const saveApiKey = () => {
  if (formData.value.apiKey.trim()) {
    localStorage.setItem('tongyi_wanxiang_api_key', formData.value.apiKey.trim())
  }
}

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

  if (formData.value.prompt.length > 2000) {
    validationError.value = '提示词超过2000字符限制'
    return
  }

  if (formData.value.images.length === 0) {
    validationError.value = '请上传参考图片'
    return
  }

  // 发送提交事件
  emit('submit', {
    apiKey: formData.value.apiKey.trim(),
    prompt: formData.value.prompt.trim(),
    imageUrl: formData.value.images[0],
    resolution: formData.value.resolution,
    duration: formData.value.duration,
    promptExtend: formData.value.promptExtend,
    watermark: formData.value.watermark,
    audio: formData.value.audio
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

.advanced-options {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  overflow: hidden;
}

.advanced-header {
  padding: var(--space-sm);
  background-color: var(--c-input);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--c-text);
  transition: background-color var(--motion-base) var(--easing);
}

.advanced-header:hover {
  background-color: var(--c-border);
}

.toggle-icon {
  font-size: 10px;
  color: var(--c-text-2);
}

.advanced-content {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--c-text);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid var(--c-border);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all var(--motion-base) var(--easing);
  background-color: var(--c-input);
}

.checkbox-label input[type="checkbox"]:hover {
  border-color: var(--c-primary);
}

.checkbox-label input[type="checkbox"]:checked {
  background-color: var(--c-primary);
  border-color: var(--c-primary);
}

.checkbox-label input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
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

<template>
  <div class="parameter-form">
    <div class="form-group">
      <label for="apiKey" class="form-label">
        <span>API Key<span class="required">*</span></span>
        <a href="https://www.plato.im" target="_blank" class="help-link">如何获取?</a>
      </label>
      <input
        id="apiKey"
        v-model="formData.apiKey"
        type="password"
        class="form-input"
        placeholder="输入您的柏拉图 API Key"
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
          {{ model.name }}
        </option>
      </select>
      <span class="form-hint">
        {{ selectedModelDescription }}
      </span>
    </div>

    <div class="form-group">
      <label for="aspectRatio" class="form-label">
        宽高比<span class="required">*</span>
      </label>
      <select id="aspectRatio" v-model="formData.aspectRatio" class="form-select">
        <option v-for="ratio in aspectRatios" :key="ratio.value" :value="ratio.value">
          {{ ratio.label }}
        </option>
      </select>
      <span class="form-hint">选择输出视频的宽高比</span>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="duration" class="form-label">
          时长<span class="required">*</span>
        </label>
        <select id="duration" v-model="formData.duration" class="form-select">
          <option v-for="dur in availableDurations" :key="dur.value" :value="dur.value">
            {{ dur.label }}
          </option>
        </select>
        <span class="form-hint">{{ durationHint }}</span>
      </div>

      <div v-if="supportsHD" class="form-group">
        <label class="form-label">高清模式</label>
        <div class="checkbox-wrapper">
          <input
            id="hd"
            v-model="formData.hd"
            type="checkbox"
            class="form-checkbox"
          />
          <label for="hd" class="checkbox-label">
            启用HD
          </label>
        </div>
        <span class="form-hint">高清模式生成速度较慢</span>
      </div>
    </div>

    <div class="form-group">
      <ImageUpload
        v-model="formData.images"
        :multiple="true"
        :max="5"
        label="参考图片"
      />
      <span class="form-hint">支持上传多张图片（最多5张），支持URL或Base64格式</span>
      <span class="form-hint warning-hint">
        ⚠️ 请勿上传真人照片或高度真实的人脸，可能无法通过审查
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
        placeholder="描述如何让这个场景动起来..."
        rows="4"
      ></textarea>
      <span class="form-hint warning-hint">
        ⚠️ 避免涉及暴力、色情、版权内容或在世名人
      </span>
    </div>

    <div class="info-box">
      <h4 class="info-title">审查机制说明</h4>
      <ul class="info-list">
        <li>提交图片：不能包含真人或高度真实的人脸</li>
        <li>提示词内容：不得涉及暴力、色情、版权、在世名人</li>
        <li>生成结果：生成到90%+可能因审查失败</li>
      </ul>
    </div>

    <div class="info-box">
      <h4 class="info-title">预计生成时间</h4>
      <ul class="info-list">
        <li>10s 视频：1-3 分钟</li>
        <li>15s 视频：+2 分钟</li>
        <li>HD 模式：+8 分钟</li>
        <li>图片访问速度慢也会影响总耗时</li>
      </ul>
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
import {
  PLATO_SORA2_MODELS,
  ASPECT_RATIOS,
  DURATIONS
} from '../services/platoSora2Api.js'

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
  model: 'sora-2',
  images: [],
  aspectRatio: '16:9',
  hd: false,
  duration: '10'
})

// 验证错误
const validationError = ref('')

// 可用模型列表
const availableModels = computed(() => PLATO_SORA2_MODELS)

// 宽高比选项
const aspectRatios = computed(() => ASPECT_RATIOS)

// 选中模型的描述
const selectedModelDescription = computed(() => {
  const model = PLATO_SORA2_MODELS.find(m => m.id === formData.value.model)
  return model ? model.description : ''
})

// 是否支持HD
const supportsHD = computed(() => {
  const model = PLATO_SORA2_MODELS.find(m => m.id === formData.value.model)
  return model ? model.supportsHD : false
})

// 可用时长选项
const availableDurations = computed(() => {
  return DURATIONS.filter(dur =>
    dur.models.includes(formData.value.model)
  )
})

// 时长提示
const durationHint = computed(() => {
  const dur = formData.value.duration
  if (dur === '10') return '10s 视频，预计1-3分钟'
  if (dur === '15') return '15s 视频，预计+2分钟'
  if (dur === '25') return '25s 视频（仅Pro支持）'
  return ''
})

// 表单验证
const isValid = computed(() => {
  const hasApiKey = formData.value.apiKey.trim().length > 0
  const hasPrompt = formData.value.prompt.trim().length > 0
  const hasImage = formData.value.images.length > 0

  return hasApiKey && hasPrompt && hasImage
})

// 从 localStorage 加载 API Key
onMounted(() => {
  const savedApiKey = localStorage.getItem('plato_sora2_api_key')
  if (savedApiKey) {
    formData.value.apiKey = savedApiKey
  }
})

// 保存 API Key 到 localStorage
const saveApiKey = () => {
  if (formData.value.apiKey.trim()) {
    localStorage.setItem('plato_sora2_api_key', formData.value.apiKey.trim())
  }
}

// 监听模型变化，调整参数
watch(() => formData.value.model, (newModel) => {
  // 如果切换到非Pro模型，禁用HD
  const model = PLATO_SORA2_MODELS.find(m => m.id === newModel)
  if (model && !model.supportsHD) {
    formData.value.hd = false
  }

  // 检查当前时长是否支持
  const currentDuration = formData.value.duration
  const supportedDurations = DURATIONS.filter(dur => dur.models.includes(newModel))
  const isSupported = supportedDurations.some(dur => dur.value === currentDuration)

  if (!isSupported) {
    // 重置为默认10s
    formData.value.duration = '10'
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

  if (formData.value.images.length === 0) {
    validationError.value = '请上传参考图片'
    return
  }

  // 发送提交事件
  emit('submit', {
    apiKey: formData.value.apiKey.trim(),
    prompt: formData.value.prompt.trim(),
    model: formData.value.model,
    images: formData.value.images,
    aspectRatio: formData.value.aspectRatio,
    hd: formData.value.hd,
    duration: formData.value.duration
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

.warning-hint {
  color: #f59e0b;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  padding: var(--space-sm) 0;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  margin-right: var(--space-xs);
  cursor: pointer;
}

.checkbox-label {
  font-size: var(--font-size-sm);
  color: var(--c-text);
  cursor: pointer;
}

.info-box {
  background-color: rgba(16, 163, 127, 0.05);
  border: 1px solid rgba(16, 163, 127, 0.2);
  border-radius: var(--radius-button);
  padding: var(--space-md);
}

.info-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-xs);
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: var(--c-primary);
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

<template>
  <div class="parameter-form">
    <!-- API Key -->
    <div class="form-group">
      <label for="apiKey" class="form-label">
        <span>API Key<span class="required">*</span></span>
        <a href="https://console.volcengine.com/ark" target="_blank" class="help-link">如何获取?</a>
      </label>
      <input
        id="apiKey"
        v-model="formData.apiKey"
        type="password"
        class="form-input"
        placeholder="输入您的火山引擎 API Key"
        @blur="saveApiKey"
      />
      <span class="form-hint">API Key 将保存在浏览器本地</span>
    </div>

    <!-- 提示词 -->
    <div class="form-group">
      <label for="prompt" class="form-label">
        提示词<span v-if="props.mode === 'text-to-video'" class="required">*</span>
      </label>
      <textarea
        id="prompt"
        v-model="formData.prompt"
        class="form-textarea"
        :placeholder="promptPlaceholder"
        rows="4"
        maxlength="500"
      ></textarea>
      <span class="form-hint">支持中英文，建议不超过500字 ({{ formData.prompt.length }}/500)</span>
    </div>

    <!-- 首帧图片上传 -->
    <div v-if="props.mode !== 'text-to-video'" class="form-group">
      <ImageUpload
        v-model="formData.firstFrameImage"
        :multiple="false"
        :max="1"
        label="首帧图片"
        :required="true"
      />
      <span class="form-hint">上传一张图片作为视频的起始画面</span>
    </div>

    <!-- 尾帧图片上传 -->
    <div v-if="props.mode === 'first-last-frame'" class="form-group">
      <ImageUpload
        v-model="formData.lastFrameImage"
        :multiple="false"
        :max="1"
        label="尾帧图片"
        :required="true"
      />
      <span class="form-hint">上传一张图片作为视频的结束画面</span>
    </div>

    <!-- 分辨率 -->
    <div class="form-group">
      <label for="resolution" class="form-label">
        分辨率
      </label>
      <select id="resolution" v-model="formData.resolution" class="form-select">
        <option v-for="option in resolutionOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="form-hint">分辨率越高，生成视频质量越好</span>
    </div>

    <!-- 宽高比 -->
    <div class="form-group">
      <label for="ratio" class="form-label">
        宽高比
      </label>
      <select id="ratio" v-model="formData.ratio" class="form-select">
        <option v-for="option in currentRatioOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="form-hint">{{ ratioHint }}</span>
    </div>

    <!-- 视频时长 -->
    <div class="form-group">
      <label for="duration" class="form-label">
        视频时长
      </label>
      <select id="duration" v-model="formData.duration" class="form-select">
        <option v-for="option in durationOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="form-hint">时长越长，生成时间越长</span>
    </div>

    <!-- 高级选项 -->
    <div class="form-group">
      <div class="advanced-options">
        <div class="advanced-header" @click="showAdvanced = !showAdvanced">
          <span>高级选项</span>
          <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
        </div>
        <div v-if="showAdvanced" class="advanced-content">
          <!-- 随机种子 -->
          <div class="form-group">
            <label for="seed" class="form-label">
              随机种子
            </label>
            <input
              id="seed"
              v-model.number="formData.seed"
              type="number"
              class="form-input"
              placeholder="-1 表示随机"
              min="-1"
              :max="Math.pow(2, 32) - 1"
            />
            <span class="form-hint">-1 表示随机，相同种子可生成相似结果</span>
          </div>

          <!-- 固定摄像头 -->
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.cameraFixed" />
              <span>固定摄像头</span>
            </label>
            <span class="form-hint">尽量保持摄像头不移动（实际效果不保证）</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
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

    <!-- 验证错误 -->
    <div v-if="validationError" class="error-message">
      {{ validationError }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ImageUpload from './ImageUpload.vue'
import {
  RESOLUTION_OPTIONS,
  RATIO_OPTIONS_TEXT,
  RATIO_OPTIONS_IMAGE,
  DURATION_OPTIONS
} from '../services/seedanceProApi.js'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['text-to-video', 'first-frame', 'first-last-frame'].includes(value)
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
  firstFrameImage: [],
  lastFrameImage: [],
  resolution: '1080p',
  ratio: '16:9',
  duration: 5,
  seed: -1,
  cameraFixed: false
})

// 验证错误
const validationError = ref('')

// 是否显示高级选项
const showAdvanced = ref(false)

// 选项列表
const resolutionOptions = RESOLUTION_OPTIONS
const durationOptions = DURATION_OPTIONS

// 根据模式动态选择宽高比选项
const currentRatioOptions = computed(() => {
  return props.mode === 'text-to-video' ? RATIO_OPTIONS_TEXT : RATIO_OPTIONS_IMAGE
})

// 提示词占位符
const promptPlaceholder = computed(() => {
  if (props.mode === 'text-to-video') {
    return '描述你想要生成的视频场景，例如：多个镜头。一名侦探进入光线昏暗的房间。检查桌上的线索，拿起桌上的某个物品。镜头转向他正在思索。'
  } else if (props.mode === 'first-frame') {
    return '描述视频的动作和运镜，例如：女孩睁开眼，温柔地看向镜头，镜头缓缓拉出，头发被风吹动'
  } else {
    return '描述首尾帧之间的过渡，例如：360度环绕运镜'
  }
})

// 宽高比提示
const ratioHint = computed(() => {
  if (props.mode === 'text-to-video') {
    return '文生视频默认 16:9'
  } else {
    return '图生视频推荐使用自适应，会根据图片自动选择'
  }
})

// 表单验证
const isValid = computed(() => {
  const hasApiKey = formData.value.apiKey.trim().length > 0

  // 文生视频必须有提示词
  if (props.mode === 'text-to-video') {
    const hasPrompt = formData.value.prompt.trim().length > 0
    const promptNotTooLong = formData.value.prompt.length <= 500
    return hasApiKey && hasPrompt && promptNotTooLong
  }

  // 首帧生视频必须有首帧图片
  if (props.mode === 'first-frame') {
    const hasFirstFrame = formData.value.firstFrameImage.length > 0
    const promptNotTooLong = formData.value.prompt.length <= 500
    return hasApiKey && hasFirstFrame && promptNotTooLong
  }

  // 首尾帧生视频必须有首帧和尾帧图片
  if (props.mode === 'first-last-frame') {
    const hasFirstFrame = formData.value.firstFrameImage.length > 0
    const hasLastFrame = formData.value.lastFrameImage.length > 0
    const promptNotTooLong = formData.value.prompt.length <= 500
    return hasApiKey && hasFirstFrame && hasLastFrame && promptNotTooLong
  }

  return false
})

// 从 localStorage 加载 API Key
onMounted(() => {
  const savedApiKey = localStorage.getItem('volcengine_seedance_api_key')
  if (savedApiKey) {
    formData.value.apiKey = savedApiKey
  }
})

// 保存 API Key 到 localStorage
const saveApiKey = () => {
  if (formData.value.apiKey.trim()) {
    localStorage.setItem('volcengine_seedance_api_key', formData.value.apiKey.trim())
  }
}

// 监听模式切换，重置相关字段
watch(() => props.mode, (newMode) => {
  // 重置图片
  formData.value.firstFrameImage = []
  formData.value.lastFrameImage = []

  // 调整默认宽高比
  if (newMode === 'text-to-video') {
    formData.value.ratio = '16:9'
  } else {
    formData.value.ratio = 'adaptive'
  }

  // 清空验证错误
  validationError.value = ''
})

// 提交表单
const handleSubmit = () => {
  validationError.value = ''

  // 验证
  if (!formData.value.apiKey.trim()) {
    validationError.value = '请输入 API Key'
    return
  }

  if (props.mode === 'text-to-video') {
    if (!formData.value.prompt.trim()) {
      validationError.value = '请输入提示词'
      return
    }
  }

  if (props.mode === 'first-frame') {
    if (formData.value.firstFrameImage.length === 0) {
      validationError.value = '请上传首帧图片'
      return
    }
  }

  if (props.mode === 'first-last-frame') {
    if (formData.value.firstFrameImage.length === 0) {
      validationError.value = '请上传首帧图片'
      return
    }
    if (formData.value.lastFrameImage.length === 0) {
      validationError.value = '请上传尾帧图片'
      return
    }
  }

  if (formData.value.prompt.length > 500) {
    validationError.value = '提示词超过500字符限制'
    return
  }

  // 构建提交参数
  const params = {
    apiKey: formData.value.apiKey.trim(),
    prompt: formData.value.prompt.trim(),
    resolution: formData.value.resolution,
    ratio: formData.value.ratio,
    duration: formData.value.duration,
    seed: formData.value.seed,
    cameraFixed: formData.value.cameraFixed
  }

  // 根据模式添加图片
  if (props.mode === 'first-frame') {
    params.firstFrameUrl = formData.value.firstFrameImage[0]
  } else if (props.mode === 'first-last-frame') {
    params.firstFrameUrl = formData.value.firstFrameImage[0]
    params.lastFrameUrl = formData.value.lastFrameImage[0]
  }

  // 发送提交事件
  emit('submit', params)
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

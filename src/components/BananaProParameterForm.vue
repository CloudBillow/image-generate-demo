<template>
  <div class="parameter-form">
    <div class="form-group">
      <label for="apiKey" class="form-label">
        <span>API Key<span class="required">*</span></span>
        <a href="https://nano-banana-pro.feishu.cn/docx/CxKXdcQiNoDQ7Qxbp8Scsu3Snlb" target="_blank" class="help-link">如何获取?</a>
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
      <label for="prompt" class="form-label">
        {{ mode === 'text-to-image' ? '图片描述' : '编辑描述' }}
        <span class="required">*</span>
      </label>
      <textarea
        id="prompt"
        v-model="formData.prompt"
        class="form-textarea"
        :placeholder="mode === 'text-to-image' ? '描述您想生成的图片...' : '描述您想如何修改图片...'"
        rows="4"
      ></textarea>
    </div>

    <div v-if="mode === 'image-to-image'" class="form-group">
      <ImageUpload
        v-model="formData.images"
        :multiple="true"
        :max="4"
        label="参考图 (1-4张)"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="aspectRatio" class="form-label">宽高比</label>
        <select id="aspectRatio" v-model="formData.aspectRatio" class="form-select">
          <option value="1:1">1:1 (正方形)</option>
          <option value="16:9">16:9 (横屏)</option>
          <option value="9:16">9:16 (竖屏)</option>
          <option value="4:3">4:3 (横屏)</option>
          <option value="3:4">3:4 (竖屏)</option>
          <option value="3:2">3:2 (横屏)</option>
          <option value="2:3">2:3 (竖屏)</option>
          <option value="21:9">21:9 (超宽)</option>
          <option value="5:4">5:4 (横屏)</option>
          <option value="4:5">4:5 (竖屏)</option>
          <option value="7:5">7:5 (横屏)</option>
          <option value="5:7">5:7 (竖屏)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="resolution" class="form-label">分辨率</label>
        <select id="resolution" v-model="formData.resolution" class="form-select">
          <option value="1K">1K (快速)</option>
          <option value="2K">2K (推荐)</option>
          <option value="4K">4K (超高清)</option>
        </select>
      </div>
    </div>

    <div class="resolution-info">
      <span class="info-label">实际尺寸:</span>
      <span class="info-value">{{ getResolutionDimension() }}</span>
    </div>

    <div class="price-info-box">
      <div class="price-title">💰 价格说明</div>
      <div class="price-details">
        <div>• 4K 输出: $0.05/张</div>
        <div>• 官网价格: $0.24/张</div>
        <div>• 相当于官网价格的 1/5</div>
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
  },
  storageKey: {
    type: String,
    default: 'bananapro_api_key'
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  apiKey: '',
  prompt: '',
  images: [],
  aspectRatio: '1:1',
  resolution: '2K'
})

const validationError = ref('')

// 分辨率参考表
const RESOLUTION_REFERENCE = {
  '1:1': { '1K': '1024×1024', '2K': '2048×2048', '4K': '4096×4096' },
  '16:9': { '1K': '1376×768', '2K': '2752×1536', '4K': '5504×3072' },
  '9:16': { '1K': '768×1376', '2K': '1536×2752', '4K': '3072×5504' },
  '4:3': { '1K': '1200×896', '2K': '2400×1792', '4K': '4800×3584' },
  '3:4': { '1K': '896×1200', '2K': '1792×2400', '4K': '3584×4800' },
  '3:2': { '1K': '1472×896', '2K': '2944×1792', '4K': '5888×3584' },
  '2:3': { '1K': '896×1472', '2K': '1792×2944', '4K': '3584×5888' },
  '21:9': { '1K': '1584×672', '2K': '3168×1344', '4K': '6336×2688' },
  '5:4': { '1K': '1152×896', '2K': '2304×1792', '4K': '4608×3584' },
  '4:5': { '1K': '896×1152', '2K': '1792×2304', '4K': '3584×4608' },
  '7:5': { '1K': '1248×896', '2K': '2496×1792', '4K': '4992×3584' },
  '5:7': { '1K': '896×1248', '2K': '1792×2496', '4K': '3584×4992' }
}

// 加载保存的API Key
onMounted(() => {
  const savedApiKey = localStorage.getItem(props.storageKey)
  if (savedApiKey) {
    formData.value.apiKey = savedApiKey
  }
})

// 保存API Key
const saveApiKey = () => {
  if (formData.value.apiKey) {
    localStorage.setItem(props.storageKey, formData.value.apiKey)
  }
}

// 获取实际尺寸
const getResolutionDimension = () => {
  const ratio = formData.value.aspectRatio
  const resolution = formData.value.resolution

  if (RESOLUTION_REFERENCE[ratio] && RESOLUTION_REFERENCE[ratio][resolution]) {
    return RESOLUTION_REFERENCE[ratio][resolution]
  }
  return '未知'
}

// 表单验证
const isValid = computed(() => {
  if (!formData.value.apiKey || !formData.value.prompt) {
    return false
  }

  if (props.mode === 'image-to-image') {
    if (formData.value.images.length < 1 || formData.value.images.length > 4) {
      return false
    }
  }

  return true
})

// 监听模式变化
watch(() => props.mode, () => {
  formData.value.images = []
  validationError.value = ''
})

// 提交表单
const handleSubmit = () => {
  validationError.value = ''

  // 验证
  if (!formData.value.apiKey) {
    validationError.value = '请输入 API Key'
    return
  }

  if (!formData.value.prompt) {
    validationError.value = '请输入提示词'
    return
  }

  if (props.mode === 'image-to-image') {
    if (formData.value.images.length < 1) {
      validationError.value = '请至少上传 1 张参考图'
      return
    }
    if (formData.value.images.length > 4) {
      validationError.value = '最多上传 4 张参考图'
      return
    }
  }

  // 构建提交数据
  const submitData = {
    apiKey: formData.value.apiKey,
    prompt: formData.value.prompt,
    aspectRatio: formData.value.aspectRatio,
    resolution: formData.value.resolution,
    mode: props.mode
  }

  // 图生图模式添加图片数据
  if (props.mode === 'image-to-image' && formData.value.images.length > 0) {
    submitData.images = formData.value.images
  }

  emit('submit', submitData)
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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-md);
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
.form-select {
  padding: var(--space-sm);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  background-color: var(--c-input);
  color: var(--c-text);
  font-size: var(--font-size-sm);
  transition: all var(--motion-base) var(--easing);
}

.form-textarea {
  padding: var(--space-sm);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  background-color: var(--c-input);
  color: var(--c-text);
  font-size: var(--font-size-sm);
  font-family: var(--font-family),serif;
  resize: vertical;
  transition: all var(--motion-base) var(--easing);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.resolution-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background-color: var(--c-surface);
  border-radius: var(--radius-button);
  font-size: var(--font-size-xs);
}

.info-label {
  color: var(--c-text-2);
}

.info-value {
  color: var(--c-text);
  font-weight: 500;
}

.price-info-box {
  padding: var(--space-md);
  background-color: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-container);
}

.price-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-xs);
}

.price-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
}

.btn-primary,
.btn-secondary {
  padding: var(--space-sm) var(--space-xl);
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-size-sm);
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
  padding: var(--space-sm) var(--space-lg);
  background-color: transparent;
  color: var(--c-text-2);
  border: 1px solid var(--c-border);
}

.btn-secondary:hover {
  background-color: var(--c-input);
  color: var(--c-text);
}

.error-message {
  padding: var(--space-sm);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--c-error);
  border-radius: var(--radius-button);
  color: var(--c-error);
  font-size: var(--font-size-xs);
}
</style>

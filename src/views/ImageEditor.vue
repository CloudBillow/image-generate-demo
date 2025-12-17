<template>
  <div class="image-editor">
    <header class="page-header">
      <div>
        <p class="eyebrow">工具 · 图片编辑</p>
        <h1>上传、调整尺寸并导出图片</h1>
        <p class="subtitle">
          支持快速调整宽高，锁定比例，实时预览导出效果。
        </p>
      </div>
      <div class="header-actions">
        <button
          class="primary"
          :disabled="!canExport"
          @click="handleExport"
        >
          导出图片
        </button>
      </div>
    </header>

    <div class="editor-grid">
      <section class="panel">
        <div class="panel-header">
          <h3>上传图片</h3>
          <span class="panel-note">PNG / JPG / WEBP</span>
        </div>
        <label class="upload-card" for="image-input">
          <input
            id="image-input"
            class="sr-only"
            type="file"
            accept="image/*"
            @change="handleFileChange"
          />
          <div v-if="imageUrl" class="upload-preview">
            <img :src="imageUrl" alt="上传预览" />
            <div class="meta">
              <p class="name">{{ displayName }}</p>
              <p class="size">
                原始尺寸：{{ original.width }} x {{ original.height }}
              </p>
            </div>
          </div>
          <div v-else class="upload-placeholder">
            <span class="upload-icon">⬆</span>
            <div>
              <p class="title">点击或拖拽图片上传</p>
              <p class="desc">本地处理，不会上传到服务器</p>
            </div>
          </div>
        </label>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h3>尺寸调整</h3>
          <span class="panel-note">保持比例或自由缩放</span>
        </div>

        <div class="form-grid">
          <label class="field">
            <span>宽度 (px)</span>
            <div class="field-control">
              <input
                type="number"
                min="1"
                :value="targetWidth"
                :disabled="!imageUrl"
                @input="onWidthInput"
              />
              <button
                class="ghost"
                :disabled="!imageUrl"
                @click="setOriginalWidth"
              >
                原始
              </button>
            </div>
          </label>

          <label class="field">
            <span>高度 (px)</span>
            <div class="field-control">
              <input
                type="number"
                min="1"
                :value="targetHeight"
                :disabled="!imageUrl"
                @input="onHeightInput"
              />
              <button
                class="ghost"
                :disabled="!imageUrl"
                @click="setOriginalHeight"
              >
                原始
              </button>
            </div>
          </label>

          <label class="field switcher">
            <span>锁定宽高比</span>
            <label class="switch">
              <input
                type="checkbox"
                :checked="lockRatio"
                :disabled="!imageUrl"
                @change="toggleLock"
              />
              <span class="slider" />
            </label>
          </label>

          <div class="preset-row">
            <span class="preset-label">快速尺寸</span>
            <div class="preset-buttons">
              <button
                v-for="preset in presets"
                :key="preset.label"
                class="ghost"
                :disabled="!imageUrl"
                @click="applyPreset(preset)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="panel preview">
        <div class="panel-header">
          <h3>实时预览</h3>
          <span class="panel-note">原图 vs 导出效果</span>
        </div>

        <div class="preview-grid">
          <div class="preview-card">
            <div class="preview-title">
              <span>原图</span>
              <span class="meta-text">{{ original.width }} x {{ original.height }}</span>
            </div>
            <div class="frame">
              <img
                v-if="imageUrl"
                :src="imageUrl"
                alt="原始预览"
              />
              <p v-else class="placeholder">等待上传</p>
            </div>
          </div>

          <div class="preview-card">
            <div class="preview-title">
              <span>导出预览</span>
              <span class="meta-text">{{ targetWidth }} x {{ targetHeight }}</span>
            </div>
            <div class="frame">
              <img
                v-if="editedUrl"
                :src="editedUrl"
                alt="导出预览"
              />
              <p v-else class="placeholder">调整尺寸后预览</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const imageUrl = ref('')
const editedUrl = ref('')
const fileName = ref('image')
const original = reactive({ width: 0, height: 0 })
const targetWidth = ref(0)
const targetHeight = ref(0)
const lockRatio = ref(true)
const aspectRatio = ref(1)
const objectUrl = ref('')
const loadedImage = ref(null)

const presets = [
  { label: '512 × 512', width: 512, height: 512 },
  { label: '768 × 768', width: 768, height: 768 },
  { label: '1024 × 1024', width: 1024, height: 1024 },
  { label: '1920 × 1080', width: 1920, height: 1080 }
]

const canExport = computed(() => {
  return !!editedUrl.value && targetWidth.value > 0 && targetHeight.value > 0
})

const displayName = computed(() => {
  if (!fileName.value) return '未命名'
  return fileName.value
})

const revokeUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
}

const loadImage = (file) => {
  revokeUrl()
  const url = URL.createObjectURL(file)
  objectUrl.value = url
  imageUrl.value = url
  fileName.value = file.name.replace(/\.[^/.]+$/, '') || 'image'

  const img = new Image()
  img.onload = () => {
    loadedImage.value = img
    original.width = img.width
    original.height = img.height
    aspectRatio.value = img.width / img.height
    targetWidth.value = img.width
    targetHeight.value = img.height
    renderEditedImage()
  }
  img.src = url
}

const handleFileChange = (event) => {
  const [file] = event.target.files || []
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }
  loadImage(file)
  event.target.value = ''
}

const sanitizeSize = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 1
  return Math.round(parsed)
}

const renderEditedImage = () => {
  if (!loadedImage.value || targetWidth.value <= 0 || targetHeight.value <= 0) {
    editedUrl.value = ''
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth.value
  canvas.height = targetHeight.value

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(loadedImage.value, 0, 0, targetWidth.value, targetHeight.value)

  editedUrl.value = canvas.toDataURL('image/png')
}

const onWidthInput = (event) => {
  if (!imageUrl.value) return
  const width = sanitizeSize(event.target.value)
  targetWidth.value = width
  if (lockRatio.value && aspectRatio.value) {
    targetHeight.value = Math.max(1, Math.round(width / aspectRatio.value))
  }
  renderEditedImage()
}

const onHeightInput = (event) => {
  if (!imageUrl.value) return
  const height = sanitizeSize(event.target.value)
  targetHeight.value = height
  if (lockRatio.value && aspectRatio.value) {
    targetWidth.value = Math.max(1, Math.round(height * aspectRatio.value))
  }
  renderEditedImage()
}

const toggleLock = (event) => {
  lockRatio.value = event.target.checked
  if (lockRatio.value && aspectRatio.value) {
    targetHeight.value = Math.max(1, Math.round(targetWidth.value / aspectRatio.value))
    renderEditedImage()
  }
}

const setOriginalWidth = () => {
  if (!imageUrl.value) return
  targetWidth.value = original.width
  if (lockRatio.value && aspectRatio.value) {
    targetHeight.value = original.height
  }
  renderEditedImage()
}

const setOriginalHeight = () => {
  if (!imageUrl.value) return
  targetHeight.value = original.height
  if (lockRatio.value && aspectRatio.value) {
    targetWidth.value = original.width
  }
  renderEditedImage()
}

const applyPreset = (preset) => {
  targetWidth.value = preset.width
  targetHeight.value = preset.height
  if (lockRatio.value && aspectRatio.value) {
    // 调整到同样长边
    if (preset.width / preset.height > aspectRatio.value) {
      targetWidth.value = Math.round(preset.height * aspectRatio.value)
    } else if (preset.width / preset.height < aspectRatio.value) {
      targetHeight.value = Math.round(preset.width / aspectRatio.value)
    }
  }
  renderEditedImage()
}

const handleExport = () => {
  if (!editedUrl.value) return
  const link = document.createElement('a')
  link.href = editedUrl.value
  link.download = `${fileName.value || 'image'}-${targetWidth.value}x${targetHeight.value}.png`
  link.click()
}

watch([targetWidth, targetHeight], () => {
  renderEditedImage()
})

onBeforeUnmount(() => {
  revokeUrl()
})
</script>

<style scoped>
.image-editor {
  padding: var(--space-3xl);
  color: var(--c-text);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
}

.eyebrow {
  color: var(--c-text-2);
  font-size: var(--font-size-sm);
  letter-spacing: 0.3px;
}

h1 {
  font-size: var(--font-size-2xl);
  margin: 6px 0;
}

.subtitle {
  color: var(--c-text-2);
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
}

button {
  border: none;
  border-radius: var(--radius-button);
  padding: 10px 16px;
  font-weight: 600;
  background: var(--c-input);
  color: var(--c-text);
}

button.primary {
  background: var(--g-primary);
  color: #fff;
}

button.ghost {
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text);
}

button:disabled {
  opacity: 0.5;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-xl);
}

.panel {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-container);
  padding: var(--space-xl);
  box-shadow: var(--shadow-low);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.panel-note {
  color: var(--c-text-2);
  font-size: var(--font-size-sm);
}

.upload-card {
  display: block;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-container);
  padding: var(--space-xl);
  cursor: pointer;
  transition: border-color var(--motion-base) var(--easing), background-color var(--motion-base) var(--easing);
}

.upload-card:hover {
  border-color: var(--c-primary);
  background: rgba(126, 87, 194, 0.06);
}

.upload-preview {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.upload-preview img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--c-border);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-weight: 600;
}

.size {
  color: var(--c-text-2);
}

.upload-placeholder {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  color: var(--c-text-2);
}

.upload-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--c-input);
  display: grid;
  place-items: center;
  font-size: var(--font-size-xl);
}

.upload-placeholder .title {
  color: var(--c-text);
  font-weight: 600;
}

.upload-placeholder .desc {
  font-size: var(--font-size-sm);
}

.form-grid {
  display: grid;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--c-text);
}

.field-control {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.field input[type="number"] {
  flex: 1;
  background: var(--c-input);
  color: var(--c-text);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-input);
  padding: 10px 12px;
}

.switcher {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4b5563;
  transition: 0.2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.switch input:checked + .slider {
  background: var(--c-primary);
}

.switch input:checked + .slider:before {
  transform: translateX(20px);
}

.preset-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.preset-label {
  color: var(--c-text-2);
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.preview {
  grid-column: 1 / -1;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-md);
}

.preview-card {
  background: var(--c-input);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-container);
  padding: var(--space-md);
}

.preview-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--c-text);
  margin-bottom: var(--space-sm);
}

.meta-text {
  color: var(--c-text-2);
}

.frame {
  background: #0f1117;
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-input);
  min-height: 200px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.placeholder {
  color: var(--c-text-2);
  font-size: var(--font-size-sm);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

<template>
  <div class="result-panel">
    <div class="panel-header">
      <h2 class="panel-title">生成结果</h2>
      <div v-if="status" class="status-badge" :class="`status-${status}`">
        {{ statusText }}
      </div>
    </div>

    <div v-if="error" class="error-box">
      <div class="error-title">生成失败</div>
      <div class="error-details">{{ error }}</div>
    </div>

    <div v-if="results.length === 0 && !isLoading && !error" class="empty-state">
      <div class="empty-icon">🖼️</div>
      <div class="empty-text">暂无生成结果</div>
      <div class="empty-hint">请配置参数后点击"生成图片"</div>
    </div>

    <div v-if="isLoading && results.length === 0" class="loading-state">
      <div class="loading-spinner"></div>
    </div>

    <div v-if="results.length > 0" class="results-grid">
      <div
        v-for="(result, index) in results"
        :key="index"
        class="result-item"
        :style="{ aspectRatio: getAspectRatio(result.size) }"
      >
        <div v-if="result.loading" class="result-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text-small">生成中...</div>
        </div>

        <div v-else-if="result.error" class="result-error">
          <div class="error-icon">⚠️</div>
          <div class="error-text-small">{{ result.error }}</div>
        </div>

        <div v-else class="result-success">
          <img
            :src="result.url"
            :alt="`生成图片 ${index + 1}`"
            class="result-image"
            @load="handleImageLoad(index)"
            @error="handleImageError(index)"
          />
          <div class="result-overlay">
            <div class="result-actions">
              <el-button
                :icon="View"
                circle
                @click="openPreview(result.url)"
                title="预览图片"
              />
              <el-button
                :icon="Download"
                circle
                @click="downloadImage(result.url, index)"
                title="下载图片"
              />
            </div>
            <div v-if="result.size" class="result-info">
              {{ result.size }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="generationTime > 0 && results.length > 0" class="generation-time">
      总耗时: {{ generationTime }}秒
    </div>

    <!-- Image Preview Dialog -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewImageUrl]"
      :initial-index="0"
      :hide-on-click-modal="true"
      @close="closePreview"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Download, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  status: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  usage: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  watermarkText: {
    type: String,
    default: ''
  },
  generationTime: {
    type: [Number, String],
    default: 0
  }
})

// Image preview
const previewImageUrl = ref('')
const previewVisible = ref(false)

const statusText = computed(() => {
  const statusMap = {
    preparing: '准备中',
    requesting: '生成中',
    streaming: '生成中',
    completed: '完成',
    failed: '失败'
  }
  return statusMap[props.status] || ''
})

const openPreview = async (url) => {
  try {
    console.log('Opening preview with watermark:', props.watermarkText)
    // Add watermark to preview if watermarkText is provided
    if (props.watermarkText) {
      // ElMessage.info('正在添加水印...')
      const watermarkedUrl = await addWatermarkToImage(url, props.watermarkText)
      previewImageUrl.value = watermarkedUrl
    } else {
      previewImageUrl.value = url
    }
    previewVisible.value = true
  } catch (err) {
    console.error('Failed to prepare preview:', err)
    ElMessage.warning('水印添加失败，显示原图')
    // Fallback to original image
    previewImageUrl.value = url
    previewVisible.value = true
  }
}

const closePreview = () => {
  // No need to clean up data URLs
  previewVisible.value = false
  previewImageUrl.value = ''
}

const handleImageLoad = (index) => {
  console.log(`Image ${index + 1} loaded successfully`)
}

const handleImageError = (index) => {
  console.error(`Image ${index + 1} failed to load`)
}

/**
 * Add watermark to image using canvas
 */
const addWatermarkToImage = (imageUrl, watermarkText) => {
  return new Promise((resolve, reject) => {
    if (!watermarkText) {
      // No watermark text, return original image
      resolve(imageUrl)
      return
    }

    console.log('Adding watermark:', watermarkText, 'to image:', imageUrl)

    const img = new Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height

        // Draw original image
        ctx.drawImage(img, 0, 0)

        // Configure watermark style - dynamic font size based on image width
        const fontSize = Math.max(48, Math.floor(img.width / 30))
        ctx.font = `${fontSize}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.7)'  // Light gray with 50% opacity
        ctx.textAlign = 'right'
        ctx.textBaseline = 'bottom'

        // Add watermark to bottom-right corner
        const padding = Math.max(20, Math.floor(img.width / 100))
        ctx.fillText(watermarkText, img.width - padding, img.height - padding)

        console.log('Watermark added successfully')

        // Convert canvas to data URL
        const watermarkedDataUrl = canvas.toDataURL('image/png')
        resolve(watermarkedDataUrl)
      } catch (err) {
        console.error('Canvas error:', err)
        reject(err)
      }
    }

    img.onerror = () => {
      console.error('Failed to load image')
      reject(new Error('Failed to load image'))
    }

    // For base64 data URLs, directly use them; otherwise fetch
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl
    } else {
      // For regular URLs, fetch and convert to data URL to avoid CORS
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onloadend = () => {
            img.src = reader.result
          }
          reader.onerror = () => {
            reject(new Error('Failed to read blob'))
          }
          reader.readAsDataURL(blob)
        })
        .catch(err => {
          console.error('Fetch error:', err)
          reject(err)
        })
    }
  })
}

const downloadImage = async (url, index) => {
  try {
    // ElMessage.info('正在处理图片...')

    // Add watermark if watermarkText is provided
    let finalUrl = url
    if (props.watermarkText) {
      finalUrl = await addWatermarkToImage(url, props.watermarkText)
    }

    // Download the image using data URL
    const link = document.createElement('a')
    link.href = finalUrl
    link.download = `generated-image-${index + 1}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('图片下载成功')
  } catch (err) {
    console.error('Failed to download image:', err)
    ElMessage.error('下载失败，请尝试右键保存图片')
  }
}

/**
 * Calculate aspect ratio from size string (e.g., "4096x4096" -> "1 / 1")
 */
const getAspectRatio = (size) => {
  if (!size) return '16 / 9' // Default aspect ratio

  const match = size.match(/(\d+)x(\d+)/)
  if (!match) return '16 / 9'

  const [, width, height] = match
  return `${width} / ${height}`
}
</script>

<style scoped>
.result-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--c-text);
}

.status-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-button);
  font-size: var(--font-size-xs);
  font-weight: 500;
  min-width: 64px;
  text-align: center;
}

.status-preparing,
.status-requesting {
  background-color: rgba(59, 130, 246, 0.15);
  color: var(--c-info);
}

.status-streaming {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--c-warning);
}

.status-completed {
  background-color: rgba(22, 163, 74, 0.15);
  color: var(--c-success);
}

.status-failed {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--c-error);
}

.error-box {
  padding: var(--space-md);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--c-error);
  border-radius: var(--radius-container);
}

.error-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--c-error);
  margin-bottom: var(--space-xs);
}

.error-details {
  font-size: var(--font-size-xs);
  color: var(--c-error);
  line-height: var(--line-height);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px var(--space-3xl) var(--space-3xl);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--font-size-md);
  color: var(--c-text);
  margin-bottom: var(--space-xs);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--c-text-2);
}

.loading-spinner {
  width: 40px;
  height: 20px;
  --c: no-repeat radial-gradient(farthest-side, var(--c-primary) 93%, #0000);
  background:
    var(--c) 0    0,
    var(--c) 50%  0,
    var(--c) 100% 0;
  background-size: 8px 8px;
  position: relative;
  animation: l4-0 1s linear infinite alternate;
}

.loading-spinner:before {
  content: "";
  position: absolute;
  width: 8px;
  height: 12px;
  background: var(--c-primary);
  left: 0;
  top: 0;
  animation:
    l4-1 1s  linear infinite alternate,
    l4-2 0.5s cubic-bezier(0, 200, 0.8, 200) infinite;
}

@keyframes l4-0 {
  0%      { background-position: 0  100%, 50% 0,    100% 0 }
  8%, 42% { background-position: 0  0,    50% 0,    100% 0 }
  50%     { background-position: 0  0,    50% 100%, 100% 0 }
  58%, 92%{ background-position: 0  0,    50% 0,    100% 0 }
  100%    { background-position: 0  0,    50% 0,    100% 100% }
}

@keyframes l4-1 {
  100% { left: calc(100% - 8px) }
}

@keyframes l4-2 {
  100% { top: -0.1px }
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 10fr));
  gap: var(--space-lg);
}

.result-item {
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  overflow: hidden;
  box-shadow: var(--shadow-low);
  transition: all var(--motion-base) var(--easing);
}

.result-item:hover {
  box-shadow: var(--shadow-mid);
}

.result-loading,
.result-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.loading-text-small {
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.error-icon {
  font-size: var(--font-size-2xl);
}

.error-text-small {
  font-size: var(--font-size-xs);
  color: var(--c-error);
  padding: 0 var(--space-md);
  text-align: center;
}

.result-success {
  position: relative;
  width: 100%;
  height: 100%;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.4));
  opacity: 0;
  transition: opacity var(--motion-base) var(--easing);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-sm);
}

.result-success:hover .result-overlay {
  opacity: 1;
}

.result-actions {
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
}

.result-actions :deep(.el-button) {
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  width: 28px;
  height: 28px;
  font-size: var(--font-size-xs);
}

.result-actions :deep(.el-button:hover) {
  background-color: white;
  transform: scale(1.1);
}

.result-info {
  font-size: var(--font-size-xs);
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-button);
  align-self: flex-start;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.usage-info {
  padding: var(--space-md);
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  border: 1px solid var(--c-border);
}

.usage-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-xs);
}

.usage-details {
  display: flex;
  gap: var(--space-lg);
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
}

.generation-time {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  border: 1px solid var(--c-border);
  font-size: var(--font-size-xs);
  color: var(--c-text-2);
  text-align: center;
}
</style>

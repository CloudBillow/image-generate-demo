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

    <div v-if="!resultImage && !isLoading && !error" class="empty-state">
      <div class="empty-icon">🖼️</div>
      <div class="empty-text">暂无生成结果</div>
      <div class="empty-hint">请配置参数后点击"生成图片"</div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在生成图片...</div>
      <div class="loading-time">已用时: {{ generationTime }}秒</div>
    </div>

    <div v-if="resultImage && !isLoading" class="result-container">
      <div class="result-image-wrapper">
        <img
          :src="resultImage.url"
          alt="生成的图片"
          class="result-image"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div class="result-overlay">
          <div class="result-actions">
            <el-button
              :icon="View"
              circle
              @click="openPreview"
              title="预览图片"
            />
            <el-button
              :icon="Download"
              circle
              @click="downloadImage"
              title="下载图片"
            />
            <el-button
              :icon="DocumentCopy"
              circle
              @click="copyBase64"
              title="复制Base64"
            />
          </div>
        </div>
      </div>

      <div class="result-meta">
        <div class="meta-item">
          <span class="meta-label">耗时:</span>
          <span class="meta-value">{{ generationTime }}秒</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">分辨率:</span>
          <span class="meta-value">{{ resolution }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">宽高比:</span>
          <span class="meta-value">{{ aspectRatio }}</span>
        </div>
      </div>
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
import { Download, View, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  resultImage: {
    type: Object,
    default: null
  },
  status: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  generationTime: {
    type: [Number, String],
    default: 0
  },
  resolution: {
    type: String,
    default: ''
  },
  aspectRatio: {
    type: String,
    default: ''
  }
})

// Image preview
const previewImageUrl = ref('')
const previewVisible = ref(false)

const statusText = computed(() => {
  const statusMap = {
    preparing: '准备中',
    requesting: '生成中',
    completed: '完成',
    failed: '失败'
  }
  return statusMap[props.status] || ''
})

const openPreview = () => {
  if (props.resultImage?.url) {
    previewImageUrl.value = props.resultImage.url
    previewVisible.value = true
  }
}

const closePreview = () => {
  previewVisible.value = false
  previewImageUrl.value = ''
}

const handleImageLoad = () => {
  console.log('Image loaded successfully')
}

const handleImageError = () => {
  console.error('Image failed to load')
  ElMessage.error('图片加载失败')
}

const downloadImage = () => {
  if (!props.resultImage?.url) return

  try {
    const link = document.createElement('a')
    link.href = props.resultImage.url
    link.download = `bananapro-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('Download failed:', error)
    ElMessage.error('下载失败，请尝试右键保存图片')
  }
}

const copyBase64 = async () => {
  if (!props.resultImage?.base64) return

  try {
    await navigator.clipboard.writeText(props.resultImage.base64)
    ElMessage.success('Base64已复制到剪贴板')
  } catch (error) {
    console.error('Copy failed:', error)
    ElMessage.error('复制失败，请手动复制')
  }
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px var(--space-3xl) var(--space-3xl);
  text-align: center;
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

.loading-text {
  font-size: var(--font-size-md);
  color: var(--c-text);
  margin-top: var(--space-lg);
}

.loading-time {
  font-size: var(--font-size-sm);
  color: var(--c-text-2);
  margin-top: var(--space-xs);
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.result-image-wrapper {
  position: relative;
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  overflow: hidden;
  box-shadow: var(--shadow-low);
}

.result-image {
  width: 100%;
  height: auto;
  display: block;
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
  justify-content: flex-start;
  padding: var(--space-sm);
}

.result-image-wrapper:hover .result-overlay {
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

.result-meta {
  display: flex;
  gap: var(--space-lg);
  padding: var(--space-md);
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  border: 1px solid var(--c-border);
}

.meta-item {
  display: flex;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
}

.meta-label {
  color: var(--c-text-2);
}

.meta-value {
  color: var(--c-text);
  font-weight: 500;
}
</style>

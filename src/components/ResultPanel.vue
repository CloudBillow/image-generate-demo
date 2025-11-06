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
      <div class="loading-text">正在生成图片...</div>
    </div>

    <div v-if="results.length > 0" class="results-grid">
      <div
        v-for="(result, index) in results"
        :key="index"
        class="result-item"
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
              <button
                class="action-button"
                @click="copyUrl(result.url)"
                title="复制链接"
              >
                📋
              </button>
              <button
                class="action-button"
                @click="downloadImage(result.url, index)"
                title="下载图片"
              >
                💾
              </button>
              <a
                :href="result.url"
                target="_blank"
                rel="noopener noreferrer"
                class="action-button"
                title="新窗口打开"
              >
                🔗
              </a>
            </div>
            <div v-if="result.size" class="result-info">
              {{ result.size }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="usage" class="usage-info">
      <div class="usage-title">资源消耗</div>
      <div class="usage-details">
        <span v-if="usage.prompt_tokens">提示词 Token: {{ usage.prompt_tokens }}</span>
        <span v-if="usage.completion_tokens">完成 Token: {{ usage.completion_tokens }}</span>
        <span v-if="usage.total_tokens">总计: {{ usage.total_tokens }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
  }
})

const statusText = computed(() => {
  const statusMap = {
    preparing: '准备中',
    requesting: '请求中',
    streaming: '流式接收中',
    completed: '完成',
    failed: '失败'
  }
  return statusMap[props.status] || ''
})

const handleImageLoad = (index) => {
  console.log(`Image ${index + 1} loaded successfully`)
}

const handleImageError = (index) => {
  console.error(`Image ${index + 1} failed to load`)
}

const copyUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    alert('链接已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy URL:', err)
    alert('复制失败，请手动复制')
  }
}

const downloadImage = async (url, index) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `generated-image-${index + 1}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (err) {
    console.error('Failed to download image:', err)
    alert('下载失败，请尝试右键保存图片')
  }
}
</script>

<style scoped>
.result-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--c-text);
}

.status-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-button);
  font-size: var(--font-size-xs);
  font-weight: 500;
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
  padding: var(--space-lg);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--c-error);
  border-radius: var(--radius-container);
}

.error-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--c-error);
  margin-bottom: var(--space-sm);
}

.error-details {
  font-size: var(--font-size-sm);
  color: var(--c-error);
  line-height: var(--line-height);
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4xl);
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--font-size-lg);
  color: var(--c-text);
  margin-bottom: var(--space-sm);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--c-text-2);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: var(--space-lg);
  font-size: var(--font-size-base);
  color: var(--c-text-2);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-xl);
}

.result-item {
  aspect-ratio: 1;
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
  gap: var(--space-md);
}

.loading-text-small {
  font-size: var(--font-size-sm);
  color: var(--c-text-2);
}

.error-icon {
  font-size: var(--font-size-3xl);
}

.error-text-small {
  font-size: var(--font-size-sm);
  color: var(--c-error);
  padding: 0 var(--space-lg);
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
  padding: var(--space-md);
}

.result-success:hover .result-overlay {
  opacity: 1;
}

.result-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.action-button {
  width: 36px;
  height: 36px;
  border: none;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-button);
  font-size: var(--font-size-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--motion-fast) var(--easing);
  text-decoration: none;
}

.action-button:hover {
  background-color: white;
  transform: scale(1.1);
}

.result-info {
  font-size: var(--font-size-xs);
  color: white;
  background-color: rgba(0, 0, 0, 0.6);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-button);
  align-self: flex-start;
}

.usage-info {
  padding: var(--space-lg);
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  border: 1px solid var(--c-border);
}

.usage-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-sm);
}

.usage-details {
  display: flex;
  gap: var(--space-xl);
  font-size: var(--font-size-sm);
  color: var(--c-text-2);
}
</style>

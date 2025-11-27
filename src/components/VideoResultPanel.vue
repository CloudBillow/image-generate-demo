<template>
  <div class="result-panel">
    <!-- 空状态 -->
    <div v-if="!isLoading && !videoUrl && !error" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
          <rect x="2" y="6" width="14" height="12" rx="2"></rect>
        </svg>
      </div>
      <h3>开始生成视频</h3>
      <p>配置参数后点击"生成视频"按钮</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="video-placeholder">
        <div class="loading-spinner"></div>
      </div>

      <div class="status-info">
        <div class="status-icon" :class="statusClass">
          <component :is="statusIcon" />
        </div>
        <div class="status-content">
          <div class="status-title">{{ statusTitle }}</div>
          <div class="status-message">{{ statusMessage }}</div>

          <!-- 进度条 -->
          <div v-if="progress > 0" class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div v-if="progress > 0" class="progress-text">{{ progress.toFixed(1) }}%</div>
        </div>
      </div>

      <div class="time-info">
        <span>已耗时: {{ generationTime }}s</span>
        <span class="hint">预计需要 2-4 分钟</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error && !isLoading" class="error-state">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3>生成失败</h3>
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="$emit('retry')">重试</button>
    </div>

    <!-- 成功状态 - 显示视频 -->
    <div v-if="videoUrl && !isLoading" class="video-result">
      <div class="result-header">
        <h3>生成成功</h3>
        <div class="result-actions">
          <button class="action-button" @click="downloadVideo" title="下载视频">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="video-container">
        <video
          ref="videoPlayer"
          :src="videoUrl"
          controls
          preload="metadata"
          class="video-player"
          @loadedmetadata="handleVideoLoaded"
        >
          您的浏览器不支持视频播放
        </video>
      </div>

      <div class="result-info">
        <div class="info-item">
          <span class="info-label">生成时间</span>
          <span class="info-value">{{ generationTime }}s</span>
        </div>
        <div class="info-item">
          <span class="info-label">视频时长</span>
          <span class="info-value">{{ videoDuration }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">分辨率</span>
          <span class="info-value">{{ videoResolution }}</span>
        </div>
      </div>

      <div class="warning-banner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>视频仅保存 1 天，请及时下载到本地</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, watch } from 'vue'

const props = defineProps({
  videoUrl: {
    type: String,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: ''
  },
  statusMessage: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  },
  generationTime: {
    type: Number,
    default: 0
  },
  modelInfo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['retry'])

// 视频元素引用
const videoPlayer = ref(null)
const videoDuration = ref('--')
const videoResolution = ref('--')

// 状态相关
const statusClass = computed(() => {
  switch (props.status) {
    case 'queued':
      return 'status-queued'
    case 'generating':
      return 'status-generating'
    default:
      return ''
  }
})

const statusTitle = computed(() => {
  switch (props.status) {
    case 'queued':
      return '排队中'
    case 'generating':
      return '生成中'
    default:
      return '处理中'
  }
})

const statusIcon = computed(() => {
  if (props.status === 'queued') {
    return () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('polyline', { points: '12 6 12 12 16 14' })
    ])
  }

  return () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [
    h('path', { d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5' }),
    h('rect', { x: '2', y: '6', width: '14', height: '12', rx: '2' })
  ])
})

// 视频加载完成
const handleVideoLoaded = () => {
  if (videoPlayer.value) {
    const duration = videoPlayer.value.duration
    videoDuration.value = `${Math.round(duration)}s`

    const width = videoPlayer.value.videoWidth
    const height = videoPlayer.value.videoHeight
    videoResolution.value = `${width}×${height}`
  }
}

// 下载视频
const downloadVideo = async () => {
  if (!props.videoUrl) return

  try {
    const response = await fetch(props.videoUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sora-video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    alert('下载失败，请直接在视频上右键保存')
  }
}

// 监听 videoUrl 变化，重置视频信息
watch(() => props.videoUrl, () => {
  videoDuration.value = '--'
  videoResolution.value = '--'
})
</script>

<style scoped>
.result-panel {
  background: var(--c-surface);
  border-radius: var(--radius-container);
  padding: var(--space-xl);
  box-shadow: var(--shadow-low);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--c-text-2);
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-lg);
  background: var(--c-input);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon svg {
  width: 40px;
  height: 40px;
  color: var(--c-primary);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  font-size: 14px;
  color: var(--c-text-2);
}

/* 加载状态 */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.video-placeholder {
  aspect-ratio: 16 / 9;
  background: var(--c-input);
  border-radius: var(--radius-container);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to {
    left: 100%;
  }
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--c-border);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-info {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  padding: var(--space-lg);
  background: var(--c-input);
  border-radius: var(--radius-container);
}

.status-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--c-primary);
  color: white;
}

.status-icon svg {
  width: 24px;
  height: 24px;
}

.status-icon.status-queued {
  background: #f59e0b;
}

.status-icon.status-generating {
  background: var(--c-primary);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.status-content {
  flex: 1;
  min-width: 0;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 4px;
}

.status-message {
  font-size: 14px;
  color: var(--c-text-2);
  margin-bottom: var(--space-md);
}

.progress-bar {
  height: 8px;
  background: var(--c-surface);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-sm);
}

.progress-fill {
  height: 100%;
  background: var(--c-primary);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-primary);
  text-align: right;
}

.time-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--c-text-2);
  padding: var(--space-md);
  background: var(--c-input);
  border-radius: var(--radius-container);
}

.time-info .hint {
  color: var(--c-text-2);
  opacity: 0.7;
}

/* 错误状态 */
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.error-icon {
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-lg);
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon svg {
  width: 40px;
  height: 40px;
  color: #ef4444;
}

.error-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-sm);
}

.error-message {
  font-size: 14px;
  color: #ef4444;
  margin-bottom: var(--space-lg);
  max-width: 400px;
}

.retry-button {
  padding: var(--space-sm) var(--space-xl);
  background: var(--c-primary);
  color: white;
  border: none;
  border-radius: var(--radius-button);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--motion-base) var(--easing);
}

.retry-button:hover {
  background: var(--c-primary-600);
  box-shadow: var(--shadow-low);
}

/* 视频结果 */
.video-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text);
}

.result-actions {
  display: flex;
  gap: var(--space-sm);
}

.action-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-input);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: all var(--motion-base) var(--easing);
  color: var(--c-text);
}

.action-button:hover {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: white;
  box-shadow: var(--shadow-low);
}

.action-button svg {
  width: 18px;
  height: 18px;
}

.video-container {
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-container);
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.result-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.info-item {
  padding: var(--space-md);
  background: var(--c-input);
  border-radius: var(--radius-container);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--c-text-2);
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text);
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-container);
  font-size: 14px;
  color: #f59e0b;
}

.warning-banner svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .result-info {
    grid-template-columns: 1fr;
  }
}
</style>

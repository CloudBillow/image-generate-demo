<template>
  <div class="seedance-pro-video-generation">
    <div class="page-content">
      <aside class="sidebar">
        <!-- 模式选择器 -->
        <div class="control-section">
          <h3 class="section-title">生成模式</h3>
          <div class="mode-switcher">
            <button
              v-for="mode in modes"
              :key="mode.value"
              :class="['mode-button', { active: currentMode === mode.value }]"
              @click="currentMode = mode.value"
              :aria-pressed="currentMode === mode.value"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- 参数配置 -->
        <div class="control-section">
          <h3 class="section-title">参数配置</h3>
          <SeedanceProParameterForm
            :mode="currentMode"
            :is-loading="isGenerating"
            @submit="handleGenerate"
            @cancel="handleCancel"
          />
        </div>
      </aside>

      <main class="main-content">
        <VideoResultPanel
          :video-url="videoUrl"
          :is-loading="isGenerating"
          :error="errorMessage"
          :status="status"
          :status-message="statusMessage"
          :generation-time="generationTime"
          :model-info="modelInfo"
          @retry="handleRetry"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SeedanceProParameterForm from '../components/SeedanceProParameterForm.vue'
import VideoResultPanel from '../components/VideoResultPanel.vue'
import {
  generateVideo,
  buildTextToVideoPayload,
  buildFirstFramePayload,
  buildFirstLastFramePayload,
  getErrorMessage,
  SEEDANCE_MODELS
} from '../services/seedanceProApi.js'

// 模式选项
const modes = [
  { value: 'text-to-video', label: '文生视频' },
  { value: 'first-frame', label: '首帧生视频' },
  { value: 'first-last-frame', label: '首尾帧生视频' }
]

// State
const currentMode = ref('text-to-video')
const isGenerating = ref(false)
const status = ref('')
const statusMessage = ref('')
const errorMessage = ref('')
const videoUrl = ref(null)
const abortController = ref(null)
const generationTime = ref(0)
const lastGenerateParams = ref(null)

// 模型信息
const modelInfo = computed(() => {
  const modelId = currentMode.value === 'text-to-video'
    ? SEEDANCE_MODELS.TEXT_TO_VIDEO
    : currentMode.value === 'first-frame'
    ? SEEDANCE_MODELS.FIRST_FRAME
    : SEEDANCE_MODELS.FIRST_LAST_FRAME

  return {
    id: modelId,
    name: 'Seedance 1.0 Pro',
    description: currentMode.value === 'text-to-video'
      ? '文生视频 | 根据文本描述生成视频'
      : currentMode.value === 'first-frame'
      ? '首帧生视频 | 快速版本'
      : '首尾帧生视频 | 精准控制'
  }
})

/**
 * Handle video generation request
 */
const handleGenerate = async (params) => {
  // Reset state
  isGenerating.value = true
  status.value = 'pending'
  statusMessage.value = '任务已提交，等待处理...'
  errorMessage.value = ''
  videoUrl.value = null
  generationTime.value = 0

  // Save params for retry
  lastGenerateParams.value = { ...params, mode: currentMode.value }

  // Start timing
  const startTime = Date.now()
  let timeInterval = null

  // Create abort controller for cancellation
  abortController.value = new AbortController()

  try {
    console.log('Generating video with params:', {
      mode: currentMode.value,
      ...params
    })

    // Build payload based on mode
    let payload
    if (currentMode.value === 'text-to-video') {
      payload = buildTextToVideoPayload({
        prompt: params.prompt,
        resolution: params.resolution,
        ratio: params.ratio,
        duration: params.duration,
        seed: params.seed,
        cameraFixed: params.cameraFixed
      })
    } else if (currentMode.value === 'first-frame') {
      payload = buildFirstFramePayload({
        prompt: params.prompt,
        imageUrl: params.firstFrameUrl,
        resolution: params.resolution,
        ratio: params.ratio,
        duration: params.duration,
        seed: params.seed,
        cameraFixed: params.cameraFixed
      })
    } else {
      payload = buildFirstLastFramePayload({
        prompt: params.prompt,
        firstFrameUrl: params.firstFrameUrl,
        lastFrameUrl: params.lastFrameUrl,
        resolution: params.resolution,
        ratio: params.ratio,
        duration: params.duration,
        seed: params.seed,
        cameraFixed: params.cameraFixed
      })
    }

    // Start time counter
    timeInterval = setInterval(() => {
      generationTime.value = ((Date.now() - startTime) / 1000).toFixed(0)
    }, 1000)

    // Generate video with polling
    await generateVideo({
      apiKey: params.apiKey,
      payload,
      signal: abortController.value.signal,
      onChunk: (chunk) => {
        console.log('Received chunk:', chunk)

        if (chunk.type === 'status') {
          status.value = chunk.status
          statusMessage.value = chunk.message
        } else if (chunk.type === 'progress') {
          status.value = 'running'
          statusMessage.value = chunk.message
        } else if (chunk.type === 'video') {
          videoUrl.value = chunk.data.url
          status.value = 'succeeded'
          statusMessage.value = '视频生成成功！'
          console.log('Video URL received:', chunk.data.url)
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error)
        }
      }
    })

    console.log('Video generation completed')
  } catch (error) {
    console.error('Generation error:', error)
    errorMessage.value = getErrorMessage(error)
    status.value = 'failed'
  } finally {
    // Clear time interval
    if (timeInterval) {
      clearInterval(timeInterval)
    }

    // Calculate final generation time
    const endTime = Date.now()
    generationTime.value = ((endTime - startTime) / 1000).toFixed(0)

    isGenerating.value = false
    abortController.value = null
  }
}

/**
 * Handle generation cancellation
 */
const handleCancel = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isGenerating.value = false
  status.value = ''
  statusMessage.value = ''
  console.log('Generation cancelled')
}

/**
 * Handle retry
 */
const handleRetry = () => {
  if (lastGenerateParams.value) {
    const { mode, ...params } = lastGenerateParams.value
    currentMode.value = mode
    // Wait for next tick to ensure mode is updated
    setTimeout(() => {
      handleGenerate(params)
    }, 100)
  }
}
</script>

<style scoped>
.seedance-pro-video-generation {
  min-height: 100vh;
  background-color: var(--c-bg);
}

.page-content {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: var(--space-xl);
  padding: var(--space-xl);
  max-width: 100%;
  margin: 0 auto;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  height: fit-content;
  position: sticky;
  top: var(--space-xl);
}

.control-section {
  background-color: var(--c-surface);
  border-radius: var(--radius-container);
  padding: var(--space-lg);
  box-shadow: var(--shadow-low);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-md);
}

.mode-switcher {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background-color: var(--c-surface);
  border-radius: var(--radius-button);
  box-shadow: var(--shadow-low);
}

.mode-button {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border: none;
  background-color: transparent;
  color: var(--c-text-2);
  font-size: var(--font-size-xs);
  font-weight: 500;
  border-radius: var(--radius-button);
  transition: all var(--motion-base) var(--easing);
}

.mode-button:hover {
  background-color: var(--c-input);
  color: var(--c-text);
}

.mode-button.active {
  background: var(--g-primary);
  color: white;
  box-shadow: var(--shadow-low);
}

.mode-button:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}

.main-content {
  min-height: 600px;
}

@media (max-width: 1200px) {
  .page-content {
    grid-template-columns: 1fr;
    padding: var(--space-lg);
    gap: var(--space-lg);
  }

  .sidebar {
    position: static;
    gap: var(--space-lg);
  }
}
</style>

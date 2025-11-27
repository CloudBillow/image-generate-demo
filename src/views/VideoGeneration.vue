<template>
  <div class="video-generation">
    <div class="page-content">
      <aside class="sidebar">
        <div class="control-section">
          <h3 class="section-title">生成模式</h3>
          <VideoModeSwitcher v-model="currentMode" />
        </div>

        <div class="control-section">
          <h3 class="section-title">参数配置</h3>
          <VideoParameterForm
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
          :progress="progress"
          :generation-time="generationTime"
          :model-info="modelInfo"
          @retry="handleRetry"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VideoModeSwitcher from '../components/VideoModeSwitcher.vue'
import VideoParameterForm from '../components/VideoParameterForm.vue'
import VideoResultPanel from '../components/VideoResultPanel.vue'
import {
  generateVideo,
  buildTextToVideoPayload,
  buildImageToVideoPayload,
  getErrorMessage,
  SORA_MODELS
} from '../services/soraApi.js'

// State
const currentMode = ref('text-to-video')
const isGenerating = ref(false)
const status = ref('')
const statusMessage = ref('')
const progress = ref(0)
const errorMessage = ref('')
const videoUrl = ref(null)
const abortController = ref(null)
const generationTime = ref(0)
const modelInfo = ref(null)
const lastGenerateParams = ref(null)

/**
 * Handle video generation request
 */
const handleGenerate = async ({ apiKey, prompt, model, imageUrl }) => {
  // Reset state
  isGenerating.value = true
  status.value = 'queued'
  statusMessage.value = '任务正在队列中，请耐心等待...'
  progress.value = 0
  errorMessage.value = ''
  videoUrl.value = null
  generationTime.value = 0

  // Save params for retry
  lastGenerateParams.value = { apiKey, prompt, model, imageUrl }

  // Get model info
  modelInfo.value = SORA_MODELS.find(m => m.id === model) || null

  // Start timing
  const startTime = Date.now()
  let timeInterval = null

  // Create abort controller for cancellation
  abortController.value = new AbortController()

  try {
    console.log('Generating video with params:', { prompt, model, imageUrl })

    // Build payload based on mode
    let payload
    if (currentMode.value === 'text-to-video') {
      payload = buildTextToVideoPayload({ prompt, model })
    } else {
      payload = buildImageToVideoPayload({ prompt, imageUrl, model })
    }

    // Start time counter
    timeInterval = setInterval(() => {
      generationTime.value = ((Date.now() - startTime) / 1000).toFixed(0)
    }, 1000)

    // Generate video with streaming
    await generateVideo({
      apiKey,
      payload,
      signal: abortController.value.signal,
      onChunk: (chunk) => {
        console.log('Received chunk:', chunk)

        if (chunk.type === 'status') {
          status.value = chunk.status
          statusMessage.value = chunk.message
        } else if (chunk.type === 'progress') {
          status.value = 'generating'
          progress.value = chunk.progress
          statusMessage.value = chunk.message
        } else if (chunk.type === 'video') {
          videoUrl.value = chunk.data.url
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
    handleGenerate(lastGenerateParams.value)
  }
}
</script>

<style scoped>
.video-generation {
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

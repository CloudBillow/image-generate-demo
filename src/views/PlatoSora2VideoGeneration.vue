<template>
  <div class="video-generation">
    <div class="page-content">
      <aside class="sidebar">
        <div class="control-section">
          <h3 class="section-title">参数配置</h3>
          <PlatoSora2ParameterForm
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
import PlatoSora2ParameterForm from '../components/PlatoSora2ParameterForm.vue'
import VideoResultPanel from '../components/VideoResultPanel.vue'
import {
  generateVideo,
  buildImageToVideoPayload,
  getErrorMessage,
  PLATO_SORA2_MODELS
} from '../services/platoSora2Api.js'

// State
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
const handleGenerate = async ({
  apiKey,
  prompt,
  model,
  images,
  aspectRatio,
  hd,
  duration
}) => {
  // Reset state
  isGenerating.value = true
  status.value = 'queued'
  statusMessage.value = '任务正在队列中，请耐心等待...'
  progress.value = 0
  errorMessage.value = ''
  videoUrl.value = null
  generationTime.value = 0

  // Save params for retry
  lastGenerateParams.value = {
    apiKey,
    prompt,
    model,
    images,
    aspectRatio,
    hd,
    duration
  }

  // Get model info
  modelInfo.value = PLATO_SORA2_MODELS.find(m => m.id === model) || null

  // Start timing
  const startTime = Date.now()
  let timeInterval = null

  // Create abort controller for cancellation
  abortController.value = new AbortController()

  try {
    console.log('Generating video with params:', {
      prompt,
      model,
      images,
      aspectRatio,
      hd,
      duration
    })

    // Build payload
    const payload = buildImageToVideoPayload({
      prompt,
      model,
      images,
      aspectRatio,
      hd,
      duration
    })

    // Start time counter
    timeInterval = setInterval(() => {
      generationTime.value = ((Date.now() - startTime) / 1000).toFixed(0)
    }, 1000)

    // Generate video with status updates
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
          status.value = 'completed'
          statusMessage.value = '视频生成完成'
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

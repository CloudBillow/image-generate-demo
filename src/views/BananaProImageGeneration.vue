<template>
  <div class="image-generation">
    <div class="page-content">
      <aside class="sidebar">
        <div class="control-section">
          <h3 class="section-title">生成模式</h3>
          <BananaProModeSwitcher v-model="currentMode" />
        </div>

        <div class="control-section">
          <h3 class="section-title">参数配置</h3>
          <BananaProParameterForm
            :mode="currentMode"
            :is-loading="isGenerating"
            @submit="handleGenerate"
            @cancel="handleCancel"
          />
        </div>
      </aside>

      <main class="main-content">
        <BananaProResultPanel
          :result-image="resultImage"
          :status="status"
          :error="errorMessage"
          :is-loading="isGenerating"
          :generation-time="generationTime"
          :resolution="currentResolution"
          :aspect-ratio="currentAspectRatio"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BananaProModeSwitcher from '../components/BananaProModeSwitcher.vue'
import BananaProParameterForm from '../components/BananaProParameterForm.vue'
import BananaProResultPanel from '../components/BananaProResultPanel.vue'
import {
  textToImage,
  imageToImage,
  getErrorMessage
} from '../services/bananaProApi.js'

// State
const currentMode = ref('text-to-image')
const isGenerating = ref(false)
const status = ref('')
const errorMessage = ref('')
const resultImage = ref(null)
const abortController = ref(null)
const generationTime = ref(0)
const timerInterval = ref(null)
const currentResolution = ref('')
const currentAspectRatio = ref('')

/**
 * Start timer
 */
const startTimer = () => {
  generationTime.value = 0
  timerInterval.value = setInterval(() => {
    generationTime.value++
  }, 1000)
}

/**
 * Stop timer
 */
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

/**
 * Handle image generation request
 */
const handleGenerate = async (formData) => {
  // Reset state
  isGenerating.value = true
  status.value = 'preparing'
  errorMessage.value = ''
  resultImage.value = null
  currentResolution.value = formData.resolution
  currentAspectRatio.value = formData.aspectRatio

  // Start timing
  startTimer()

  // Create abort controller for cancellation
  abortController.value = new AbortController()

  try {
    console.log('Generating image with data:', formData)

    status.value = 'requesting'

    let result

    if (formData.mode === 'text-to-image') {
      // Text to image
      result = await textToImage({
        apiKey: formData.apiKey,
        prompt: formData.prompt,
        aspectRatio: formData.aspectRatio,
        resolution: formData.resolution,
        signal: abortController.value.signal
      })
    } else {
      // Image to image
      // ImageUpload组件返回的是dataURL数组
      const images = formData.images

      // 从dataURL中提取base64和mimeType
      const extractDataFromDataURL = (dataURL) => {
        // dataURL格式: data:image/jpeg;base64,xxxxx
        const matches = dataURL.match(/^data:(.+?);base64,(.+)$/)
        if (matches) {
          return {
            mimeType: matches[1],
            base64: matches[2]
          }
        }
        throw new Error('Invalid dataURL format')
      }

      if (images.length === 1) {
        // Single image
        const imageData = extractDataFromDataURL(images[0])

        result = await imageToImage({
          apiKey: formData.apiKey,
          prompt: formData.prompt,
          imageBase64: imageData.base64,
          mimeType: imageData.mimeType,
          aspectRatio: formData.aspectRatio,
          resolution: formData.resolution,
          signal: abortController.value.signal
        })
      } else {
        // Multiple images
        const imageDataArray = images.map(dataURL => extractDataFromDataURL(dataURL))
        const base64Array = imageDataArray.map(data => data.base64)
        const mimeTypeArray = imageDataArray.map(data => data.mimeType)

        result = await imageToImage({
          apiKey: formData.apiKey,
          prompt: formData.prompt,
          imageBase64: base64Array,
          mimeType: mimeTypeArray,
          aspectRatio: formData.aspectRatio,
          resolution: formData.resolution,
          signal: abortController.value.signal
        })
      }
    }

    console.log('Received result:', result)

    if (result.success) {
      resultImage.value = {
        url: result.imageUrl,
        base64: result.imageBase64
      }
      status.value = 'completed'
    } else {
      throw new Error('Generation failed')
    }
  } catch (error) {
    console.error('Generation error:', error)
    errorMessage.value = getErrorMessage(error)
    status.value = 'failed'
  } finally {
    stopTimer()
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
  stopTimer()
  isGenerating.value = false
  status.value = ''
  console.log('Generation cancelled')
}
</script>

<style scoped>
.image-generation {
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

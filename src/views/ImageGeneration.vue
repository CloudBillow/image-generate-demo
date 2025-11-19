<template>
  <div class="image-generation">
    <div class="page-content">
      <aside class="sidebar">
        <div class="control-section">
          <h3 class="section-title">生成模式</h3>
          <ModeSwitcher v-model="currentMode" />
        </div>

        <div class="control-section">
          <h3 class="section-title">参数配置</h3>
          <ParameterForm
            :mode="currentMode"
            :is-loading="isGenerating"
            @submit="handleGenerate"
            @cancel="handleCancel"
          />
        </div>
      </aside>

      <main class="main-content">
        <ResultPanel
          :results="results"
          :status="status"
          :error="errorMessage"
          :usage="usage"
          :is-loading="isGenerating"
          :watermark-text="watermarkText"
          :generation-time="generationTime"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ModeSwitcher from '../components/ModeSwitcher.vue'
import ParameterForm from '../components/ParameterForm.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { generateImages, getErrorMessage } from '../services/seedreamApi.js'

// State
const currentMode = ref('text-to-image')
const isGenerating = ref(false)
const status = ref('')
const errorMessage = ref('')
const results = ref([])
const usage = ref(null)
const abortController = ref(null)
const watermarkText = ref('')
const generationTime = ref(0)

/**
 * Handle image generation request
 */
const handleGenerate = async ({ apiKey, payload, watermarkText: wmText }) => {
  // Reset state
  isGenerating.value = true
  status.value = 'preparing'
  errorMessage.value = ''
  results.value = []
  usage.value = null
  watermarkText.value = wmText || ''
  generationTime.value = 0

  // Start timing
  const startTime = Date.now()

  // Create abort controller for cancellation
  abortController.value = new AbortController()

  try {
    console.log('Generating images with payload:', payload)

    if (payload.stream) {
      // Streaming mode
      status.value = 'streaming'

      // Initialize result placeholders for expected images
      const expectedCount = payload.sequential_image_generation_options?.max_images || 1
      results.value = Array.from({ length: expectedCount }, () => ({
        loading: true
      }))

      let imageIndex = 0

      await generateImages({
        apiKey,
        payload,
        signal: abortController.value.signal,
        onChunk: (chunk) => {
          console.log('Received chunk:', chunk)

          if (chunk.type === 'image') {
            // Replace placeholder with actual image using splice for reactivity
            // Convert base64 to data URL if b64_json is provided
            const imageUrl = chunk.data.b64_json
              ? `data:image/jpeg;base64,${chunk.data.b64_json}`
              : chunk.data.url

            const newImage = {
              url: imageUrl,
              b64_json: chunk.data.b64_json,
              size: chunk.data.size,
              revised_prompt: chunk.data.revised_prompt,
              image_index: chunk.data.image_index ?? imageIndex,
              loading: false,
              error: null
            }

            // Use splice to replace item and trigger reactivity
            if (imageIndex < results.value.length) {
              results.value.splice(imageIndex, 1, newImage)
            } else {
              // Add extra image if more than expected
              results.value.push(newImage)
            }
            imageIndex++

            console.log(`Image ${imageIndex} added to results, total: ${results.value.length}`)
          } else if (chunk.type === 'error') {
            // Replace placeholder with error
            const errorResult = {
              loading: false,
              error: chunk.error,
              image_index: imageIndex
            }

            if (imageIndex < results.value.length) {
              results.value.splice(imageIndex, 1, errorResult)
            } else {
              results.value.push(errorResult)
            }
            imageIndex++
          } else if (chunk.type === 'usage') {
            usage.value = chunk.data
            console.log('Usage info received:', chunk.data)
          }
        }
      })

      // Remove any remaining loading placeholders
      results.value = results.value.filter(r => !r.loading)

      status.value = 'completed'
      console.log('Streaming completed, total images:', results.value.length)
    } else {
      // Non-streaming mode
      status.value = 'requesting'

      const response = await generateImages({
        apiKey,
        payload,
        signal: abortController.value.signal
      })

      console.log('Received response:', response)

      if (response.success) {
        results.value = response.data.map(item => {
          // Convert base64 to data URL if b64_json is provided
          const imageUrl = item.b64_json
            ? `data:image/jpeg;base64,${item.b64_json}`
            : item.url

          return {
            url: imageUrl,
            b64_json: item.b64_json,
            size: item.size,
            revised_prompt: item.revised_prompt,
            loading: false,
            error: null
          }
        })

        usage.value = response.usage
        status.value = 'completed'
      } else {
        throw new Error('Generation failed')
      }
    }
  } catch (error) {
    console.error('Generation error:', error)
    errorMessage.value = getErrorMessage(error)
    status.value = 'failed'

    // Clear loading placeholders on error
    results.value = results.value.filter(r => !r.loading)
  } finally {
    // Calculate generation time
    const endTime = Date.now()
    generationTime.value = ((endTime - startTime) / 1000).toFixed(2)

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
  max-width: 1800px;
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

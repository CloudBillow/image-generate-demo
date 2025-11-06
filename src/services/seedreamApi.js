/**
 * Seedream 4.0 API Service
 * Handles image generation requests with streaming support
 */

// Use local proxy to avoid CORS issues
const API_ENDPOINT = 'http://localhost:3001/api/images/generations'

/**
 * Generate images using Seedream 4.0
 * @param {Object} options - Request options
 * @param {string} options.apiKey - ARK API Key
 * @param {Object} options.payload - Request payload
 * @param {Function} options.onChunk - Callback for streaming chunks (optional)
 * @param {AbortSignal} options.signal - Abort signal for cancellation (optional)
 * @returns {Promise<Object>} Response data
 */
export async function generateImages({ apiKey, payload, onChunk, signal }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    // Handle streaming response
    if (payload.stream) {
      return await handleStreamingResponse(response, onChunk)
    }

    // Handle non-streaming response
    const data = await response.json()
    return {
      success: true,
      data: data.data || [],
      usage: data.usage
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * Handle streaming SSE response
 * @param {Response} response - Fetch response object
 * @param {Function} onChunk - Callback for each chunk
 * @returns {Promise<Object>} Complete response data
 */
async function handleStreamingResponse(response, onChunk) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''
  let allImages = []
  let usage = null

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete events in buffer
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim()

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        // Parse data events
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim()

          // Check for [DONE] marker
          if (dataStr === '[DONE]') {
            continue
          }

          try {
            const eventData = JSON.parse(dataStr)

            // Handle error in stream
            if (eventData.error) {
              if (onChunk) {
                onChunk({
                  type: 'error',
                  error: eventData.error.message || 'Unknown error',
                  code: eventData.error.code
                })
              }
              continue
            }

            // Handle successful image data
            if (eventData.data && Array.isArray(eventData.data)) {
              const images = eventData.data.map(item => ({
                url: item.url,
                size: item.size || null,
                revised_prompt: item.revised_prompt || null
              }))

              allImages.push(...images)

              if (onChunk) {
                images.forEach(image => {
                  onChunk({
                    type: 'image',
                    data: image
                  })
                })
              }
            }

            // Handle usage info
            if (eventData.usage) {
              usage = eventData.usage
              if (onChunk) {
                onChunk({
                  type: 'usage',
                  data: eventData.usage
                })
              }
            }
          } catch (parseError) {
            console.error('Failed to parse event data:', parseError, dataStr)
          }
        }
      }
    }

    return {
      success: true,
      data: allImages,
      usage
    }
  } catch (error) {
    console.error('Streaming error:', error)
    throw error
  } finally {
    reader.releaseLock()
  }
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the key is valid
 */
export function validateApiKey(apiKey) {
  return typeof apiKey === 'string' && apiKey.length > 0
}

/**
 * Get friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  const message = error.message || String(error)

  // Handle common HTTP errors
  if (message.includes('401')) {
    return 'API Key 无效或已过期，请检查后重试'
  }
  if (message.includes('429')) {
    return '请求过于频繁，请稍后再试'
  }
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return '服务器错误，请稍后再试'
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return '请求超时，请检查网络连接'
  }
  if (message.includes('network') || message.includes('Failed to fetch')) {
    return '网络连接失败，请检查网络设置'
  }

  return message
}

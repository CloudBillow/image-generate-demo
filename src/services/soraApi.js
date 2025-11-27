/**
 * Sora 2 视频生成 API Service
 * 支持文生视频和图生视频，实时流式输出
 */

// API 端点
const API_ENDPOINT = '/sora/v1/chat/completions'

/**
 * 生成视频
 * @param {Object} options - 请求选项
 * @param {string} options.apiKey - API Key
 * @param {Object} options.payload - 请求负载
 * @param {Function} options.onChunk - 流式数据回调函数
 * @param {AbortSignal} options.signal - 中止信号
 * @returns {Promise<Object>} 响应数据
 */
export async function generateVideo({ apiKey, payload, onChunk, signal }) {
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

    // 始终使用流式处理
    return await handleStreamingResponse(response, onChunk)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 处理流式 SSE 响应
 * @param {Response} response - Fetch 响应对象
 * @param {Function} onChunk - 每个数据块的回调
 * @returns {Promise<Object>} 完整响应数据
 */
async function handleStreamingResponse(response, onChunk) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''
  let videoUrl = null
  let currentProgress = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      // 解码数据块并添加到缓冲区
      buffer += decoder.decode(value, { stream: true })

      // 处理缓冲区中的完整事件
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留不完整的行在缓冲区

      for (const line of lines) {
        const trimmedLine = line.trim()

        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        // 解析 data: 事件
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim()

          // 检查 [DONE] 标记
          if (dataStr === '[DONE]') {
            console.log('Stream completed with [DONE] marker')
            continue
          }

          try {
            const eventData = JSON.parse(dataStr)
            console.log('Parsed SSE event:', eventData)

            // 提取内容
            if (eventData.choices && eventData.choices.length > 0) {
              const delta = eventData.choices[0].delta
              if (delta && delta.content) {
                const content = delta.content

                // 解析不同类型的消息
                if (content.includes('⌛️')) {
                  // 队列中
                  if (onChunk) {
                    onChunk({
                      type: 'status',
                      status: 'queued',
                      message: '任务正在队列中，请耐心等待...'
                    })
                  }
                } else if (content.includes('🏃') && content.includes('进度：')) {
                  // 进度更新
                  const progressMatch = content.match(/进度：([\d.]+)%/)
                  if (progressMatch) {
                    const progress = parseFloat(progressMatch[1])
                    currentProgress = progress
                    if (onChunk) {
                      onChunk({
                        type: 'progress',
                        progress: progress,
                        message: `生成中：${progress}%`
                      })
                    }
                  }
                } else if (content.includes('✅') && content.includes('视频生成成功')) {
                  // 视频生成成功
                  const urlMatch = content.match(/\[点击这里\]\((https?:\/\/[^\)]+)\)/)
                  if (urlMatch) {
                    videoUrl = urlMatch[1]
                    if (onChunk) {
                      onChunk({
                        type: 'video',
                        data: {
                          url: videoUrl
                        }
                      })
                    }
                  }
                } else if (content.includes('❌') || content.includes('错误')) {
                  // 错误消息
                  if (onChunk) {
                    onChunk({
                      type: 'error',
                      error: content,
                      code: 'GENERATION_FAILED'
                    })
                  }
                }
              }
            }
          } catch (parseError) {
            console.error('Failed to parse event data:', parseError, dataStr)
          }
        }
      }
    }

    console.log('Stream finished, video URL:', videoUrl)

    return {
      success: !!videoUrl,
      data: videoUrl ? { url: videoUrl } : null
    }
  } catch (error) {
    console.error('Streaming error:', error)
    throw error
  } finally {
    reader.releaseLock()
  }
}

/**
 * 构建文生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.model - 模型名称
 * @returns {Object} 请求负载
 */
export function buildTextToVideoPayload({ prompt, model }) {
  return {
    model: model || 'sora_video2',
    stream: true,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]
  }
}

/**
 * 构建图生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.imageUrl - 图片 URL 或 Base64
 * @param {string} params.model - 模型名称
 * @returns {Object} 请求负载
 */
export function buildImageToVideoPayload({ prompt, imageUrl, model }) {
  // 判断是 URL 还是 Base64
  const isBase64 = imageUrl.startsWith('data:')

  return {
    model: model || 'sora_video2',
    stream: true,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ]
  }
}

/**
 * 验证 API Key 格式
 * @param {string} apiKey - API Key
 * @returns {boolean} 是否有效
 */
export function validateApiKey(apiKey) {
  return typeof apiKey === 'string' && apiKey.length > 0
}

/**
 * 获取友好的错误消息
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好的错误消息
 */
export function getErrorMessage(error) {
  const message = error.message || String(error)

  // 处理常见 HTTP 错误
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
  if (message.includes('under heavy load')) {
    return '服务器负载过高，请稍后重试（此情况不会扣费）'
  }

  return message
}

/**
 * 可用的 Sora 2 模型列表
 */
export const SORA_MODELS = [
  {
    id: 'sora_video2',
    name: 'Sora 2 - 竖屏',
    description: '默认竖屏版本，704×1280，$0.15/次',
    resolution: '704×1280',
    orientation: 'portrait',
    duration: '10s',
    price: 0.15
  },
  {
    id: 'sora_video2-landscape',
    name: 'Sora 2 - 横屏',
    description: '横屏版本，1280×704，$0.15/次',
    resolution: '1280×704',
    orientation: 'landscape',
    duration: '10s',
    price: 0.15
  },
  {
    id: 'sora_video2-15s',
    name: 'Sora 2 - 竖屏15s',
    description: '竖屏15秒版本，704×1280，$0.15/次',
    resolution: '704×1280',
    orientation: 'portrait',
    duration: '15s',
    price: 0.15
  },
  {
    id: 'sora_video2-landscape-15s',
    name: 'Sora 2 - 横屏15s',
    description: '横屏15秒版本，1280×704，$0.15/次',
    resolution: '1280×704',
    orientation: 'landscape',
    duration: '15s',
    price: 0.15
  }
]

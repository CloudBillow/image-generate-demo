/**
 * 通义万相2.5 视频生成 API Service
 * 支持图生视频，使用异步轮询机制
 */

// API 端点
const SUBMIT_ENDPOINT = '/dashscope/api/v1/services/aigc/video-generation/video-synthesis'
const QUERY_ENDPOINT = '/dashscope/api/v1/tasks'

/**
 * 提交视频生成任务
 * @param {Object} options - 请求选项
 * @param {string} options.apiKey - API Key
 * @param {Object} options.payload - 请求负载
 * @param {AbortSignal} options.signal - 中止信号
 * @returns {Promise<Object>} 任务信息 { task_id, task_status }
 */
async function submitVideoTask({ apiKey, payload, signal }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-DashScope-Async': 'enable'
  }

  try {
    const response = await fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const data = await response.json()

    if (!data.output || !data.output.task_id) {
      throw new Error('任务提交失败：未返回任务ID')
    }

    return {
      task_id: data.output.task_id,
      task_status: data.output.task_status
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 查询任务状态
 * @param {Object} options - 请求选项
 * @param {string} options.apiKey - API Key
 * @param {string} options.taskId - 任务ID
 * @param {AbortSignal} options.signal - 中止信号
 * @returns {Promise<Object>} 任务状态信息
 */
async function queryTaskStatus({ apiKey, taskId, signal }) {
  const headers = {
    'Authorization': `Bearer ${apiKey}`
  }

  try {
    const response = await fetch(`${QUERY_ENDPOINT}/${taskId}`, {
      method: 'GET',
      headers,
      signal
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const data = await response.json()

    return {
      task_id: data.output.task_id,
      task_status: data.output.task_status,
      video_url: data.output.video_url,
      message: data.message,
      code: data.code,
      submit_time: data.output.submit_time,
      end_time: data.output.end_time
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 生成视频（主函数）
 * @param {Object} options - 请求选项
 * @param {string} options.apiKey - API Key
 * @param {Object} options.payload - 请求负载
 * @param {Function} options.onChunk - 流式数据回调函数
 * @param {AbortSignal} options.signal - 中止信号
 * @returns {Promise<Object>} 响应数据
 */
export async function generateVideo({ apiKey, payload, onChunk, signal }) {
  try {
    // Step 1: 提交任务
    const { task_id } = await submitVideoTask({ apiKey, payload, signal })

    console.log('Task submitted, task_id:', task_id)

    if (onChunk) {
      onChunk({
        type: 'status',
        status: 'pending',
        message: '任务已提交，等待处理...'
      })
    }

    // Step 2: 轮询查询任务状态
    return new Promise((resolve, reject) => {
      let pollAttempts = 0
      const maxAttempts = 120 // 30 minutes max (120 * 15s)

      const pollInterval = setInterval(async () => {
        // 检查是否已取消
        if (signal?.aborted) {
          clearInterval(pollInterval)
          reject(new Error('请求已取消'))
          return
        }

        pollAttempts++

        try {
          const result = await queryTaskStatus({ apiKey, taskId: task_id, signal })

          console.log(`Poll attempt ${pollAttempts}: status = ${result.task_status}`)

          if (result.task_status === 'PENDING') {
            if (onChunk) {
              onChunk({
                type: 'status',
                status: 'pending',
                message: '任务排队中，请耐心等待...'
              })
            }
          } else if (result.task_status === 'RUNNING') {
            if (onChunk) {
              onChunk({
                type: 'progress',
                message: '视频生成中，请稍候...'
              })
            }
          } else if (result.task_status === 'SUCCEEDED') {
            clearInterval(pollInterval)
            console.log('Task succeeded, video URL:', result.video_url)

            if (onChunk) {
              onChunk({
                type: 'video',
                data: { url: result.video_url }
              })
            }

            resolve({
              success: true,
              data: { url: result.video_url }
            })
          } else if (result.task_status === 'FAILED') {
            clearInterval(pollInterval)
            const errorMsg = result.message || '视频生成失败'
            console.error('Task failed:', errorMsg)

            if (onChunk) {
              onChunk({
                type: 'error',
                error: errorMsg,
                code: result.code
              })
            }

            reject(new Error(errorMsg))
          } else if (result.task_status === 'UNKNOWN') {
            clearInterval(pollInterval)
            reject(new Error('任务不存在或已过期（超过24小时）'))
          }

          // 达到最大轮询次数
          if (pollAttempts >= maxAttempts) {
            clearInterval(pollInterval)
            reject(new Error('任务处理超时，请稍后重试'))
          }
        } catch (error) {
          clearInterval(pollInterval)
          reject(error)
        }
      }, 15000) // 每15秒轮询一次
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 构建图生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.imageUrl - 图片 URL 或 Base64
 * @param {string} params.resolution - 分辨率 (480P/720P/1080P)
 * @param {number} params.duration - 视频时长 (5/10秒)
 * @param {boolean} params.promptExtend - 是否开启prompt智能改写
 * @param {boolean} params.watermark - 是否添加水印
 * @param {boolean} params.audio - 是否自动配音
 * @returns {Object} 请求负载
 */
export function buildImageToVideoPayload({
  prompt,
  imageUrl,
  resolution = '1080P',
  duration = 5,
  promptExtend = true,
  watermark = false,
  audio = true
}) {
  return {
    model: 'wan2.5-i2v-preview',
    input: {
      prompt: prompt,
      img_url: imageUrl
    },
    parameters: {
      resolution: resolution,
      duration: duration,
      prompt_extend: promptExtend,
      watermark: watermark,
      audio: audio
    }
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
  if (message.includes('403')) {
    return '权限不足，请检查 API Key 权限'
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

/**
 * 通义万相2.5模型信息
 */
export const WANXIANG_MODEL = {
  id: 'wan2.5-i2v-preview',
  name: '通义万相2.5 Preview',
  description: '推荐 | 有声视频 | 自动配音',
  resolutions: ['480P', '720P', '1080P'],
  durations: [5, 10],
  framerate: '24fps',
  format: 'MP4 (H.264)'
}

/**
 * 分辨率选项
 */
export const RESOLUTION_OPTIONS = [
  { value: '480P', label: '480P (标清)' },
  { value: '720P', label: '720P (高清)' },
  { value: '1080P', label: '1080P (全高清)' }
]

/**
 * 视频时长选项
 */
export const DURATION_OPTIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' }
]

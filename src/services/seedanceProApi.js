/**
 * 火山引擎 Seedance 1.0 Pro 视频生成 API Service
 * 支持文生视频、首帧生视频、首尾帧生视频，使用异步轮询机制
 */

// API 端点
const SUBMIT_ENDPOINT = '/volcengine/contents/generations/tasks'
const QUERY_ENDPOINT = (taskId) => `/volcengine/contents/generations/tasks/${taskId}`

// 轮询配置
const POLL_INTERVAL = 10000 // 10秒轮询一次
const MAX_POLL_ATTEMPTS = 300 // 最多300次（50分钟）

/**
 * 提交视频生成任务
 * @param {Object} options - 请求选项
 * @param {string} options.apiKey - API Key
 * @param {Object} options.payload - 请求负载
 * @param {AbortSignal} options.signal - 中止信号
 * @returns {Promise<Object>} 任务信息 { id }
 */
async function submitVideoTask({ apiKey, payload, signal }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
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

    if (!data.id) {
      throw new Error('任务提交失败：未返回任务ID')
    }

    return {
      id: data.id
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
    const response = await fetch(QUERY_ENDPOINT(taskId), {
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
      id: data.id,
      status: data.status,
      video_url: data.content?.video_url,
      error: data.error,
      created_at: data.created_at,
      updated_at: data.updated_at
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
    const { id: taskId } = await submitVideoTask({ apiKey, payload, signal })

    console.log('Task submitted, task_id:', taskId)

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

      const pollInterval = setInterval(async () => {
        // 检查是否已取消
        if (signal?.aborted) {
          clearInterval(pollInterval)
          reject(new Error('请求已取消'))
          return
        }

        pollAttempts++

        try {
          const result = await queryTaskStatus({ apiKey, taskId, signal })

          console.log(`Poll attempt ${pollAttempts}: status = ${result.status}`)

          if (result.status === 'queued') {
            if (onChunk) {
              onChunk({
                type: 'status',
                status: 'pending',
                message: '任务排队中，请耐心等待...'
              })
            }
          } else if (result.status === 'running') {
            if (onChunk) {
              onChunk({
                type: 'progress',
                message: '视频生成中，预计需要2-4分钟...'
              })
            }
          } else if (result.status === 'succeeded') {
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
          } else if (result.status === 'failed') {
            clearInterval(pollInterval)
            const errorMsg = result.error?.message || '视频生成失败'
            console.error('Task failed:', errorMsg)

            if (onChunk) {
              onChunk({
                type: 'error',
                error: errorMsg
              })
            }

            reject(new Error(errorMsg))
          } else if (result.status === 'expired') {
            clearInterval(pollInterval)
            reject(new Error('任务超时，请重试'))
          } else if (result.status === 'cancelled') {
            clearInterval(pollInterval)
            reject(new Error('任务已取消'))
          }

          // 达到最大轮询次数
          if (pollAttempts >= MAX_POLL_ATTEMPTS) {
            clearInterval(pollInterval)
            reject(new Error('任务处理超时，请稍后重试'))
          }
        } catch (error) {
          clearInterval(pollInterval)
          reject(error)
        }
      }, POLL_INTERVAL)
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 构建提示词（附加参数标记）
 * @param {string} prompt - 原始提示词
 * @param {Object} params - 参数
 * @returns {string} 完整提示词
 */
function buildPromptWithParams(prompt, params) {
  let fullPrompt = prompt.trim()

  // 添加参数标记
  if (params.ratio) {
    fullPrompt += ` --ratio ${params.ratio}`
  }

  if (params.duration && params.duration !== 5) {
    fullPrompt += ` --dur ${params.duration}`
  }

  if (params.resolution && params.resolution !== '1080p') {
    fullPrompt += ` --rs ${params.resolution}`
  }

  if (params.seed && params.seed !== -1) {
    fullPrompt += ` --seed ${params.seed}`
  }

  if (params.cameraFixed) {
    fullPrompt += ` --cf true`
  }

  return fullPrompt
}

/**
 * 构建文生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.resolution - 分辨率
 * @param {string} params.ratio - 宽高比
 * @param {number} params.duration - 视频时长
 * @param {number} params.seed - 随机种子
 * @param {boolean} params.cameraFixed - 是否固定摄像头
 * @returns {Object} 请求负载
 */
export function buildTextToVideoPayload({
  prompt,
  resolution = '1080p',
  ratio = '16:9',
  duration = 5,
  seed = -1,
  cameraFixed = false
}) {
  const fullPrompt = buildPromptWithParams(prompt, {
    ratio,
    duration,
    resolution,
    seed,
    cameraFixed
  })

  return {
    model: SEEDANCE_MODELS.TEXT_TO_VIDEO,
    content: [
      {
        type: 'text',
        text: fullPrompt
      }
    ]
  }
}

/**
 * 构建首帧生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词（可选）
 * @param {string} params.imageUrl - 图片 URL 或 Base64
 * @param {string} params.resolution - 分辨率
 * @param {string} params.ratio - 宽高比
 * @param {number} params.duration - 视频时长
 * @param {number} params.seed - 随机种子
 * @param {boolean} params.cameraFixed - 是否固定摄像头
 * @returns {Object} 请求负载
 */
export function buildFirstFramePayload({
  prompt = '',
  imageUrl,
  resolution = '1080p',
  ratio = 'adaptive',
  duration = 5,
  seed = -1,
  cameraFixed = false
}) {
  const content = []

  // 添加提示词（如果有）
  if (prompt.trim()) {
    const fullPrompt = buildPromptWithParams(prompt, {
      ratio,
      duration,
      resolution,
      seed,
      cameraFixed
    })
    content.push({
      type: 'text',
      text: fullPrompt
    })
  }

  // 添加图片
  content.push({
    type: 'image_url',
    image_url: {
      url: imageUrl
    }
  })

  return {
    model: SEEDANCE_MODELS.FIRST_FRAME,
    content
  }
}

/**
 * 构建首尾帧生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词（可选）
 * @param {string} params.firstFrameUrl - 首帧图片 URL 或 Base64
 * @param {string} params.lastFrameUrl - 尾帧图片 URL 或 Base64
 * @param {string} params.resolution - 分辨率
 * @param {string} params.ratio - 宽高比
 * @param {number} params.duration - 视频时长
 * @param {number} params.seed - 随机种子
 * @param {boolean} params.cameraFixed - 是否固定摄像头
 * @returns {Object} 请求负载
 */
export function buildFirstLastFramePayload({
  prompt = '',
  firstFrameUrl,
  lastFrameUrl,
  resolution = '1080p',
  ratio = 'adaptive',
  duration = 5,
  seed = -1,
  cameraFixed = false
}) {
  const content = []

  // 添加提示词（如果有）
  if (prompt.trim()) {
    const fullPrompt = buildPromptWithParams(prompt, {
      ratio,
      duration,
      resolution,
      seed,
      cameraFixed
    })
    content.push({
      type: 'text',
      text: fullPrompt
    })
  }

  // 添加首帧图片
  content.push({
    type: 'image_url',
    image_url: {
      url: firstFrameUrl
    },
    role: 'first_frame'
  })

  // 添加尾帧图片
  content.push({
    type: 'image_url',
    image_url: {
      url: lastFrameUrl
    },
    role: 'last_frame'
  })

  return {
    model: SEEDANCE_MODELS.FIRST_LAST_FRAME,
    content
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
 * Seedance Pro 模型配置
 */
export const SEEDANCE_MODELS = {
  TEXT_TO_VIDEO: 'doubao-seedance-1-0-pro-250528',
  FIRST_FRAME: 'doubao-seedance-1-0-pro-fast-251015',
  FIRST_LAST_FRAME: 'doubao-seedance-1-0-pro-250528'
}

/**
 * 分辨率选项
 */
export const RESOLUTION_OPTIONS = [
  { value: '480p', label: '480P (标清)' },
  { value: '720p', label: '720P (高清)' },
  { value: '1080p', label: '1080P (全高清)' }
]

/**
 * 宽高比选项（文生视频）
 */
export const RATIO_OPTIONS_TEXT = [
  { value: '16:9', label: '16:9 (横屏)' },
  { value: '4:3', label: '4:3 (传统)' },
  { value: '1:1', label: '1:1 (方形)' },
  { value: '3:4', label: '3:4 (竖屏)' },
  { value: '9:16', label: '9:16 (手机竖屏)' },
  { value: '21:9', label: '21:9 (超宽屏)' }
]

/**
 * 宽高比选项（图生视频）
 */
export const RATIO_OPTIONS_IMAGE = [
  { value: 'adaptive', label: '自适应 (推荐)' },
  { value: '16:9', label: '16:9 (横屏)' },
  { value: '4:3', label: '4:3 (传统)' },
  { value: '1:1', label: '1:1 (方形)' },
  { value: '3:4', label: '3:4 (竖屏)' },
  { value: '9:16', label: '9:16 (手机竖屏)' },
  { value: '21:9', label: '21:9 (超宽屏)' }
]

/**
 * 视频时长选项
 */
export const DURATION_OPTIONS = [
  { value: 2, label: '2秒' },
  { value: 3, label: '3秒' },
  { value: 4, label: '4秒' },
  { value: 5, label: '5秒 (推荐)' },
  { value: 6, label: '6秒' },
  { value: 7, label: '7秒' },
  { value: 8, label: '8秒' },
  { value: 10, label: '10秒' },
  { value: 12, label: '12秒' }
]

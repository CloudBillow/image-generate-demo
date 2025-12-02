/**
 * 柏拉图 Sora2 图生视频 API Service
 * 支持图生视频，实时流式输出
 */

// API 端点
const API_ENDPOINT = '/plato/v2/videos/generations'

/**
 * 生成视频（图生视频）
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

    // 解析响应获取 task_id
    const result = await response.json()

    if (!result.task_id) {
      throw new Error('未获取到任务ID')
    }

    console.log('Task created:', result.task_id)

    // 发送任务创建成功的通知
    if (onChunk) {
      onChunk({
        type: 'status',
        status: 'queued',
        message: '任务已创建，正在队列中...',
        taskId: result.task_id
      })
    }

    // 开始轮询任务状态
    await pollTaskStatus({
      apiKey,
      taskId: result.task_id,
      onChunk,
      signal
    })

    return result
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 轮询任务状态
 * @param {Object} options - 轮询选项
 * @param {string} options.apiKey - API Key
 * @param {string} options.taskId - 任务ID
 * @param {Function} options.onChunk - 回调函数
 * @param {AbortSignal} options.signal - 中止信号
 */
async function pollTaskStatus({ apiKey, taskId, onChunk, signal }) {
  const pollInterval = 3000 // 3秒轮询一次
  const maxAttempts = 600 // 最多轮询30分钟（600次 * 3秒）

  let attempts = 0

  while (attempts < maxAttempts) {
    if (signal?.aborted) {
      throw new Error('请求已取消')
    }

    attempts++

    try {
      const statusResponse = await fetch(`${API_ENDPOINT}/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        signal
      })

      if (!statusResponse.ok) {
        throw new Error(`获取任务状态失败: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      console.log('Task status:', statusData)

      // 根据状态更新进度
      if (statusData.status === 'processing') {
        const progress = statusData.progress || 0
        if (onChunk) {
          onChunk({
            type: 'progress',
            progress: progress,
            message: `生成中：${progress}%`
          })
        }
      } else if (statusData.status === 'completed') {
        // 任务完成
        if (statusData.video_url) {
          if (onChunk) {
            onChunk({
              type: 'video',
              data: {
                url: statusData.video_url
              }
            })
          }
        }
        return // 完成轮询
      } else if (statusData.status === 'failed') {
        // 任务失败
        throw new Error(statusData.error || '视频生成失败')
      }

      // 等待一段时间后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval))

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求已取消')
      }
      console.error('Poll error:', error)
      throw error
    }
  }

  throw new Error('任务超时，请稍后重试')
}

/**
 * 构建图生视频请求负载
 * @param {Object} params - 参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.model - 模型名称
 * @param {Array<string>} params.images - 图片列表（URL 或 Base64）
 * @param {string} params.aspectRatio - 宽高比 (16:9 或 9:16)
 * @param {boolean} params.hd - 是否高清
 * @param {string} params.duration - 视频时长 (10, 15, 25)
 * @returns {Object} 请求负载
 */
export function buildImageToVideoPayload({
  prompt,
  model,
  images,
  aspectRatio = '16:9',
  hd = false,
  duration = '10'
}) {
  return {
    prompt,
    model: model || 'sora-2',
    images: Array.isArray(images) ? images : [images],
    aspect_ratio: aspectRatio,
    hd,
    duration,
    watermark: false // 不添加水印
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
  if (message.includes('审查') || message.includes('违规')) {
    return '内容未通过审查，请修改提示词或图片后重试'
  }

  return message
}

/**
 * 可用的 Sora 2 模型列表
 */
export const PLATO_SORA2_MODELS = [
  {
    id: 'sora-2',
    name: 'Sora 2',
    description: '标准版本，支持10s视频',
    supportsHD: false,
    maxDuration: '10',
    price: 0.2
  },
  {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    description: 'Pro版本，支持HD和15s/25s视频',
    supportsHD: true,
    maxDuration: '25',
    price: 0.3
  }
]

/**
 * 宽高比选项
 */
export const ASPECT_RATIOS = [
  { value: '16:9', label: '横屏 (16:9)' },
  { value: '9:16', label: '竖屏 (9:16)' }
]

/**
 * 时长选项
 */
export const DURATIONS = [
  { value: '10', label: '10秒', models: ['sora-2', 'sora-2-pro'] },
  { value: '15', label: '15秒', models: ['sora-2-pro'] },
  { value: '25', label: '25秒', models: ['sora-2-pro'] }
]

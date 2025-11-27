/**
 * 柏拉图 BananaPro (nano-banana-2-4k) API Service
 * 支持文生图和图生图功能 - OpenAI DALL-E 格式
 */

// Use Vite proxy in development, direct URL in production
const API_ENDPOINT = import.meta.env.DEV
  ? '/plato/v1/images/generations'
  : 'https://api.bltcy.ai/v1/images/generations'

/**
 * 文生图 - Text to Image
 * @param {Object} options
 * @param {string} options.apiKey - API Key
 * @param {string} options.prompt - 提示词
 * @param {string} options.aspectRatio - 宽高比 (1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9, 5:4, 4:5)
 * @param {string} options.resolution - 分辨率 (1K, 2K, 4K)
 * @param {AbortSignal} options.signal - 取消信号
 * @returns {Promise<Object>}
 */
export async function textToImage({ apiKey, prompt, aspectRatio = '1:1', resolution = '4K', signal }) {
  const payload = {
    model: 'nano-banana-2-4k',
    prompt: prompt,
    aspect_ratio: aspectRatio,
    image_size: resolution,
    response_format: 'url'
  }

  return await callPlatoApi({ apiKey, payload, signal })
}

/**
 * 图生图 - Image to Image (参考图生图)
 * @param {Object} options
 * @param {string} options.apiKey - API Key
 * @param {string} options.prompt - 编辑描述
 * @param {string|Array<string>} options.imageBase64 - Base64编码的图片或图片数组
 * @param {string|Array<string>} options.mimeType - 图片MIME类型或类型数组
 * @param {string} options.aspectRatio - 宽高比
 * @param {string} options.resolution - 分辨率
 * @param {AbortSignal} options.signal - 取消信号
 * @returns {Promise<Object>}
 */
export async function imageToImage({
  apiKey,
  prompt,
  imageBase64,
  mimeType = 'image/jpeg',
  aspectRatio = '1:1',
  resolution = '4K',
  signal
}) {
  // 构建image数组
  let imageArray = []

  if (Array.isArray(imageBase64)) {
    // 多张图片 - 转换为dataURL格式
    imageArray = imageBase64.map((base64, index) => {
      const mime = Array.isArray(mimeType) ? mimeType[index] : mimeType
      return `data:${mime};base64,${base64}`
    })
  } else {
    // 单张图片 - 转换为dataURL格式
    imageArray = [`data:${mimeType};base64,${imageBase64}`]
  }

  const payload = {
    model: 'nano-banana-2-4k',
    prompt: prompt,
    aspect_ratio: aspectRatio,
    image_size: resolution,
    response_format: 'url',
    image: imageArray
  }

  return await callPlatoApi({ apiKey, payload, signal })
}

/**
 * 调用柏拉图 API
 * @param {Object} options
 * @param {string} options.apiKey - API Key
 * @param {Object} options.payload - 请求数据
 * @param {AbortSignal} options.signal - 取消信号
 * @returns {Promise<Object>}
 */
async function callPlatoApi({ apiKey, payload, signal }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  console.log('Calling Plato API with payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal
    })

    console.log('Response status:', response.status, response.statusText)

    if (!response.ok) {
      let errorData = {}
      let errorText = ''

      try {
        errorText = await response.text()
        errorData = JSON.parse(errorText)
      } catch (e) {
        console.error('Failed to parse error response:', errorText)
      }

      console.error('API Error:', errorData)

      throw new Error(
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const responseText = await response.text()
    console.log('Response text length:', responseText.length)

    const data = JSON.parse(responseText)
    console.log('Parsed response data:', data)

    // 解析响应数据 - OpenAI DALL-E 格式
    if (!data.data || data.data.length === 0) {
      throw new Error('未找到生成的图片数据')
    }

    const imageData = data.data[0]

    // 支持url或b64_json格式
    let imageUrl, imageBase64

    if (imageData.url) {
      imageUrl = imageData.url
      // 如果需要，可以从URL获取base64
      imageBase64 = null
    } else if (imageData.b64_json) {
      imageBase64 = imageData.b64_json
      imageUrl = `data:image/png;base64,${imageBase64}`
    } else {
      throw new Error('未找到图片数据')
    }

    return {
      success: true,
      imageBase64: imageBase64,
      imageUrl: imageUrl
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('请求已取消')
    }
    throw error
  }
}

/**
 * 将文件转换为Base64
 * @param {File} file - 文件对象
 * @returns {Promise<Object>} { base64: string, mimeType: string }
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      // 移除 data URL 前缀，只保留 base64 数据
      const base64 = reader.result.split(',')[1]
      resolve({
        base64,
        mimeType: file.type || 'image/jpeg'
      })
    }

    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 验证API Key格式
 * @param {string} apiKey - API Key
 * @returns {boolean}
 */
export function validateApiKey(apiKey) {
  return typeof apiKey === 'string' && apiKey.trim().length > 0
}

/**
 * 获取友好的错误信息
 * @param {Error} error - 错误对象
 * @returns {string}
 */
export function getErrorMessage(error) {
  const message = error.message || String(error)

  // 常见HTTP错误
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

/**
 * 支持的宽高比列表
 */
export const ASPECT_RATIOS = [
  { label: '1:1 (正方形)', value: '1:1' },
  { label: '16:9 (横屏)', value: '16:9' },
  { label: '9:16 (竖屏)', value: '9:16' },
  { label: '4:3 (横屏)', value: '4:3' },
  { label: '3:4 (竖屏)', value: '3:4' },
  { label: '3:2 (横屏)', value: '3:2' },
  { label: '2:3 (竖屏)', value: '2:3' },
  { label: '21:9 (超宽)', value: '21:9' },
  { label: '5:4 (横屏)', value: '5:4' },
  { label: '4:5 (竖屏)', value: '4:5' }
]

/**
 * 支持的分辨率列表
 */
export const RESOLUTIONS = [
  { label: '1K (快速预览)', value: '1K' },
  { label: '2K (推荐)', value: '2K' },
  { label: '4K (超高清)', value: '4K' }
]

/**
 * 分辨率参考表
 */
export const RESOLUTION_REFERENCE = {
  '1:1': { '1K': '1024×1024', '2K': '2048×2048', '4K': '4096×4096' },
  '16:9': { '1K': '1376×768', '2K': '2752×1536', '4K': '5504×3072' },
  '9:16': { '1K': '768×1376', '2K': '1536×2752', '4K': '3072×5504' },
  '4:3': { '1K': '1200×896', '2K': '2400×1792', '4K': '4800×3584' },
  '3:4': { '1K': '896×1200', '2K': '1792×2400', '4K': '3584×4800' },
  '21:9': { '1K': '1584×672', '2K': '3168×1344', '4K': '6336×2688' }
}

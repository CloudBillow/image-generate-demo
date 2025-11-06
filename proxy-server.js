/**
 * Proxy server to handle CORS issues with Volces ARK API
 */
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = 3001

// Enable CORS for all origins in development
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Proxy endpoint
app.post('/api/images/generations', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '')

  if (!apiKey) {
    return res.status(401).json({
      error: {
        message: 'Missing API Key',
        code: 'missing_api_key'
      }
    })
  }

  const payload = req.body

  console.log('Proxying request to Volces ARK API...')
  console.log('Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    // Handle streaming response
    if (payload.stream) {
      console.log('Streaming response...')
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      response.body.pipe(res)

      response.body.on('end', () => {
        console.log('Stream ended')
      })

      response.body.on('error', (error) => {
        console.error('Stream error:', error)
        res.end()
      })
    } else {
      // Non-streaming response
      const data = await response.json()
      console.log('Response status:', response.status)

      if (!response.ok) {
        return res.status(response.status).json(data)
      }

      res.json(data)
    }
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({
      error: {
        message: error.message || 'Internal proxy error',
        code: 'proxy_error'
      }
    })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`)
  console.log(`📡 Forwarding requests to https://ark.cn-beijing.volces.com`)
})

import dotenv from 'dotenv'
import { logger } from '../middleware/logger.js'

dotenv.config({ override: false })

const API_KEY = process.env.MCAI_LLM_API_KEY || process.env.OPENAI_API_KEY
const BASE_URL = process.env.MCAI_LLM_BASE_URL || 'https://proxy.monkeycode-ai.com/v1'
const DEFAULT_MODEL = process.env.MCAI_LLM_MODEL || 'gpt-5.5'
const AI_REQUEST_TIMEOUT = parseInt(process.env.AI_REQUEST_TIMEOUT || '60000', 10)
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '2', 10)

const FALLBACK_API_KEY = process.env.AI_FALLBACK_API_KEY || ''
const FALLBACK_BASE_URL = process.env.AI_FALLBACK_BASE_URL || ''
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'gpt-5.5'

function buildAiError(status, message, code) {
  const error = new Error(message)
  error.status = status
  error.code = code
  error.retryable = status === 429 || status >= 500 || code === 'timeout' || code === 'network'
  return error
}

function shouldRetry(error) {
  return !!error?.retryable
}

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function createChatCompletion({
  messages,
  model = DEFAULT_MODEL,
  temperature = 0.8,
  max_tokens = 3000,
  useFallback = false
}) {
  const apiKey = useFallback ? FALLBACK_API_KEY : API_KEY
  const baseUrl = useFallback ? FALLBACK_BASE_URL : BASE_URL
  const activeModel = useFallback ? FALLBACK_MODEL : model

  if (!apiKey) {
    throw new Error('AI API key not configured')
  }

  try {
    let lastError
    for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT)

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: activeModel,
            messages,
            temperature,
            max_tokens
          }),
          signal: controller.signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw buildAiError(response.status, `AI API error: ${response.status} - ${errorText}`, `http_${response.status}`)
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
      } catch (error) {
        if (error.name === 'AbortError') {
          lastError = buildAiError(408, `AI 请求超时（${AI_REQUEST_TIMEOUT / 1000}秒），请稍后重试`, 'timeout')
        } else if (error.status || error.code) {
          lastError = error
        } else {
          lastError = buildAiError(0, error.message || 'AI 请求失败', 'network')
        }

        if (attempt < AI_MAX_RETRIES && shouldRetry(lastError)) {
          const delay = Math.min(500 * Math.pow(2, attempt), 2000)
          await sleep(delay)
          continue
        }

        throw lastError
      } finally {
        clearTimeout(timeoutId)
      }
    }

    throw lastError
  } catch (error) {
    if (!useFallback && FALLBACK_API_KEY && FALLBACK_BASE_URL && shouldRetry(error)) {
      logger.warn('ai', 'Primary AI endpoint failed, trying fallback', {
        status: error.status,
        code: error.code
      })
      return createChatCompletion({ messages, model, temperature, max_tokens, useFallback: true })
    }
    throw error
  }
}

async function generateText(prompt, { temperature = 0.8, max_tokens = 3000 } = {}) {
  return createChatCompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens
  })
}

async function generateStructured({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  max_tokens = 3000
}) {
  return createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature,
    max_tokens
  })
}

export { createChatCompletion, generateText, generateStructured, DEFAULT_MODEL }

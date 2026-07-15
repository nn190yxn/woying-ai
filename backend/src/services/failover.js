// Failover and retry mechanism for tool execution

import { logger } from '../middleware/logger.js'

// Retry with exponential backoff
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    maxDelay = 5000,
    timeout = 15000,
    onRetry = null
  } = options

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('操作超时，请稍后重试')), timeout)
      })

      // Race between the operation and timeout
      const result = await Promise.race([fn(), timeoutPromise])
      return result
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 500,
          maxDelay
        )

        logger.warn('failover', `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: error.message
        })

        if (onRetry) {
          onRetry(attempt + 1, error)
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Fallback response for tool failures
export function getFallbackResponse(toolName, toolCode) {
  return {
    summary: `${toolName}生成失败`,
    sections: [
      {
        title: '系统提示',
        items: [
          '抱歉，当前服务繁忙，未能完成生成。',
          '您可以稍后重试，或联系客服处理。',
          '如需稳定服务，建议升级会员享受优先处理通道。'
        ]
      }
    ],
    actions: [
      {
        priority: 'high',
        title: '稍后重试',
        description: '等待1-2分钟后再次尝试生成',
        owner: '用户',
        timeline: '立即'
      }
    ],
    riskNotes: [],
    benchmarks: null,
    scores: null,
    recommendedTools: [],
    customizationCTA: '\n---\n升级会员即可获得专属深度定制服务及优先处理通道。',
    extra: { isFallback: true, toolCode }
  }
}

export function isAiAvailabilityError(error) {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()

  return [message, code].some(value =>
    value.includes('api key') ||
    value.includes('apikey') ||
    value.includes('unauthorized') ||
    value.includes('401') ||
    value.includes('403') ||
    value.includes('rate limit') ||
    value.includes('timeout') ||
    value.includes('network') ||
    value.includes('fetch failed') ||
    value.includes('econn')
  )
}

export async function createRagFallbackResult(toolConfig = {}, formData = {}, error = null) {
  const toolName = toolConfig.name || toolConfig.code || '智能工具'
  const toolCode = toolConfig.code || 'unknown'
  const fallback = typeof toolConfig.fallbackBuilder === 'function'
    ? await toolConfig.fallbackBuilder(formData, error)
    : getFallbackResponse(toolName, toolCode)

  return {
    status: 'fallback',
    degraded: true,
    engineType: toolConfig.engineType || 'rag',
    toolCode,
    summary: fallback.summary || `${toolName}已生成基础版结果`,
    sections: fallback.sections || [],
    actions: fallback.actions || [],
    riskNotes: fallback.riskNotes || [],
    benchmarks: fallback.benchmarks || null,
    scores: fallback.scores || null,
    recommendedTools: fallback.recommendedTools || [],
    customizationCTA: fallback.customizationCTA || '\n---\n升级会员即可获得专属深度定制服务及优先处理通道。',
    meta: {
      ...(fallback.meta || {}),
      ...(fallback.extra || {}),
      fallbackType: isAiAvailabilityError(error) ? 'ai_unavailable' : 'rag_fallback',
      fallbackReason: error?.message || 'RAG fallback generated'
    }
  }
}

// Wrap tool execution with failover
export async function executeWithFailover(toolConfig, formData, executeFn) {
  const toolName = toolConfig.name || toolConfig.code || '未知工具'
  const toolCode = toolConfig.code || 'unknown'
  const startTime = Date.now()
  const maxRetries = toolConfig.maxRetries ?? (toolConfig.requiresStructuredResult ? 0 : 1)
  const timeout = toolConfig.executionTimeoutMs ?? (toolConfig.requiresStructuredResult ? 55000 : 20000)

  try {
    const result = await retryWithBackoff(
      () => executeFn(toolConfig, formData),
      {
        maxRetries,
        baseDelay: 500,
        timeout,
        onRetry: (attempt, error) => {
          logger.warn('failover', `Retrying ${toolCode}`, {
            attempt,
            error: error.message,
            toolCode
          })
        }
      }
    )

    const duration = Date.now() - startTime
    logger.toolSuccess(null, toolCode, duration)

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.toolFailure(null, toolCode, error, duration)

    if (typeof toolConfig.fallbackBuilder === 'function') {
      try {
        return await toolConfig.fallbackBuilder(formData, error)
      } catch (fallbackError) {
        logger.error('failover', `Fallback builder failed: ${fallbackError.message}`, { toolCode })
      }
    }

    // Return fallback response instead of throwing
    return getFallbackResponse(toolName, toolCode)
  }
}

// Timeout wrapper for any async operation
export async function withTimeout(promise, timeoutMs, fallback = null) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (fallback !== null) {
        resolve(fallback)
      } else {
        reject(new Error('操作超时'))
      }
    }, timeoutMs)

    promise.then(
      result => {
        clearTimeout(timer)
        resolve(result)
      },
      err => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

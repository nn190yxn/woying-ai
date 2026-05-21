const DOMAIN_RESULT_KEY = 'result'

const RESULT_EXTRA_RESERVED_KEYS = new Set([
  'status',
  'degraded',
  'summary',
  'sections',
  'actions',
  'recommendedTools',
  'riskNotes',
  'scores',
  'dimensionRank',
  'benchmarks',
  'customizationCTA',
  'meta',
  DOMAIN_RESULT_KEY
])

function sanitizeExtra(extra = {}) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(extra).filter(([key]) => !RESULT_EXTRA_RESERVED_KEYS.has(key))
  )
}

export function createDomainToolResult(domainResult = {}, options = {}) {
  const degraded = options.degraded === true || domainResult.degraded === true
  const status = domainResult.status === 'fallback' || degraded ? 'fallback' : 'ok'

  const domainExtra = Object.fromEntries(
    Object.entries(domainResult).filter(([key]) => !RESULT_EXTRA_RESERVED_KEYS.has(key))
  )

  return {
    ...domainExtra,
    status,
    degraded,
    summary: options.summary || domainResult.summary || domainResult.diagnosis || '',
    sections: Array.isArray(options.sections) ? options.sections : (Array.isArray(domainResult.sections) ? domainResult.sections : []),
    actions: Array.isArray(options.actions) ? options.actions : (Array.isArray(domainResult.actions) ? domainResult.actions : []),
    recommendedTools: Array.isArray(domainResult.recommendedTools) ? domainResult.recommendedTools : [],
    riskNotes: Array.isArray(options.riskNotes) ? options.riskNotes : (Array.isArray(domainResult.riskNotes) ? domainResult.riskNotes : []),
    scores: domainResult.scores || null,
    dimensionRank: domainResult.dimensionRank || null,
    benchmarks: domainResult.benchmarks || null,
    customizationCTA: options.includeCTA === false ? null : (domainResult.customizationCTA ?? options.customizationCTA ?? null),
    result: domainResult,
    meta: {
      ...(domainResult.meta || {}),
      engineType: options.engineType || domainResult.meta?.engineType || null,
      toolCode: options.toolCode || domainResult.meta?.toolCode || null,
      fallbackType: options.fallbackType || domainResult.meta?.fallbackType || null,
      ...(options.meta || {})
    }
  }
}

export function createToolResult(data = {}, options = {}) {
  const degraded = options.degraded === true || data.degraded === true
  const status = data.status === 'fallback' || degraded ? 'fallback' : 'ok'

  return {
    ...sanitizeExtra(data.extra),
    status,
    degraded,
    summary: data.summary || '',
    sections: Array.isArray(data.sections) ? data.sections : [],
    actions: Array.isArray(data.actions) ? data.actions : [],
    recommendedTools: Array.isArray(data.recommendedTools) ? data.recommendedTools : [],
    riskNotes: Array.isArray(data.riskNotes) ? data.riskNotes : [],
    scores: data.scores || null,
    dimensionRank: data.dimensionRank || null,
    benchmarks: data.benchmarks || null,
    customizationCTA: options.includeCTA === false ? null : (data.customizationCTA ?? options.customizationCTA ?? null),
    meta: {
      ...data.meta,
      engineType: options.engineType || data.meta?.engineType || null,
      toolCode: options.toolCode || data.meta?.toolCode || null,
      fallbackType: options.fallbackType || data.meta?.fallbackType || null,
      parseMode: options.parseMode || data.meta?.parseMode || null
    }
  }
}

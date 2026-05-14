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
  'meta'
])

function sanitizeExtra(extra = {}) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(extra).filter(([key]) => !RESULT_EXTRA_RESERVED_KEYS.has(key))
  )
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

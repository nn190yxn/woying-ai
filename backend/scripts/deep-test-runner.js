import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import { CALCULATORS } from '../src/services/calculatorEngine.js'
import { normalizeToolPayload } from '../src/services/toolPayloadNormalizer.js'

dotenv.config()

const token = jwt.sign({ userId: 1, memberLevel: 'annual' }, process.env.JWT_SECRET, { expiresIn: '1h' })
const base = process.env.BASE_URL || 'http://127.0.0.1:3000'
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 60000)

const tests = JSON.parse(fs.readFileSync(process.env.TEST_FILE || './scripts/test-payloads.json', 'utf8'))

const SKIP_INPUT_VALIDATION_PREFIXES = ['/api/xhs/', '/api/douyin/', '/api/private/']

function validateInputProtocol(endpoint, payload) {
  if (SKIP_INPUT_VALIDATION_PREFIXES.some(prefix => endpoint.startsWith(prefix))) return null
  if (!endpoint.startsWith('/api/generate/')) return null

  const toolCode = endpoint.replace('/api/generate/', '')
  const calcDef = CALCULATORS[toolCode]
  if (!calcDef || !calcDef.inputs || typeof calcDef.calc !== 'function') return null

   const normalizedPayload = normalizeToolPayload(toolCode, payload)

  const missing = calcDef.inputs.filter(key => normalizedPayload[key] === undefined || normalizedPayload[key] === null)
  if (missing.length > 0) {
    return { matched: false, missingFields: missing }
  }
  return { matched: true, missingFields: [] }
}

function scoreDimension(value, criteria) {
  if (criteria.type === 'presence') return value ? 2 : 0
  if (criteria.type === 'count') {
    if (!value || value.length === 0) return 0
    return value.length >= criteria.threshold ? 2 : 1
  }
  if (criteria.type === 'boolean') return value === true ? 2 : 0
  if (criteria.type === 'depth') {
    if (!value || value.length === 0) return 0
    const hasDeep = value.some(s => (s.items && s.items.length >= 3) || s.subsections)
    return hasDeep ? 2 : 1
  }
  return 0
}

function detectStructureCompat(data) {
  const hasUnifiedLayer = data.status && data.degraded !== undefined && data.meta
  if (!hasUnifiedLayer) return false

  const innerResult = data.result
  if (!innerResult || typeof innerResult !== 'object') return false

  const domainFields = [
    'radar',
    'radarData',
    'phases',
    'recommendedTiers',
    'totalScore',
    'diagnosis',
    'suggestions',
    'products',
    'topics',
    'script',
    'analysis',
    'upgradePath',
    'retentionCalendar',
    'implementationTimeline'
  ]
  return domainFields.some(key => innerResult[key] !== undefined)
}

function detectDomainPayloadSignals(result, innerResult) {
  const target = innerResult || result
  if (!target || typeof target !== 'object') return false

  return Boolean(
    target.radar
    || target.radarData
    || target.totalScore !== undefined
    || target.diagnosis
    || target.suggestions
    || (Array.isArray(target.phases) && target.phases.length > 0)
    || (Array.isArray(target.products) && target.products.length > 0)
    || (Array.isArray(target.topics) && target.topics.length > 0)
    || target.script
    || target.analysis
    || target.upgradePath
    || (Array.isArray(target.recommendedTiers) && target.recommendedTiers.length > 0)
    || (Array.isArray(target.retentionCalendar) && target.retentionCalendar.length > 0)
    || (Array.isArray(target.implementationTimeline) && target.implementationTimeline.length > 0)
  )
}

async function runTest(test) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  const inputValidation = validateInputProtocol(test.endpoint, test.payload)
  if (inputValidation && !inputValidation.matched) {
    return {
      code: test.code,
      http: 0,
      degraded: null,
      scores: null,
      totalScore: 0,
      status: 'INPUT_MISMATCH',
      missingFields: inputValidation.missingFields,
      inputMatched: false,
      error: `缺少必要字段: ${inputValidation.missingFields.join(', ')}`
    }
  }

  try {
    const r = await fetch(`${base}${test.endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(test.payload),
      signal: AbortSignal.timeout(timeoutMs)
    })
    const data = await r.json()
    if (!r.ok) {
      return { code: test.code, http: r.status, degraded: null, scores: null, totalScore: 0, status: 'FAIL', error: data.error || data.message || 'http error' }
    }

    const degraded = data.degraded === true || data.status === 'fallback' || data.isFallback === true
    const structureCompat = detectStructureCompat(data)

    const result = data.result || data
    const innerResult = data.result || null

    const sections = result.sections || (innerResult?.suggestions ? [{ title: '建议', items: innerResult.suggestions }] : null)
    const actions = result.actions || (innerResult?.suggestions ? innerResult.suggestions.map(s => ({ title: s })) : null)
    const riskNotes = result.riskNotes || []
    const benchmarks = result.benchmarks || result.dimensionRank || result.scores || innerResult?.radar || innerResult?.radarData || innerResult?.totalScore
    const kbEnhanced = result.meta?.kbEnhanced || result.meta?.extra?.kbEnhanced || data.meta?.kbEnhanced || false
    const cta = result.customizationCTA || result.meta?.customizationCTA || data.meta?.customizationCTA || false
    const hasDomainSignals = detectDomainPayloadSignals(result, innerResult)

    const structureDepthScore = structureCompat && innerResult
      ? 2
      : scoreDimension(sections, { type: 'depth' })

    const dimensions = {
      benchmarks: scoreDimension(benchmarks, { type: 'presence' }),
      actions: scoreDimension(actions, { type: 'count', threshold: 3 }),
      riskNotes: scoreDimension(riskNotes, { type: 'count', threshold: 2 }),
      kbEnhanced: scoreDimension(kbEnhanced, { type: 'boolean' }),
      structureDepth: structureDepthScore,
      cta: scoreDimension(cta, { type: 'presence' })
    }
    const totalScore = Object.values(dimensions).reduce((a, b) => a + b, 0)

    let status
    if (degraded) {
      status = 'DEGRADED'
    } else if (totalScore >= 8) {
      status = 'PASS'
    } else {
      status = 'FAIL'
    }

    return {
      code: test.code,
      http: r.status,
      degraded,
      structureCompat,
      engineType: data.meta?.engineType || data.engineType || data.meta?.fallbackType || 'n/a',
      summary: (data.summary || data.title || '').slice(0, 80),
      hasSections: Boolean(data.sections && data.sections.length > 0),
      sectionsCount: data.sections?.length || 0,
      hasActions: Boolean(data.actions && data.actions.length > 0),
      actionsCount: data.actions?.length || 0,
      hasRiskNotes: Boolean(data.riskNotes && data.riskNotes.length > 0),
      riskNotesCount: data.riskNotes?.length || 0,
       hasBenchmarks: Boolean(data.benchmarks || data.dimensionRank || data.scores || innerResult?.radar || innerResult?.radarData || innerResult?.totalScore || hasDomainSignals),
       kbEnhanced: data.meta?.kbEnhanced || data.meta?.extra?.kbEnhanced || false,
       kbFiles: data.meta?.kbFilesUsed || data.meta?.extra?.kbFilesUsed || [],
       hasCta: Boolean(data.customizationCTA || data.meta?.customizationCTA),
       hasDomainSignals,
       dimensions,
      totalScore,
      status,
      ...(inputValidation ? { inputMatched: inputValidation.matched } : {})
    }
  } catch (e) {
    return { code: test.code, http: 0, degraded: null, scores: null, totalScore: 0, status: 'FAIL', error: e.message }
  }
}

console.log(`baseUrl=${base} timeoutMs=${timeoutMs} tests=${tests.length}`)

const results = []
for (const test of tests) {
  const result = await runTest(test)
  results.push(result)
  const compatTag = result.structureCompat ? ' STRUCTURE_COMPAT' : ''
  const missingTag = result.missingFields ? ` missing=${result.missingFields.join(',')}` : ''
  console.log(`[${result.status}] ${result.code} http=${result.http} degraded=${result.degraded} score=${result.totalScore}${compatTag}${missingTag} engine=${result.engineType} summary=${result.summary || result.error || 'n/a'}`)
}

const passCount = results.filter(r => r.status === 'PASS').length
const failCount = results.filter(r => r.status === 'FAIL').length
const mismatchCount = results.filter(r => r.status === 'INPUT_MISMATCH').length
const degradedCount = results.filter(r => r.status === 'DEGRADED').length
const compatCount = results.filter(r => r.structureCompat).length
const scoredResults = results.filter(r => r.status !== 'INPUT_MISMATCH')
const avgScore = scoredResults.length > 0 ? scoredResults.reduce((a, r) => a + r.totalScore, 0) / scoredResults.length : 0

console.log(`\nSummary: ${passCount} PASS, ${failCount} FAIL, ${mismatchCount} INPUT_MISMATCH, ${degradedCount} DEGRADED, ${compatCount} STRUCTURE_COMPAT, avgScore=${avgScore.toFixed(1)}`)

if (failCount > 0) {
  console.log('Failed tools:')
  for (const r of results.filter(r => r.status === 'FAIL')) {
    console.log(`  ${r.code}: score=${r.totalScore} error=${r.error || 'low score'}`)
  }
}

if (mismatchCount > 0) {
  console.log('Input mismatch tools:')
  for (const r of results.filter(r => r.status === 'INPUT_MISMATCH')) {
    console.log(`  ${r.code}: missing=${r.missingFields.join(',')}`)
  }
}

import assert from 'node:assert/strict'
import test, { after } from 'node:test'

import {
  detectDomainPayloadSignals,
  detectStructureCompat,
  detectTermQuality,
  scoreDimension,
  validateInputProtocol
} from './deep-test-runner.js'

after(() => {
  setImmediate(() => process.exit(process.exitCode || 0))
})

test('validateInputProtocol reports missing calculator inputs', () => {
  const result = validateInputProtocol('/api/generate/gross-margin-restaurant', { categories: [] })

  assert.equal(result.matched, false)
  assert.deepEqual(result.missingFields, ['storeName'])
})

test('validateInputProtocol skips legacy agent routes', () => {
  const result = validateInputProtocol('/api/xhs/account-diagnosis', {})

  assert.equal(result, null)
})

test('detectStructureCompat accepts unified responses with domain result fields', () => {
  const result = detectStructureCompat({
    status: 'ok',
    degraded: false,
    meta: { engineType: 'rag' },
    result: { radarData: [{ label: '转化', value: 82 }] }
  })

  assert.equal(result, true)
})

test('detectDomainPayloadSignals accepts legacy domain payloads', () => {
  const result = detectDomainPayloadSignals(
    { endpoint: '/api/douyin/diagnosis' },
    { agent: 'douyin', status: 'ok', result: { totalScore: 86, suggestions: ['优化前3秒'] } },
    { totalScore: 86, suggestions: ['优化前3秒'] }
  )

  assert.equal(result, true)
})

test('scoreDimension distinguishes empty and complete arrays', () => {
  assert.equal(scoreDimension([], { type: 'count', threshold: 3 }), 0)
  assert.equal(scoreDimension([{ title: 'A' }], { type: 'count', threshold: 3 }), 1)
  assert.equal(scoreDimension([{ title: 'A' }, { title: 'B' }, { title: 'C' }], { type: 'count', threshold: 3 }), 2)
})

test('detectTermQuality requires configured industry terms', () => {
  const result = detectTermQuality(
    { industryTerms: ['毛利率', '翻台率', '会员复购'] },
    { summary: '毛利率和翻台率是餐饮门店的关键指标' }
  )

  assert.deepEqual(result, {
    hits: ['毛利率', '翻台率'],
    total: 3,
    passed: true
  })
})

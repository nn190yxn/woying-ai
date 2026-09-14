import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { retrieveLayeredKnowledge } from '../src/services/kbService.js'
import { runLegacyAcquisitionAdapter } from '../src/services/acquisition/legacyAdapters.js'

after(() => setTimeout(() => process.exit(0), 10))

test('分层知识检索严格过滤并限制片段和总长度', () => {
  const hit = retrieveLayeredKnowledge({ industry: '儿童素质培训', productDomain: 'acquisition', channel: 'douyin', scene: 'diagnosis', skillVersion: '1.0.0', maxSnippets: 1, maxChars: 700 })
  assert.equal(hit.meta.filtersApplied, true)
  assert.equal(hit.meta.snippetCount, 1)
  assert.ok(hit.context.length <= 730)
  const miss = retrieveLayeredKnowledge({ industry: '医美', productDomain: 'acquisition', channel: 'douyin', scene: 'diagnosis', skillVersion: '1.0.0' })
  assert.equal(miss.context, '')
})

test('旧能力适配器先校验机构项目资源归属', async () => {
  await assert.rejects(
    runLegacyAcquisitionAdapter({ organizationId: 99999, projectId: 99999, channel: 'douyin', capability: 'diagnosis', input: {} }),
    error => error.status === 404
  )
})

test('15天只作为显式可选模板，不被适配器默认注入', async () => {
  await assert.rejects(
    runLegacyAcquisitionAdapter({ organizationId: 1, projectId: 1, channel: 'unknown', capability: 'quick_plan', input: {}, templateCode: null }),
    error => error.status === 400
  )
})

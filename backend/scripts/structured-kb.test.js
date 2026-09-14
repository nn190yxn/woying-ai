import test from 'node:test'
import assert from 'node:assert/strict'
import { retrieveStructuredKnowledge, retrieveLayeredKnowledge, getKBContext } from '../src/services/kbService.js'
import { CHILD_TRAINING_KNOWLEDGE } from '../src/data/childTrainingKnowledge.js'

test('structured retrieval filters all dimensions', () => {
  const result = retrieveStructuredKnowledge({ productDomain: 'content', channel: 'xhs', scene: 'daily_acquisition', knowledgeType: 'diagnostic_rule', evidenceLevel: 'fused_rule', volatility: 'stable', status: 'canonical', skillVersion: '1.0.0', now: '2026-08-22' })
  assert.deepEqual(result.snippets.map(x => x.knowledgeId), ['xhs-six-dimensions'])
})

test('institution baseline ranks first, foreign institution is isolated, and derived chain deduplicates', () => {
  const base = { ...CHILD_TRAINING_KNOWLEDGE[0], next_review: '2099-01-01' }
  const index = [base, { ...base, knowledge_id: 'derived', derived_from: [base.knowledge_id], evidence_level: 'multi_institution_verified' }, { ...base, knowledge_id: 'org-own', canonical_topic: 'org-own', organization_id: 7, evidence_level: 'institution_baseline' }, { ...base, knowledge_id: 'org-other', canonical_topic: 'org-other', organization_id: 8, evidence_level: 'institution_baseline' }]
  const result = retrieveStructuredKnowledge({ productDomain: 'acquisition', scene: 'diagnosis', skillVersion: '1.0.0', organizationId: 7, now: '2026-08-22', maxSnippets: 10 }, index)
  assert.equal(result.snippets[0].knowledgeId, 'org-own'); assert.equal(result.snippets.some(x => x.knowledgeId === 'org-other'), false)
  assert.equal(result.snippets.filter(x => ['funnel-traffic', 'derived'].includes(x.knowledgeId)).length, 1)
})

test('conflicted, revoked, archived, expired and restricted knowledge are isolated', () => {
  const base = { ...CHILD_TRAINING_KNOWLEDGE[0], next_review: '2099-01-01' }
  const index = ['conflicted', 'revoked', 'archived', 'expired'].map((status, i) => ({ ...base, knowledge_id: `${status}-${i}`, canonical_topic: `${status}-${i}`, status })).concat([{ ...base, knowledge_id: 'restricted', canonical_topic: 'restricted', privacy_level: 'restricted' }, { ...base, knowledge_id: 'date-expired', canonical_topic: 'date-expired', next_review: '2020-01-01' }, base])
  assert.deepEqual(retrieveStructuredKnowledge({ productDomain: 'acquisition', scene: 'diagnosis', skillVersion: '1.0.0', now: '2026-08-22', maxSnippets: 20 }, index).snippets.map(x => x.knowledgeId), ['funnel-traffic'])
})

test('character budget is enforced and layered old interface uses structured index', () => {
  const result = retrieveStructuredKnowledge({ productDomain: 'content', channel: 'xhs', scene: 'daily_acquisition', skillVersion: '1.0.0', now: '2026-08-22', maxChars: 100 })
  assert.ok(result.context.length <= 130)
  assert.ok(retrieveLayeredKnowledge({ productDomain: 'content', channel: 'xhs', scene: 'daily_acquisition', skillVersion: '1.0.0' }).snippets.length > 0)
  assert.equal(typeof getKBContext('not-configured'), 'string')
})

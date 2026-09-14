import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createHash } from 'crypto'
import { buildManifest, classifyManifestPath } from './freeze-knowledge-manifest.js'
import { safeRelativePath, whitelistKnowledgeJson, validateKnowledgeObject } from '../src/services/knowledgeGovernance.js'
import { CHILD_TRAINING_KNOWLEDGE, transitionKnowledge, assertUniqueCanonicalVersion } from '../src/data/childTrainingKnowledge.js'
import { createMockQuery } from '../src/models/mockDb.js'

test('manifest is deterministic, hashes eligible files and excludes scripts/config/archive/hidden paths', async () => {
  const root = mkdtempSync(join(tmpdir(), 'kb-manifest-'))
  try {
    mkdirSync(join(root, '.tool')); writeFileSync(join(root, '.tool', 'memory.md'), 'hidden')
    writeFileSync(join(root, 'good.md'), 'evidence'); writeFileSync(join(root, 'run.py'), 'print(1)'); writeFileSync(join(root, 'config.yaml'), 'token: x'); writeFileSync(join(root, 'old.zip'), 'zip')
    const one = await buildManifest(root); const two = await buildManifest(root)
    assert.deepEqual(one, two)
    assert.equal(one.entries.find(x => x.path === 'good.md').sha256, createHash('sha256').update('evidence').digest('hex'))
    assert.deepEqual(one.entries.filter(x => x.status === 'excluded').map(x => x.reason).sort(), ['archive', 'config_or_credential', 'hidden_or_tool_directory', 'script_or_executable'].sort())
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('manifest classification includes status reason and blocks credential names', () => {
  assert.equal(classifyManifestPath('notes.md').included, true)
  assert.equal(classifyManifestPath('api-token.json').reason, 'config_or_credential')
})

test('path traversal, JSON whitelist and sensitive values are blocked', () => {
  assert.throws(() => safeRelativePath('C:\\safe', '..\\escape.md'))
  const clean = whitelistKnowledgeJson({ knowledge_id: 'x', title: '联系13800138000 test@example.com 10.0.0.1', token: 'secret-value', user_id: 'abc', unknown: 'drop' })
  assert.equal(clean.unknown, undefined); assert.equal(clean.token, undefined); assert.equal(clean.user_id, undefined)
  assert.match(clean.title, /REDACTED_PHONE/); assert.match(clean.title, /REDACTED_EMAIL/); assert.match(clean.title, /REDACTED_IP/)
})

test('canonical set covers required domains and validates high volatility/action safeguards', () => {
  CHILD_TRAINING_KNOWLEDGE.forEach(validateKnowledgeObject)
  assertUniqueCanonicalVersion(CHILD_TRAINING_KNOWLEDGE)
  assert.equal(CHILD_TRAINING_KNOWLEDGE.filter(x => x.knowledge_id.startsWith('funnel-')).length >= 6, true)
  for (const id of ['douyin-model', 'xhs-six-dimensions', 'trial-offer', 'content-action-card', 'traffic-experiment', 'traffic-prohibition', 'cross-industry-limit']) assert.ok(CHILD_TRAINING_KNOWLEDGE.some(x => x.knowledge_id === id))
  assert.throws(() => validateKnowledgeObject({ ...CHILD_TRAINING_KNOWLEDGE[0], knowledge_id: 'bad', volatility: 'high', requires_verification: false }))
})

test('lifecycle requires review and rejects illegal transitions', () => {
  assert.throws(() => transitionKnowledge({ status: 'pending_review' }, 'verified'))
  assert.equal(transitionKnowledge({ status: 'pending_review' }, 'verified', { reviewerId: 'reviewer' }).status, 'verified')
  assert.throws(() => transitionKnowledge({ status: 'revoked' }, 'canonical', { reviewerId: 'reviewer' }))
})

test('Mock DB supports all knowledge governance collections', async () => {
  const query = createMockQuery()
  for (const table of ['knowledge_evidence', 'knowledge_objects', 'knowledge_versions', 'knowledge_relations', 'knowledge_reviews']) {
    const result = await query(`INSERT INTO ${table} (knowledge_id) VALUES (?)`, [`${table}-1`])
    assert.ok(result.insertId)
    assert.equal((await query(`SELECT * FROM ${table}`, [])).length, 1)
  }
})

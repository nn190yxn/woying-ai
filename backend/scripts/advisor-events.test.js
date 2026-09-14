import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeEventPayload } from '../src/services/productEvents.js'

test('产品事件仅保留白名单标量字段', () => {
  assert.deepEqual(sanitizeEventPayload({ source: 'web', projectId: 3, phone: '13800000000', transcript: '完整转写', audioUrl: '/private/a.mp3', nested: { name: '儿童姓名' } }), { source: 'web', projectId: 3 })
})

test('产品事件文本字段限制长度', () => {
  assert.equal(sanitizeEventPayload({ source: 'x'.repeat(200) }).source.length, 128)
})

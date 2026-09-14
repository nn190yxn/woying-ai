import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { enqueueTask } from '../src/services/asyncTasks.js'

test('异步任务记录包含租约、调度和结果幂等字段', async () => {
  mockDb.async_tasks.length = 0
  mockDb._idCounters.async_tasks = 0

  const task = await enqueueTask({
    organizationId: 61,
    userId: 'task-fields-owner',
    type: 'storage.cleanup_expired',
    payload: { date: '2026-08-22' },
    idempotencyKey: 'task-fields-1'
  })

  assert.equal(task.status, 'queued')
  assert.match(task.result_idempotency_key, /^result:61:storage\.cleanup_expired:/)
  assert.equal(task.locked_by, null)
  assert.equal(task.locked_at, null)
  assert.equal(task.lease_expires_at, null)
  assert.ok(task.next_run_at instanceof Date)
})

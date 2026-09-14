import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { enqueueTask, processNextTask, registerTaskHandler } from '../src/services/asyncTasks.js'

function resetTasks() {
  mockDb.async_tasks.length = 0
  mockDb._idCounters.async_tasks = 0
}

test('多 Worker 并发领取同一队列时只执行一次', async () => {
  resetTasks()
  let executions = 0
  registerTaskHandler('claim-once', async () => {
    executions += 1
    await new Promise(resolve => setTimeout(resolve, 10))
    return { ok: true }
  })
  const task = await enqueueTask({ organizationId: 71, userId: 'worker-test', type: 'claim-once', idempotencyKey: 'claim-once-1' })
  const results = await Promise.all([processNextTask('worker-a'), processNextTask('worker-b')])
  assert.equal(executions, 1)
  assert.equal(results.filter(Boolean).length, 1)
  assert.equal(results.find(Boolean).id, task.id)
  assert.equal(mockDb.async_tasks[0].locked_by, null)
})

test('处理 Worker 崩溃后，过期租约可被另一 Worker 恢复领取', async () => {
  resetTasks()
  registerTaskHandler('lease-recovery', async () => ({ recovered: true }))
  const task = await enqueueTask({ organizationId: 72, userId: 'worker-test', type: 'lease-recovery', idempotencyKey: 'lease-recovery-1' })
  const row = mockDb.async_tasks[0]
  row.status = 'processing'
  row.locked_by = 'dead-worker'
  row.locked_at = new Date(Date.now() - 120000)
  row.lease_expires_at = new Date(Date.now() - 1000)
  row.attempts = 1
  const recovered = await processNextTask('worker-recovery')
  assert.equal(recovered.id, task.id)
  assert.equal(recovered.status, 'succeeded')
  assert.equal(recovered.locked_by, null)
  assert.equal(row.attempts, 2)
})

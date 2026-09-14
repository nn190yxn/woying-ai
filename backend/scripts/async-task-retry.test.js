import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { enqueueTask, processNextTask, registerTaskHandler } from '../src/services/asyncTasks.js'

function resetTasks() {
  mockDb.async_tasks.length = 0
  mockDb._idCounters.async_tasks = 0
}

test('可重试失败使用指数退避，达到最大尝试次数后进入最终失败', async () => {
  resetTasks()
  registerTaskHandler('backoff-task', async () => { throw Object.assign(new Error('temporary'), { code: 'TEMPORARY' }) })
  const task = await enqueueTask({ organizationId: 91, userId: 'retry-owner', type: 'backoff-task', idempotencyKey: 'backoff-1' })

  const first = await processNextTask('backoff-worker')
  assert.equal(first.status, 'failed_retryable')
  assert.equal(first.failure_category, 'transient')
  assert.ok(first.next_run_at > new Date())
  assert.equal(await processNextTask('backoff-worker-2'), null)

  mockDb.async_tasks[0].next_run_at = new Date(Date.now() - 1)
  const second = await processNextTask('backoff-worker-2')
  assert.equal(second.status, 'failed_retryable')
  assert.equal(second.attempts, 2)
  assert.ok(second.next_run_at > new Date())

  mockDb.async_tasks[0].next_run_at = new Date(Date.now() - 1)
  const third = await processNextTask('backoff-worker-3')
  assert.equal(third.id, task.id)
  assert.equal(third.status, 'failed_final')
  assert.equal(third.failure_category, 'transient')
  assert.equal(third.attempts, 3)
})

test('不可重试错误分类为 permanent 且不安排下一次运行', { concurrency: false }, async () => {
  resetTasks()
  registerTaskHandler('permanent-task', async () => { throw Object.assign(new Error('bad input'), { code: 'INVALID_INPUT', retryable: false }) })
  const task = await enqueueTask({ organizationId: 92, userId: 'retry-owner', type: 'permanent-task', idempotencyKey: 'permanent-1' })
  const failed = await processNextTask('permanent-worker')
  assert.equal(failed.id, task.id)
  assert.equal(failed.status, 'failed_final')
  assert.equal(failed.failure_category, 'permanent')
  assert.equal(failed.next_run_at.getTime() <= Date.now(), true)
})

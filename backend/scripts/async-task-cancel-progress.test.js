import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { cancelTask, enqueueTask, processNextTask, registerTaskHandler } from '../src/services/asyncTasks.js'

function resetTasks() {
  mockDb.async_tasks.length = 0
  mockDb._idCounters.async_tasks = 0
}

test('取消中的任务不会被 Worker 完成状态覆盖，并支持受控进度', { concurrency: false }, async () => {
  resetTasks()
  let contextSeen
  let progressSeen
  registerTaskHandler('cancel-race', async (_payload, _task, context) => {
    contextSeen = context
    assert.equal(await context.reportProgress(47), true)
    progressSeen = 47
    await new Promise(resolve => setTimeout(resolve, 15))
    assert.equal(await context.isCancellationRequested(), true)
    return { shouldNotSucceed: true }
  })
  const task = await enqueueTask({ organizationId: 81, userId: 'cancel-owner', type: 'cancel-race', idempotencyKey: 'cancel-race-1' })
  const taskRef = task.id
  const running = processNextTask('cancel-worker')
  while (mockDb.async_tasks[0]?.status !== 'processing') await new Promise(resolve => setTimeout(resolve, 1))
  const cancelled = await cancelTask(task.id, 81)
  assert.equal(cancelled.status, 'cancelled')
  const result = await running
  assert.equal(result.status, 'cancelled')
  assert.equal(contextSeen.cancellationToken, task.cancel_token)
})

test('进度回调限制在 0 到 99，避免处理完成前报告 100', { concurrency: false }, async () => {
  resetTasks()
  registerTaskHandler('progress-bounds', async (_payload, _task, context) => {
    assert.equal(await context.reportProgress(150), true)
    assert.equal(mockDb.async_tasks[0].progress, 99)
    return { ok: true }
  })
  const task = await enqueueTask({ organizationId: 82, userId: 'progress-owner', type: 'progress-bounds', idempotencyKey: 'progress-bounds-1' })
  const done = await processNextTask('progress-worker')
  assert.equal(done.id, task.id)
  assert.equal(done.status, 'succeeded')
  assert.equal(done.progress, 100)
})

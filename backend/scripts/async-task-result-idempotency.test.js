import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { enqueueTask, persistTaskResult, processNextTask, registerTaskHandler } from '../src/services/asyncTasks.js'

function resetTasks() {
  mockDb.async_tasks.length = 0
  mockDb._idCounters.async_tasks = 0
}

test('任务结果使用结果幂等键只写入一次', async () => {
  resetTasks()
  registerTaskHandler('result-idempotent', async (_payload, task, context) => {
    const first = await context.writeResult({ value: 'first' })
    const second = await context.writeResult({ value: 'second' })
    assert.equal(first.result, second.result)
    assert.equal(first.result_idempotency_key, task.result_idempotency_key)
    return { value: 'handler-return' }
  })
  const task = await enqueueTask({ organizationId: 101, userId: 'result-owner', type: 'result-idempotent', idempotencyKey: 'result-task-1', resultIdempotencyKey: 'business-result-1' })
  const done = await processNextTask('result-worker')
  assert.equal(done.id, task.id)
  assert.equal(done.status, 'succeeded')
  assert.equal(done.result_idempotency_key, 'business-result-1')
  assert.deepEqual(JSON.parse(done.result), { value: 'first' })
})

test('结果幂等键冲突不会覆盖已有业务结果', async () => {
  resetTasks()
  const task = await enqueueTask({ organizationId: 102, userId: 'result-owner', type: 'result-manual', idempotencyKey: 'result-task-2', resultIdempotencyKey: 'business-result-2' })
  mockDb.async_tasks[0].status = 'processing'
  mockDb.async_tasks[0].locked_by = 'result-worker'
  await persistTaskResult({ taskId: task.id, organizationId: 102, workerId: 'result-worker', result: { version: 1 }, resultIdempotencyKey: 'business-result-2' })
  await assert.rejects(() => persistTaskResult({ taskId: task.id, organizationId: 102, workerId: 'result-worker', result: { version: 2 }, resultIdempotencyKey: 'other-key' }), { code: 'TASK_RESULT_CONFLICT' })
  assert.deepEqual(JSON.parse(mockDb.async_tasks[0].result), { version: 1 })
})

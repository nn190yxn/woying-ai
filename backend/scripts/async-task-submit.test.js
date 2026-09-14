import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { enqueueTask, isTaskTypeRegistered, listRegisteredTaskTypes } from '../src/services/asyncTasks.js'
import { FILE_CLEANUP_TASK_TYPE } from '../src/services/fileCleanupTask.js'

test('异步任务提交只允许注册表中的处理器类型', async () => {
  mockDb.async_tasks.length = 0
  mockDb._idCounters.async_tasks = 0
  assert.equal(isTaskTypeRegistered(FILE_CLEANUP_TASK_TYPE), true)
  assert.equal(isTaskTypeRegistered('arbitrary.remote.command'), false)
  assert.ok(listRegisteredTaskTypes().includes(FILE_CLEANUP_TASK_TYPE))

  const task = await enqueueTask({ organizationId: 111, userId: 'submit-owner', type: FILE_CLEANUP_TASK_TYPE, payload: { organizationId: 111 }, idempotencyKey: 'submit-whitelist-1' })
  assert.equal(task.task_type, FILE_CLEANUP_TASK_TYPE)
})

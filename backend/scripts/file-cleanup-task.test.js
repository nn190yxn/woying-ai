import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { createAsset } from '../src/services/privateStorage.js'
import { enqueueFileCleanupTask } from '../src/services/fileCleanupTask.js'
import { processNextTask } from '../src/services/asyncTasks.js'

test('文件清理任务按机构幂等并由同机任务 Worker 执行', async () => {
  mockDb.file_assets.length = 0
  mockDb.async_tasks.length = 0
  mockDb._idCounters.file_assets = 0
  mockDb._idCounters.async_tasks = 0
  await createAsset({ organizationId: 21, userId: 'cleanup-owner', filename: 'old.txt', mimeType: 'text/plain', size: 3, retentionDays: -1 })
  const first = await enqueueFileCleanupTask({ organizationId: 21, userId: 'cleanup-owner', date: new Date() })
  const duplicate = await enqueueFileCleanupTask({ organizationId: 21, userId: 'cleanup-owner', date: new Date() })
  assert.equal(first.id, duplicate.id)
  const processed = await processNextTask()
  assert.equal(processed.status, 'succeeded')
  assert.equal(processed.result.includes('"cleaned":1'), true)
  assert.equal(mockDb.file_assets[0].status, 'expired')
})

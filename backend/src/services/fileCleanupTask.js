import { enqueueTask, registerTaskHandler } from './asyncTasks.js'
import { cleanupExpiredAssets } from './privateStorage.js'

export const FILE_CLEANUP_TASK_TYPE = 'storage.cleanup_expired'

registerTaskHandler(FILE_CLEANUP_TASK_TYPE, async ({ organizationId, runAt }) => {
  const result = await cleanupExpiredAssets(runAt ? new Date(runAt) : new Date(), organizationId)
  return { status: 'succeeded', ...result }
})

export function enqueueFileCleanupTask({ organizationId, userId, date = new Date() }) {
  const day = date.toISOString().slice(0, 10)
  return enqueueTask({
    organizationId,
    userId,
    type: FILE_CLEANUP_TASK_TYPE,
    payload: { organizationId, runAt: date.toISOString() },
    idempotencyKey: `storage-cleanup:${day}`,
    resourceType: 'file_assets'
  })
}

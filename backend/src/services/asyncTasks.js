import crypto from 'node:crypto'
import { query } from '../models/db.js'

const handlers = new Map()
const enqueueLocks = new Map()
const TASK_LEASE_SECONDS = 60
const MAX_TASK_ATTEMPTS = 3

export function registerTaskHandler(type, handler) {
  if (!type || typeof handler !== 'function') throw new TypeError('任务处理器类型和函数均为必填')
  handlers.set(type, handler)
}

export function isTaskTypeRegistered(type) {
  return handlers.has(String(type || ''))
}

export function listRegisteredTaskTypes() {
  return [...handlers.keys()]
}

export async function enqueueTask({ organizationId, userId, type, payload = {}, idempotencyKey, resultIdempotencyKey, resourceType, resourceId }) {
  const key = idempotencyKey || crypto.createHash('sha256').update(JSON.stringify({ organizationId, type, payload })).digest('hex')
  const lockKey = `${organizationId}:${key}`
  const previous = enqueueLocks.get(lockKey) || Promise.resolve()
  const operation = previous.catch(() => {}).then(async () => {
    const existing = await query('SELECT * FROM async_tasks WHERE organization_id = ? AND idempotency_key = ?', [organizationId, key])
    if (existing[0]) return existing[0]
    let result
    try {
      result = await query(
        `INSERT INTO async_tasks (organization_id, user_id, task_type, status, idempotency_key, result_idempotency_key, cancel_token, payload, resource_type, resource_id)
         VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)`,
        [organizationId, String(userId), type, key, resultIdempotencyKey || `result:${organizationId}:${type}:${key}`, crypto.randomUUID(), JSON.stringify(payload), resourceType || null, resourceId || null]
      )
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY' && error.code !== 'DUPLICATE_KEY') throw error
      const duplicate = await query('SELECT * FROM async_tasks WHERE organization_id = ? AND idempotency_key = ?', [organizationId, key])
      if (duplicate[0]) return duplicate[0]
      throw error
    }
    const rows = await query('SELECT * FROM async_tasks WHERE id = ?', [result.insertId])
    return rows[0]
  })
  enqueueLocks.set(lockKey, operation)
  try {
    return await operation
  } finally {
    if (enqueueLocks.get(lockKey) === operation) enqueueLocks.delete(lockKey)
  }
}

export async function getTask(taskId, organizationId) {
  const rows = await query('SELECT * FROM async_tasks WHERE id = ? AND organization_id = ?', [taskId, organizationId])
  return rows[0] || null
}

export async function listTasks(organizationId, limit = 50) {
  return query('SELECT * FROM async_tasks WHERE organization_id = ? ORDER BY created_at DESC LIMIT ?', [organizationId, Math.min(Number(limit) || 50, 100)])
}

export async function retryTask(taskId, organizationId) {
  const task = await getTask(taskId, organizationId)
  if (!task) return null
  if (task.status !== 'failed_retryable') throw Object.assign(new Error('只有可重试失败任务可以重试'), { status: 409 })
  await query(`UPDATE async_tasks SET status = 'queued', error_code = NULL, error_message = NULL, failure_category = NULL, next_run_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [taskId])
  return getTask(taskId, organizationId)
}

export async function cancelTask(taskId, organizationId) {
  const task = await getTask(taskId, organizationId)
  if (!task) return null
  if (['succeeded', 'cancelled'].includes(task.status)) throw Object.assign(new Error('当前任务不可取消'), { status: 409 })
  await query(`UPDATE async_tasks SET status = 'cancelled', cancel_requested_at = CURRENT_TIMESTAMP, locked_by = NULL, lease_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND status NOT IN ('succeeded', 'failed_final', 'needs_review', 'cancelled')`, [taskId, organizationId])
  return getTask(taskId, organizationId)
}

export async function persistTaskResult({ taskId, organizationId, workerId, result, resultIdempotencyKey }) {
  const serialized = JSON.stringify(result ?? null)
  const key = resultIdempotencyKey || `task-result:${taskId}`
  const updated = await query(`UPDATE async_tasks SET result = ?, result_idempotency_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND status = 'processing' AND locked_by = ? AND (result_idempotency_key IS NULL OR result_idempotency_key = ?)`, [serialized, key, taskId, organizationId, workerId, key])
  if (!updated?.affectedRows) {
    const current = await getTask(taskId, organizationId)
    if (current?.result_idempotency_key === key && current.result != null) return current
    throw Object.assign(new Error('任务结果幂等键冲突或任务已失去锁定'), { code: 'TASK_RESULT_CONFLICT', status: 409, retryable: false })
  }
  return getTask(taskId, organizationId)
}

async function claimNextTask(workerId) {
  const result = await query(
    `UPDATE async_tasks
     SET status = 'processing', locked_by = ?, locked_at = CURRENT_TIMESTAMP,
         lease_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND),
         attempts = attempts + 1, started_at = COALESCE(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
     WHERE id = (
       SELECT id FROM (
         SELECT id FROM async_tasks
         WHERE (status IN ('queued', 'failed_retryable') AND (next_run_at IS NULL OR next_run_at <= CURRENT_TIMESTAMP))
            OR (status = 'processing' AND lease_expires_at IS NOT NULL AND lease_expires_at <= CURRENT_TIMESTAMP)
         ORDER BY created_at ASC LIMIT 1
       ) AS claimable
     )`,
    [workerId, TASK_LEASE_SECONDS]
  )
  if (!result?.affectedRows) return null
  const rows = await query('SELECT * FROM async_tasks WHERE locked_by = ? AND status = \'processing\' ORDER BY locked_at DESC LIMIT 1', [workerId])
  return rows[0] || null
}

export async function processNextTask(workerId = `worker-${process.pid}-${crypto.randomUUID()}`) {
  const task = await claimNextTask(workerId)
  if (!task) return null
  try {
    const handler = handlers.get(task.task_type)
    if (!handler) throw Object.assign(new Error(`未注册任务处理器: ${task.task_type}`), { retryable: false, code: 'HANDLER_NOT_FOUND' })
    const context = {
      cancellationToken: task.cancel_token || null,
      isCancellationRequested: async () => {
        const current = await getTask(task.id, task.organization_id)
        return !current || current.status === 'cancelled' || Boolean(current.cancel_requested_at)
      },
      writeResult: (result, resultIdempotencyKey = task.result_idempotency_key) => persistTaskResult({ taskId: task.id, organizationId: task.organization_id, workerId, result, resultIdempotencyKey }),
      reportProgress: async (value) => {
        const progress = Math.max(0, Math.min(99, Math.round(Number(value) || 0)))
        const updated = await query(`UPDATE async_tasks SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND status = 'processing' AND locked_by = ?`, [progress, task.id, task.organization_id, workerId])
        return Boolean(updated?.affectedRows)
      }
    }
    const result = await handler(JSON.parse(task.payload || '{}'), task, context)
    await persistTaskResult({ taskId: task.id, organizationId: task.organization_id, workerId, result, resultIdempotencyKey: task.result_idempotency_key })
    const finalStatus = result?.status === 'needs_review' ? 'needs_review' : 'succeeded'
    await query(`UPDATE async_tasks SET status = ?, result = COALESCE(result, ?), progress = 100, finished_at = CURRENT_TIMESTAMP, locked_by = NULL, lease_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND locked_by = ? AND status = 'processing'`, [finalStatus, JSON.stringify(result ?? null), task.id, workerId])
  } catch (error) {
    const retryable = error.retryable !== false && Number(task.attempts || 0) < MAX_TASK_ATTEMPTS
    const delaySeconds = retryable ? 2 ** Math.max(0, Number(task.attempts || 1) - 1) : 0
    const failureCategory = error.retryable === false ? 'permanent' : 'transient'
    await query(`UPDATE async_tasks SET status = ?, error_code = ?, error_message = ?, failure_category = ?, next_run_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? SECOND), finished_at = CURRENT_TIMESTAMP, locked_by = NULL, lease_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND locked_by = ? AND status = 'processing'`, [retryable ? 'failed_retryable' : 'failed_final', error.code || 'TASK_FAILED', error.message, failureCategory, delaySeconds, task.id, workerId])
  }
  return getTask(task.id, task.organization_id)
}

export function startTaskWorker(intervalMs = 1000) {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_TASK_WORKER === 'true') return () => {}
  const timer = setInterval(() => processNextTask().catch(() => {}), intervalMs)
  timer.unref?.()
  return () => clearInterval(timer)
}

import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { cancelTask, enqueueTask, getTask, isTaskTypeRegistered, listTasks, retryTask } from '../services/asyncTasks.js'
import { requireOrganizationPermission } from '../services/organization.js'

const router = express.Router()
router.use(authMiddleware)

router.post('/', requireOrganizationPermission('tasks:manage'), async (req, res, next) => {
  try {
    const { type, payload = {}, idempotencyKey, resultIdempotencyKey, resourceType, resourceId } = req.body || {}
    if (!isTaskTypeRegistered(type)) return res.status(400).json({ message: '任务类型不在允许的处理器白名单中' })
    const task = await enqueueTask({ organizationId: req.organizationId, userId: req.user?.userId || req.user?.id, type, payload, idempotencyKey, resultIdempotencyKey, resourceType, resourceId })
    res.status(201).json({ task })
  } catch (error) { next(error) }
})

router.get('/', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try { res.json({ tasks: await listTasks(req.organizationId, req.query.limit) }) } catch (error) { next(error) }
})

router.get('/:taskId', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try {
    const task = await getTask(req.params.taskId, req.organizationId)
    if (!task) return res.status(404).json({ message: '任务不存在' })
    res.json({ task })
  } catch (error) { next(error) }
})

router.post('/:taskId/retry', requireOrganizationPermission('tasks:manage'), async (req, res, next) => {
  try { res.json({ task: await retryTask(req.params.taskId, req.organizationId) }) } catch (error) { next(error) }
})

router.post('/:taskId/cancel', requireOrganizationPermission('tasks:manage'), async (req, res, next) => {
  try { res.json({ task: await cancelTask(req.params.taskId, req.organizationId) }) } catch (error) { next(error) }
})

export default router

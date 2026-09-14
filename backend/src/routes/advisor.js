import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { query } from '../models/db.js'
import { canAccessAdvisorOrganization, getAdvisorOrganizationSummary, listAdvisorOrganizations, requireAdvisorAccess } from '../services/advisor.js'
import { writeAdminAudit } from '../services/productEvents.js'

const router = express.Router()
router.use(authMiddleware, requireAdvisorAccess)

router.get('/organizations', async (req, res, next) => {
  try { res.json({ organizations: await listAdvisorOrganizations(req.user.userId, req.platformRole), platformRole: req.platformRole }) } catch (error) { next(error) }
})

router.get('/organizations/:organizationId/summary', async (req, res, next) => {
  try {
    const allowed = await canAccessAdvisorOrganization(req.user.userId, req.params.organizationId, req.platformRole)
    if (!allowed) return res.status(403).json({ message: '顾问未被分配该机构' })
    const summary = await getAdvisorOrganizationSummary(req.params.organizationId)
    if (req.platformRole === 'platform_admin') await writeAdminAudit({ actorId: req.user.userId, action: 'advisor_summary_viewed', targetType: 'organization', targetId: req.params.organizationId, metadata: { source: 'advisor_api' } })
    res.json(summary)
  } catch (error) { next(error) }
})

router.post('/assignments', async (req, res, next) => {
  try {
    if (req.platformRole !== 'platform_admin') return res.status(403).json({ message: '仅平台管理员可分配顾问' })
    const advisorUserId = String(req.body?.advisorUserId || '').trim()
    const organizationId = Number(req.body?.organizationId)
    if (!advisorUserId || !organizationId) return res.status(400).json({ message: '顾问和机构不能为空' })
    await query("INSERT INTO advisor_assignments (advisor_user_id, organization_id, assigned_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = 'active', assigned_by = VALUES(assigned_by)", [advisorUserId, organizationId, String(req.user.userId)])
    await writeAdminAudit({ actorId: req.user.userId, action: 'advisor_assigned', targetType: 'organization', targetId: organizationId, metadata: { status: 'active' } })
    res.status(201).json({ advisorUserId, organizationId, status: 'active' })
  } catch (error) { next(error) }
})

router.post('/organizations/:organizationId/stage-summaries', async (req, res, next) => {
  try {
    const allowed = await canAccessAdvisorOrganization(req.user.userId, req.params.organizationId, req.platformRole)
    if (!allowed) return res.status(403).json({ message: '顾问未被分配该机构' })
    const stageCode = String(req.body?.stageCode || '').trim().slice(0, 64)
    const summary = String(req.body?.summary || '').trim().slice(0, 4000)
    if (!stageCode || !summary) return res.status(400).json({ message: '阶段和总结不能为空' })
    const result = await query('INSERT INTO advisor_stage_summaries (organization_id, program_id, author_id, stage_code, summary) VALUES (?, ?, ?, ?, ?)', [req.params.organizationId, req.body?.programId || null, String(req.user.userId), stageCode, summary])
    if (req.platformRole === 'platform_admin') await writeAdminAudit({ actorId: req.user.userId, action: 'stage_summary_created', targetType: 'organization', targetId: req.params.organizationId, metadata: { programId: req.body?.programId, status: 'created' } })
    res.status(201).json({ id: result.insertId, stageCode, summary })
  } catch (error) { next(error) }
})

export default router

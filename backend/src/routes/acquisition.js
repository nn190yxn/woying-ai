import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createActionPlan, createDiagnosis, createProject, createSnapshot, getProject, listActionPlans, listDiagnoses, listProjects, listSnapshots, updateProject } from '../services/acquisition/index.js'
import { getRequestActorId, requireOrganizationPermission } from '../services/organization.js'
import { migrateLegacyDouyinData } from '../services/acquisition/legacyMigration.js'
import { submitAcquisitionOcr } from '../services/mediaTasks.js'
import { recordProductEvent } from '../services/productEvents.js'
import { runLegacyAcquisitionAdapter } from '../services/acquisition/legacyAdapters.js'
import { createWeeklyReview, triggerConsultantEscalation } from '../services/growthReview.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/projects', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try { res.json({ projects: await listProjects(req.organizationId) }) } catch (error) { next(error) }
})

router.post('/compatibility/douyin/migrate', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const result = await migrateLegacyDouyinData({ organizationId: req.organizationId, userId: getRequestActorId(req) })
    res.json({ result })
  } catch (error) { next(error) }
})

router.post('/projects', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: '项目名称不能为空' })
    const project = await createProject({ organizationId: req.organizationId, userId: getRequestActorId(req), name, goal: req.body?.goal, channels: req.body?.channels })
    res.status(201).json({ project })
  } catch (error) { next(error) }
})

router.get('/projects/:projectId', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try {
    const project = await getProject(req.params.projectId, req.organizationId)
    if (!project) return res.status(404).json({ message: '项目不存在' })
    res.json({ project })
  } catch (error) { next(error) }
})

router.patch('/projects/:projectId', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try { res.json({ project: await updateProject(req.params.projectId, req.organizationId, req.body || {}) }) } catch (error) { next(error) }
})

router.post('/projects/:projectId/screenshots/ocr', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const task = await submitAcquisitionOcr({ projectId: req.params.projectId, assetId: req.body?.assetId, channelCode: req.body?.channelCode, organizationId: req.organizationId, userId: getRequestActorId(req) })
    if (!task) return res.status(404).json({ message: '项目不存在' })
    res.status(202).json({ task })
  } catch (error) { next(error) }
})

router.get('/projects/:projectId/diagnoses', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try { res.json({ diagnoses: await listDiagnoses(req.params.projectId, req.organizationId) }) } catch (error) { next(error) }
})

router.post('/projects/:projectId/diagnoses', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const diagnosis = await createDiagnosis({ projectId: req.params.projectId, organizationId: req.organizationId, channelCode: req.body?.channelCode, diagnosisType: req.body?.diagnosisType, knowledgeBasis: Array.isArray(req.body?.knowledgeBasis) ? req.body.knowledgeBasis.slice(0, 20).map(String) : [], inputData: req.body?.inputData || {} })
    await recordProductEvent({ organizationId: req.organizationId, actorId: getRequestActorId(req), eventName: 'first_diagnosis', payload: { projectId: Number(req.params.projectId), diagnosisId: diagnosis.id, channel: req.body?.channelCode, source: 'acquisition' } })
    res.status(201).json({ diagnosis })
  } catch (error) { next(error) }
})

router.get('/projects/:projectId/action-plans', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try { res.json({ plans: await listActionPlans(req.params.projectId, req.organizationId) }) } catch (error) { next(error) }
})

router.post('/projects/:projectId/snapshots', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try { res.status(201).json({ snapshot: await createSnapshot({ projectId: req.params.projectId, organizationId: req.organizationId, metrics: req.body?.metrics, summary: req.body?.summary }) }) } catch (error) { next(error) }
})

router.get('/projects/:projectId/snapshots', requireOrganizationPermission('resources:read'), async (req, res, next) => {
  try { res.json({ snapshots: await listSnapshots(req.params.projectId, req.organizationId) }) } catch (error) { next(error) }
})

router.post('/projects/:projectId/weekly-review', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const snapshots = await listSnapshots(req.params.projectId, req.organizationId)
    const snapshot = req.body?.snapshot || snapshots[0] || { metrics: {} }
    const review = await createWeeklyReview({ projectId: Number(req.params.projectId), organizationId: req.organizationId, snapshot, baseline: req.body?.baseline || null })
    const escalation = await triggerConsultantEscalation({ organizationId: req.organizationId, programId: req.body?.programId || null, alertType: 'weekly_growth_review', title: review.primaryIssue, detail: { evidence: review.evidence, validationMetrics: review.validationMetrics }, severity: review.knowledgeStatus === 'needs_review' ? 'medium' : 'low', dedupeKey: `weekly-review:${req.params.projectId}:${new Date().toISOString().slice(0, 10)}` })
    res.json({ review, escalation: { created: escalation.created, requiresHuman: escalation.requiresHuman } })
  } catch (error) { next(error) }
})

router.post('/projects/:projectId/action-plans', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const plan = await createActionPlan({ projectId: req.params.projectId, organizationId: req.organizationId, diagnosisId: req.body?.diagnosisId, templateCode: req.body?.templateCode, title: req.body?.title })
    res.status(201).json({ plan })
  } catch (error) { next(error) }
})

router.post('/projects/:projectId/weekly-review', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const snapshot = req.body?.snapshot || { metrics: req.body?.metrics || {} }
    const review = await createWeeklyReview({ projectId: req.params.projectId, organizationId: req.organizationId, snapshot, baseline: req.body?.baseline || null })
    let escalation = null
    if (req.body?.triggerConsultant) escalation = await triggerConsultantEscalation({ organizationId: req.organizationId, programId: req.body?.programId, alertType: 'weekly_review', title: review.primaryIssue, detail: review.evidence, severity: req.body?.severity || 'medium', dedupeKey: `weekly_review:${req.params.projectId}` })
    res.json({ review, escalation })
  } catch (error) { next(error) }
})

router.post('/projects/:projectId/legacy/:channel/:capability', requireOrganizationPermission('resources:write'), async (req, res, next) => {
  try {
    const result = await runLegacyAcquisitionAdapter({ organizationId: req.organizationId, projectId: req.params.projectId, channel: req.params.channel, capability: req.params.capability, input: req.body?.input || {}, templateCode: req.body?.templateCode || null })
    res.status(201).json({ result })
  } catch (error) { next(error) }
})

export default router

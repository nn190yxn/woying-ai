import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { closeAlert, createAlert, createConsultantNote, createProgram, getServiceRecommendations, listAlerts, listConsultantNotes, listPrograms, listTouchpoints } from '../services/serviceDelivery/index.js'
import { getRequestActorId, requireOrganizationPermission } from '../services/organization.js'
import { recordProductEvent } from '../services/productEvents.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/programs', requireOrganizationPermission('service:read'), async (req, res, next) => {
  try { res.json({ programs: await listPrograms(req.organizationId) }) } catch (error) { next(error) }
})

router.post('/programs', requireOrganizationPermission('service:write'), async (req, res, next) => {
  try {
    const program = await createProgram({ organizationId: req.organizationId, type: req.body?.type, startDate: req.body?.startDate || new Date().toISOString().slice(0, 10), durationDays: req.body?.durationDays })
    await recordProductEvent({ organizationId: req.organizationId, actorId: getRequestActorId(req), eventName: 'service_plan_submitted', payload: { serviceType: req.body?.type, programId: program.id, status: program.status } })
    res.status(201).json({ program })
  } catch (error) { next(error) }
})

router.get('/programs/:programId/touchpoints', requireOrganizationPermission('service:read'), async (req, res, next) => {
  try { res.json({ touchpoints: await listTouchpoints(req.params.programId, req.organizationId) }) } catch (error) { next(error) }
})

router.get('/programs/:programId/notes', requireOrganizationPermission('service:read'), async (req, res, next) => {
  try { res.json({ notes: await listConsultantNotes(req.params.programId, req.organizationId) }) } catch (error) { next(error) }
})

router.post('/programs/:programId/notes', requireOrganizationPermission('service:write'), async (req, res, next) => {
  try {
    const note = await createConsultantNote({ organizationId: req.organizationId, programId: req.params.programId, authorId: getRequestActorId(req), content: req.body?.content })
    res.status(201).json({ note })
  } catch (error) { next(error) }
})

router.get('/alerts', requireOrganizationPermission('service:read'), async (req, res, next) => {
  try { res.json({ alerts: await listAlerts(req.organizationId, req.query.status || 'open') }) } catch (error) { next(error) }
})

router.post('/alerts', requireOrganizationPermission('service:write'), async (req, res, next) => {
  try {
    const result = await createAlert({ organizationId: req.organizationId, programId: req.body?.programId, alertType: req.body?.alertType, title: req.body?.title, detail: req.body?.detail, dedupeKey: req.body?.dedupe_key || req.body?.dedupeKey })
    res.status(result.created ? 201 : 200).json(result)
  } catch (error) { next(error) }
})

router.patch('/alerts/:alertId/close', requireOrganizationPermission('service:write'), async (req, res, next) => {
  try { res.json({ alert: await closeAlert(req.params.alertId, req.organizationId) }) } catch (error) { next(error) }
})

router.get('/recommendations', requireOrganizationPermission('service:read'), async (req, res, next) => {
  try {
    const recommendations = await getServiceRecommendations(req.organizationId)
    await recordProductEvent({ organizationId: req.organizationId, actorId: getRequestActorId(req), eventName: 'service_recommended', payload: { source: 'service_center', status: recommendations.length ? 'available' : 'empty' } })
    res.json({ recommendations })
  } catch (error) { next(error) }
})

export default router

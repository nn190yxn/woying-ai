import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  addOrganizationMember,
  archiveOrganizationLocation,
  createOrganization,
  createOrganizationLocation,
  ensureDefaultOrganization,
  getOrganizationForUser,
  getRequestActorId,
  listOrganizationLocations,
  listOrganizationMembers,
  listOrganizations,
  requireOrganizationPermission,
  revokeOrganizationMember,
  setDefaultOrganization,
  updateOrganizationLocation,
  updateOrganizationMemberRole
} from '../services/organization.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const organizations = await listOrganizations(getRequestActorId(req))
    res.json({ organizations })
  } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim()
    if (!name) return res.status(400).json({ message: '机构名称不能为空' })
    const organization = await createOrganization({ userId: getRequestActorId(req), name, industry: req.body?.industry, city: req.body?.city })
    res.status(201).json({ organization })
  } catch (error) { next(error) }
})

router.post('/ensure-default', async (req, res, next) => {
  try { res.json({ organization: await ensureDefaultOrganization(getRequestActorId(req)) }) } catch (error) { next(error) }
})

router.post('/:organizationId/default', async (req, res, next) => {
  try { res.json({ organization: await setDefaultOrganization({ userId: getRequestActorId(req), organizationId: req.params.organizationId }) }) } catch (error) { next(error) }
})

router.get('/:organizationId/members', requireOrganizationPermission('members:read'), async (req, res, next) => {
  try { res.json({ members: await listOrganizationMembers(req.params.organizationId, getRequestActorId(req)) }) } catch (error) { next(error) }
})

router.post('/:organizationId/members', requireOrganizationPermission('members:manage'), async (req, res, next) => {
  try {
    const member = await addOrganizationMember({ organizationId: req.params.organizationId, actorUserId: getRequestActorId(req), userId: req.body?.userId, role: req.body?.role })
    res.status(201).json({ member })
  } catch (error) { next(error) }
})

router.patch('/:organizationId/members/:userId', requireOrganizationPermission('members:manage'), async (req, res, next) => {
  try {
    const member = await updateOrganizationMemberRole({ organizationId: req.params.organizationId, actorUserId: getRequestActorId(req), memberUserId: req.params.userId, role: req.body?.role })
    res.json({ member })
  } catch (error) { next(error) }
})

router.delete('/:organizationId/members/:userId', requireOrganizationPermission('members:manage'), async (req, res, next) => {
  try {
    const member = await revokeOrganizationMember({ organizationId: req.params.organizationId, actorUserId: getRequestActorId(req), memberUserId: req.params.userId })
    res.json({ member })
  } catch (error) { next(error) }
})

router.get('/:organizationId/locations', requireOrganizationPermission('members:read'), async (req, res, next) => {
  try { res.json({ locations: await listOrganizationLocations(req.params.organizationId, getRequestActorId(req)) }) } catch (error) { next(error) }
})

router.post('/:organizationId/locations', requireOrganizationPermission('locations:manage'), async (req, res, next) => {
  try {
    const location = await createOrganizationLocation({ organizationId: req.params.organizationId, actorUserId: getRequestActorId(req), name: req.body?.name, address: req.body?.address })
    res.status(201).json({ location })
  } catch (error) { next(error) }
})

router.patch('/:organizationId/locations/:locationId', requireOrganizationPermission('locations:manage'), async (req, res, next) => {
  try {
    const location = await updateOrganizationLocation({ organizationId: req.params.organizationId, actorUserId: getRequestActorId(req), locationId: req.params.locationId, name: req.body?.name, address: req.body?.address })
    res.json({ location })
  } catch (error) { next(error) }
})

router.delete('/:organizationId/locations/:locationId', requireOrganizationPermission('locations:manage'), async (req, res, next) => {
  try {
    const location = await archiveOrganizationLocation({ organizationId: req.params.organizationId, actorUserId: getRequestActorId(req), locationId: req.params.locationId })
    res.json({ location })
  } catch (error) { next(error) }
})

router.get('/:organizationId', async (req, res, next) => {
  try {
    const organization = await getOrganizationForUser(req.params.organizationId, getRequestActorId(req))
    if (!organization) return res.status(404).json({ message: '机构不存在或无权访问' })
    res.json({ organization })
  } catch (error) { next(error) }
})

export default router

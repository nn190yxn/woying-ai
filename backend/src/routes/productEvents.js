import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { recordProductEvent } from '../services/productEvents.js'
import { requireOrganization } from '../services/organization.js'

const router = express.Router()
router.use(authMiddleware)
router.post('/', requireOrganization, async (req, res, next) => {
  try {
    const event = await recordProductEvent({ organizationId: req.organizationId, actorId: req.user.userId ?? 'guest', eventName: req.body?.eventName, payload: req.body?.payload })
    res.status(202).json(event)
  } catch (error) { next(error) }
})
export default router

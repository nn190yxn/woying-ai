import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { requireOrganization } from '../services/organization.js'
import { getMyResults } from '../services/results.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/', requireOrganization, async (req, res, next) => {
  try { res.json({ results: await getMyResults(req.organizationId) }) } catch (error) { next(error) }
})

export default router

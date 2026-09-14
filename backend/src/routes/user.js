import express from 'express'
import { query } from '../models/db.js'
import { authMiddleware } from '../middleware/auth.js'
import { logger } from '../middleware/logger.js'
import { getPlatformRole } from '../services/advisor.js'

const router = express.Router()

async function sendProfile(req, res, errorMessage) {
  try {
    const users = await query('SELECT id, phone, nickname, member_level, member_expire_at, industry, city, created_at FROM users WHERE id = ?', [req.user.userId])
    if (!users.length) return res.status(404).json({ message: '用户不存在' })
    const user = users[0]
    res.json({ id: user.id, phone: user.phone, nickname: user.nickname, memberLevel: user.member_level, memberExpireAt: user.member_expire_at, industry: user.industry, city: user.city, createdAt: user.created_at, platformRole: await getPlatformRole(user.id) })
  } catch (error) {
    logger.error('user', `${errorMessage}: ${error.message}`)
    res.status(500).json({ message: '获取用户信息失败' })
  }
}

router.get('/profile', authMiddleware, (req, res) => sendProfile(req, res, 'Get profile error'))
router.get('/info', authMiddleware, (req, res) => sendProfile(req, res, 'Get user info error'))

router.put('/profile', authMiddleware, async (req, res) => {
  const { nickname, industry, city } = req.body
  try {
    await query('UPDATE users SET nickname = ?, industry = ?, city = ? WHERE id = ?', [nickname, industry, city, req.user.userId])
    res.json({ message: '更新成功' })
  } catch (error) {
    logger.error('user', `Update profile error: ${error.message}`)
    res.status(500).json({ message: '更新失败' })
  }
})

export default router

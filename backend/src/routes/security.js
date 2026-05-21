import express from 'express'
import { logger } from '../middleware/logger.js'

const router = express.Router()

// 文本内容安全检测
router.post('/check-text', async (req, res) => {
  const { content } = req.body

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ message: '内容不能为空' })
  }

  // TODO: 接入微信 content_check API 或腾讯云文本审核
  // 当前仅做基础敏感词过滤
  const sensitiveWords = ['测试敏感词']
  const hasSensitive = sensitiveWords.some(word => content.includes(word))

  if (hasSensitive) {
    return res.json({ pass: false, reason: '内容包含敏感词汇' })
  }

  res.json({ pass: true })
})

// 图片内容安全检测
router.post('/check-image', async (req, res) => {
  const { imageUrl } = req.body

  if (!imageUrl) {
    return res.status(400).json({ message: '图片地址不能为空' })
  }

  // TODO: 接入微信 img_sec_check API 或腾讯云图片审核
  res.json({ pass: true })
})

export default router
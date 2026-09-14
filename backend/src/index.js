import express from 'express'
import cors from 'cors'

try {
  const { default: dotenv } = await import('dotenv')
  dotenv.config()
} catch {}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

import { requestLogger, perfMonitor, errorTracker } from './middleware/logger.js'
import { initDB } from './models/db.js'
import { initFeatureSchema } from './models/featureSchema.js'
import { initSalesSchema } from './models/salesSchema.js'
import { initServiceSchema } from './models/serviceSchema.js'
import { initAdvisorSchema } from './models/advisorSchema.js'
import './services/fileCleanupTask.js'

app.use(requestLogger)
app.use(perfMonitor)

import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import toolRoutes from './routes/tool.js'
import membershipRoutes from './routes/membership.js'
import paymentRoutes from './routes/payment.js'
import referralRoutes from './routes/referral.js'
import diagnosisRoutes from './routes/diagnosis.js'
import adminRoutes from './routes/admin.js'
import cronRoutes from './routes/cron.js'
import generateRoutes from './routes/generate.js'
import analyticsRoutes from './routes/analytics.js'
import industryRoutes from './routes/industry.js'
import douyinAgentRoutes from './routes/douyinAgents.js'
import xhsAgentRoutes from './routes/xhsAgents.js'
import privateAgentRoutes from './routes/privateAgents.js'
import posterGeneratorRoutes from './routes/posterGenerator.js'
import sheetsRoutes from './routes/sheets.js'
import userFeedbackRoutes from './routes/user-feedback.js'
import feedbackRoutes from './routes/feedback.js'
import tokenMonitorRoutes from './routes/tokenMonitor.js'
import securityRoutes from './routes/security.js'
import organizationRoutes from './routes/organizations.js'
import storageRoutes from './routes/storage.js'
import asyncTaskRoutes from './routes/asyncTasks.js'
import acquisitionRoutes from './routes/acquisition.js'
import salesCoachRoutes from './routes/salesCoach.js'
import serviceRoutes from './routes/services.js'
import resultsRoutes from './routes/results.js'
import advisorRoutes from './routes/advisor.js'
import productEventRoutes from './routes/productEvents.js'

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/tools', toolRoutes)
app.use('/api/membership', membershipRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/referral', referralRoutes)
app.use('/api/diagnosis', diagnosisRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/cron', cronRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/generate/poster', posterGeneratorRoutes)
app.use('/api/sheets', sheetsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/industries', industryRoutes)
app.use('/api/douyin', douyinAgentRoutes)
app.use('/api/xhs', xhsAgentRoutes)
app.use('/api/private', privateAgentRoutes)
app.use('/api/user-feedback', userFeedbackRoutes)
app.use('/api/poster-generator', posterGeneratorRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/token-monitor', tokenMonitorRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/storage', storageRoutes)
app.use('/api/async-tasks', asyncTaskRoutes)
app.use('/api/acquisition', acquisitionRoutes)
app.use('/api/sales-coach', salesCoachRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/results', resultsRoutes)
app.use('/api/advisor', advisorRoutes)
app.use('/api/product-events', productEventRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorTracker)

await initDB()
await initFeatureSchema()
await initSalesSchema()
await initServiceSchema()
await initAdvisorSchema()
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Log directory: ${process.env.LOG_DIR || './logs'}`)
})

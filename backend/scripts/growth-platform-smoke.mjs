import { initDB, query } from '../src/models/db.js'
import { ensureDefaultOrganization } from '../src/services/organization.js'
import { createRecording, saveManualTranscript, createAnalysis } from '../src/services/salesCoach/index.js'
import { createProgram, listTouchpoints, createAlert, closeAlert } from '../src/services/serviceDelivery/index.js'
import { migrateLegacyDouyinData } from '../src/services/acquisition/legacyMigration.js'
await initDB()
const org = await ensureDefaultOrganization('smoke-owner')
const recording = await createRecording({ organizationId: org.id, userId: 'smoke-owner', sellerLabel: '销售A', scene: 'new_sale', consentConfirmed: true })
await saveManualTranscript({ recordingId: recording.id, organizationId: org.id, text: '先了解孩子年龄和兴趣，家长希望提升自信，我们安排下一步报名。' })
const analysis = await createAnalysis({ recordingId: recording.id, organizationId: org.id, confirmedScene: 'new_sale' })
const program = await createProgram({ organizationId: org.id, type: 'founder_advisor', startDate: '2026-08-22' })
const touchpoints = await listTouchpoints(program.id, org.id)
const created = await createAlert({ organizationId: org.id, programId: program.id, alertType: 'execution', title: '测试异常', dedupeKey: 'smoke-alert' })
const closed = await closeAlert(created.alert.id, org.id)
await query('INSERT INTO douyin_quick_plans (user_id, industry, goal, frequency, ad_support, plan_version, input_hash, diagnosis_context, plan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['smoke-owner', 'education', 'leads', 'daily', 'none', 3, 'smoke-hash', '{}', '{"days":[]}'])
const migrated = await migrateLegacyDouyinData({ organizationId: org.id, userId: 'smoke-owner' })
const migratedAgain = await migrateLegacyDouyinData({ organizationId: org.id, userId: 'smoke-owner' })
if (migrated.plans !== 1 || migratedAgain.plans !== 0) throw new Error(`旧抖音计划迁移幂等性失败: ${JSON.stringify({ migrated, migratedAgain })}`)
console.log(JSON.stringify({ organizationId: org.id, score: analysis.score, tasks: analysis.trainingTasks.length, touchpoints: touchpoints.length, alert: closed.status, migratedPlans: migrated.plans }))


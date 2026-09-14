import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrganization } from '../src/services/organization.js'
import { createProject, createSnapshot } from '../src/services/acquisition/index.js'
import { runLegacyAcquisitionAdapter } from '../src/services/acquisition/legacyAdapters.js'
import { runStructuredSkill } from '../src/services/aiRunner.js'
import { listSkills } from '../src/services/skillRegistry.js'
import { createWeeklyReview, triggerConsultantEscalation } from '../src/services/growthReview.js'
import { mockDb } from '../src/models/mockDb.js'

process.env.NODE_ENV = 'test'
const nonce = `accept-${Date.now()}`

test('第4阶段：新Skill均可解析，Runner脱敏并保留知识状态审计', async () => {
  const codes = ['growth.funnel_diagnosis', 'acquisition.douyin_diagnosis', 'acquisition.xhs_diagnosis', 'acquisition.offer_diagnosis', 'acquisition.content_plan', 'acquisition.traffic_experiment', 'growth.weekly_review', 'service.consultant_escalation']
  const registered = listSkills()
  for (const code of codes) assert.ok(registered.some(skill => skill.skillCode === code), code)
  const org = await createOrganization({ userId: `${nonce}-runner`, name: '验收机构' })
  let seen = ''
  const result = await runStructuredSkill({ organizationId: org.id, skillCode: 'acquisition.douyin_diagnosis', scene: 'douyin', input: { phone: '13800138000', name: '儿童甲' }, organizationBaseline: { valid_leads: 10 }, invoke: async (input, skill, context) => {
    seen = `${input}|${JSON.stringify(context)}`
    return { conclusion: 'ok', basis: [], priorities: [], actions: [], risks: [], evidence: [], validationMetrics: [], stopConditions: [], knowledgeStatus: 'canonical' }
  } })
  assert.equal(result.status, 'succeeded')
  assert.doesNotMatch(seen, /13800138000|儿童甲/)
  assert.match(seen, /organizationBaseline/)
})

test('第4阶段：获客旧渠道适配不直调模型且重复调用只读兼容', async () => {
  const org = await createOrganization({ userId: `${nonce}-legacy`, name: '旧数据机构' })
  const project = await createProject({ organizationId: org.id, userId: 'u', name: '旧抖音项目' })
  const first = await runLegacyAcquisitionAdapter({ organizationId: org.id, projectId: project.id, channel: 'douyin', capability: 'diagnosis', input: { phone: '13800138000' } })
  const second = await runLegacyAcquisitionAdapter({ organizationId: org.id, projectId: project.id, channel: 'douyin', capability: 'review', input: { metrics: { valid_leads: 2 } } })
  assert.equal(first.data.status, 'needs_review')
  assert.equal(second.data.status, undefined)
  assert.equal(JSON.parse(second.data.metrics).valid_leads, 2)
})

test('第5阶段：指标白名单、零分母、机构基线与周复盘唯一问题', async () => {
  const org = await createOrganization({ userId: `${nonce}-metrics`, name: '指标机构' })
  const project = await createProject({ organizationId: org.id, userId: 'u', name: '指标项目' })
  const snapshot = await createSnapshot({ projectId: project.id, organizationId: org.id, metrics: { valid_leads: 4, appointments: 0, spend: 100, phone: '13800138000', baseline: 99 } })
  const metrics = JSON.parse(snapshot.metrics)
  assert.deepEqual(metrics, { valid_leads: 4, appointments: 0, spend: 100, cost_per_valid_lead: 25, appointment_rate: 0, arrival_rate: null })
  const review = await createWeeklyReview({ projectId: project.id, organizationId: org.id, snapshot: { metrics }, baseline: { valid_leads: 3 } })
  assert.equal(review.primaryIssue, '有效线索未形成预约')
  assert.equal(review.actions.length, 1)
  assert.deepEqual(review.baseline, { valid_leads: 3 })
})

test('第6阶段：顾问告警去重、关闭后重开、高风险人工接管', async () => {
  const org = await createOrganization({ userId: `${nonce}-advisor`, name: '顾问机构' })
  const args = { organizationId: org.id, alertType: 'privacy_risk', title: '隐私风险', detail: '需人工', severity: 'high', dedupeKey: `${nonce}-privacy` }
  const first = await triggerConsultantEscalation(args)
  const duplicate = await triggerConsultantEscalation(args)
  assert.equal(first.created, true)
  assert.equal(first.requiresHuman, true)
  assert.equal(duplicate.created, false)
  mockDb.service_alerts.find(item => item.dedupe_key === args.dedupeKey).status = 'closed'
  const reopened = await triggerConsultantEscalation(args)
  assert.equal(reopened.created, false)
  assert.equal(reopened.alert.status, 'open')
  assert.equal(reopened.requiresHuman, true)
})

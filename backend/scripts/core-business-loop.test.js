import test from 'node:test'
import assert from 'node:assert/strict'
import { initDB } from '../src/models/db.js'
import { createOrganization } from '../src/services/organization.js'
import { createProject, createSnapshot, createDiagnosis, createActionPlan } from '../src/services/acquisition/index.js'
import { retrieveLayeredKnowledge } from '../src/services/kbService.js'
import { runStructuredSkill } from '../src/services/aiRunner.js'
import { createWeeklyReview, triggerConsultantEscalation } from '../src/services/growthReview.js'

process.env.NODE_ENV = 'test'
const nonce = `business-loop-${Date.now()}`

const sample = {
  industry: '少儿体育培训',
  city: '贵阳',
  course: '少儿篮球体验课',
  monthlyViews: 12000,
  validLeads: 28,
  appointments: 12,
  arrivals: 3,
  trialCompleted: 3,
  newSales: 0,
  spend: 1800,
  contentProblem: '内容有播放但家长咨询少，体验课到店后没有正价报名',
  privacyProbe: { childName: '测试儿童', phone: '13800138000' }
}

await initDB()

test('核心业务闭环：真实少儿体育样本可从知识检索走到诊断、行动与复盘', async () => {
  const org = await createOrganization({ userId: `${nonce}-owner`, name: '匿名少儿篮球机构' })
  const project = await createProject({ organizationId: org.id, userId: `${nonce}-owner`, name: '篮球体验课获客闭环', goal: '提高有效咨询、到店和正价报名' })

  const diagnosticKnowledge = retrieveLayeredKnowledge({ productDomain: 'acquisition', scene: 'diagnosis', skillVersion: '1.0.0', maxSnippets: 20 })
  const offerKnowledge = retrieveLayeredKnowledge({ productDomain: 'offer', scene: 'trial_class', skillVersion: '1.0.0', maxSnippets: 20 })
  const trafficKnowledge = retrieveLayeredKnowledge({ productDomain: 'paid_traffic', scene: 'experiment', skillVersion: '1.0.0', maxSnippets: 20 })
  const ids = [...diagnosticKnowledge.snippets, ...offerKnowledge.snippets, ...trafficKnowledge.snippets].map(item => item.knowledgeId)
  assert.ok(ids.includes('funnel-traffic'), '应命中获客漏斗规则')
  assert.ok(ids.includes('trial-offer'), '应命中体验课规则')
  assert.ok(ids.includes('traffic-prohibition'), '应命中投流风险规则')
  assert.ok(diagnosticKnowledge.meta.snippetCount + offerKnowledge.meta.snippetCount + trafficKnowledge.meta.snippetCount >= 3, '知识上下文不应为空')

  let runnerContext
  const run = await runStructuredSkill({
    organizationId: org.id,
    skillCode: 'acquisition.douyin_diagnosis',
    scene: 'douyin',
    channel: 'douyin',
    input: { institution: sample },
    invoke: async (safeInput, skill, context) => {
      runnerContext = { safeInput, skill, context }
      const metrics = sample
      return {
        conclusion: '主要瓶颈在到店后的体验承接与成交，而非继续扩大投流。',
        basis: context.knowledgeMeta,
        priorities: ['先复盘体验课承接，再验证内容咨询转化'],
        actions: [
          { title: '重做体验课承接卡', owner: 'principal', duration: '7天', metric: 'trial_to_sale' },
          { title: '只测试一个家长问题内容方向', owner: 'marketing_lead', duration: '7天', metric: 'valid_leads' }
        ],
        risks: ['未完成利润和承接验证前，不扩大投流'],
        evidence: [{ metric: 'arrivals', value: metrics.arrivals }, { metric: 'new_sales', value: metrics.newSales }],
        validationMetrics: ['体验课正价转化率', '有效咨询数'],
        stopConditions: ['连续两轮无改善或预算超上限时停止'],
        knowledgeStatus: 'canonical'
      }
    }
  })

  assert.equal(run.status, 'succeeded')
  assert.match(runnerContext.safeInput, /已脱敏/)
  assert.doesNotMatch(runnerContext.safeInput, /13800138000|测试儿童/)
  assert.ok(runnerContext.context.knowledgeMeta.snippetCount >= 1)
  assert.equal(run.output.actions.length, 2)
  assert.match(run.output.conclusion, /体验承接/)

  const diagnosis = await createDiagnosis({
    projectId: project.id,
    organizationId: org.id,
    channelCode: 'douyin',
    inputData: sample,
    knowledgeBasis: diagnosticKnowledge.snippets.map(item => item.knowledgeId)
  })
  assert.equal(diagnosis.status, 'needs_review', '未配置模型时必须明确降级而不是伪造 AI 成功')
  assert.equal(JSON.parse(diagnosis.output_data).needs_review, true)

  const snapshot = await createSnapshot({
    projectId: project.id,
    organizationId: org.id,
    metrics: {
      views: sample.monthlyViews,
      valid_leads: sample.validLeads,
      appointments: sample.appointments,
      arrivals: sample.arrivals,
      trial_completed: sample.trialCompleted,
      new_sales: sample.newSales,
      spend: sample.spend
    },
    summary: '匿名机构首周聚合经营数据'
  })
  const metrics = JSON.parse(snapshot.metrics)
  assert.equal(metrics.arrival_rate, 0.25)
  assert.equal(metrics.trial_conversion_rate, 0)
  assert.equal(metrics.cost_per_valid_lead, 1800 / 28)

  const review = await createWeeklyReview({ projectId: project.id, organizationId: org.id, snapshot: { metrics }, baseline: { valid_leads: 20 } })
  assert.equal(review.primaryIssue, '到店未形成正价成交')
  assert.equal(review.actions.length, 1)
  assert.equal(review.knowledgeStatus, 'needs_review')

  const plan = await createActionPlan({
    projectId: project.id,
    organizationId: org.id,
    diagnosisId: diagnosis.id,
    title: '匿名机构7天验证计划',
    planData: { goal: '验证体验课成交承接', actions: run.output.actions, validation: review.validationMetrics, stopConditions: review.stopConditions }
  })
  const savedPlan = JSON.parse(plan.plan_data)
  assert.equal(savedPlan.actions.length, 2)
  assert.equal(savedPlan.validation[0], '下一周期对应转化指标')

  const alert = await triggerConsultantEscalation({
    organizationId: org.id,
    alertType: 'growth_review',
    title: '体验课到店后零成交',
    detail: review.primaryIssue,
    severity: 'high',
    dedupeKey: `${nonce}-growth`
  })
  assert.equal(alert.created, true)
  assert.equal(alert.requiresHuman, true)

  console.log(JSON.stringify({
    organizationId: org.id,
    projectId: project.id,
    knowledgeHits: ids,
    diagnosis: run.output.conclusion,
    fallbackStatus: diagnosis.status,
    primaryIssue: review.primaryIssue,
    actionCount: savedPlan.actions.length,
    requiresHuman: alert.requiresHuman
  }))
})

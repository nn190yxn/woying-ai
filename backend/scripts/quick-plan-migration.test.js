import assert from 'node:assert/strict'
import test, { after } from 'node:test'

import {
  QUICK_PLAN_RESULT_VERSION,
  migrateSavedPlan
} from '../src/services/douyin/index.js'

after(() => {
  setImmediate(() => process.exit(process.exitCode || 0))
})

const buildLegacyDays = () => Array.from({ length: 15 }, (_, index) => ({
  day: index + 1,
  phase: index < 5 ? '测试期' : index < 10 ? '放大期' : '转化期',
  goal: `旧计划第 ${index + 1} 天目标`,
  topicDirection: `旧计划第 ${index + 1} 天选题`,
  status: index === 0 ? 'done' : index === 6 ? 'doing' : 'pending'
}))

const legacyRow = {
  industry: '餐饮',
  goal: 'conversion',
  planVersion: 1,
  diagnosisContext: {
    targetAudience: '附近想聚餐的顾客',
    coreOffer: '招牌双人套餐',
    offerPrice: '双人餐 128 元',
    userObjection: '怕分量少',
    proofAssets: '真实分量和老客评价',
    conversionPath: '点击团购券到店核销',
    painSummary: '播放低且核销少'
  },
  plan: {
    title: '旧版 15 天计划',
    days: buildLegacyDays()
  }
}

const flattenDays = (plan) => plan.phases.flatMap((phase) => phase.days)

test('migrates legacy saved plan to the current QuickPlanResult shape', () => {
  const plan = migrateSavedPlan(legacyRow)
  const days = flattenDays(plan)

  assert.equal(plan.meta.planVersion, QUICK_PLAN_RESULT_VERSION)
  assert.equal(plan.meta.migrated, true)
  assert.equal(plan.meta.industryCode, 'restaurant')
  assert.equal(plan.meta.goalCode, 'conversion')
  assert.equal(plan.phases.length, 3)
  assert.equal(days.length, 15)
  assert.ok(plan.researchBrief.length >= 7)
  assert.ok(plan.riskBoundary.length >= 3)
})

test('fills missing scripts and compatibility fields during migration', () => {
  const plan = migrateSavedPlan(legacyRow)

  flattenDays(plan).forEach((day) => {
    assert.ok(day.shootingScript)
    assert.equal(day.shootingScript.shots.length, 4)
    assert.equal(day.action, day.goal)
    assert.equal(day.content, day.topicDirection)
    assert.equal(day.ad, day.adPlan)
    assert.equal(day.kpi, day.reviewMetrics)
  })
})

test('preserves existing day statuses when saved plans are migrated', () => {
  const plan = migrateSavedPlan(legacyRow)
  const days = flattenDays(plan)

  assert.equal(days[0].status, 'done')
  assert.equal(days[6].status, 'doing')
  assert.equal(days[14].status, 'pending')
})

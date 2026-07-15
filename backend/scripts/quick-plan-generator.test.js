import assert from 'node:assert/strict'
import test, { after } from 'node:test'

import {
  QUICK_PLAN_RESULT_VERSION,
  buildQuickPlanFromTemplates,
  validateQuickPlanResult
} from '../src/services/douyin/index.js'

after(() => {
  setImmediate(() => process.exit(process.exitCode || 0))
})

const industries = ['restaurant', 'beauty', 'education']
const goals = ['traffic', 'conversion', 'leads']

const buildInput = ({ industryCode, goalCode }) => ({
  industryCode,
  goalCode,
  frequency: 5,
  adSupport: goalCode === 'traffic' ? 'no' : 'yes',
  diagnosisContext: {
    industry: industryCode,
    goal: goalCode,
    targetAudience: `${industryCode} target audience`,
    coreOffer: `${industryCode} core offer`,
    offerPrice: `${industryCode} offer price`,
    userObjection: `${industryCode} user objection`,
    proofAssets: `${industryCode} proof assets`,
    conversionPath: `${industryCode} conversion path`,
    painSummary: `${industryCode} pain summary`
  }
})

const buildPlan = ({ industryCode, goalCode }) => {
  const input = buildInput({ industryCode, goalCode })
  return validateQuickPlanResult(buildQuickPlanFromTemplates(input), input, { generationMode: 'rule' })
}

const flattenDays = (plan) => plan.phases.flatMap((phase) => phase.days)

const assertNonEmptyString = (value, message) => {
  assert.equal(typeof value, 'string', message)
  assert.ok(value.trim().length > 0, message)
}

test('generates complete plans for core industry and goal combinations', () => {
  industries.forEach((industryCode) => {
    goals.forEach((goalCode) => {
      const plan = buildPlan({ industryCode, goalCode })
      const days = flattenDays(plan)

      assert.equal(plan.meta.planVersion, QUICK_PLAN_RESULT_VERSION)
      assert.equal(plan.meta.industryCode, industryCode)
      assert.equal(plan.meta.goalCode, goalCode)
      assert.equal(plan.phases.length, 3)
      assert.equal(days.length, 15)
      assert.ok(plan.researchBrief.length >= 7)
      assert.ok(plan.riskBoundary.length >= 3)
    })
  })
})

test('property: every generated QuickPlanResult contains exactly 3 phases and 15 ordered days', () => {
  industries.forEach((industryCode) => {
    goals.forEach((goalCode) => {
      const plan = buildPlan({ industryCode, goalCode })
      const days = flattenDays(plan)

      assert.equal(plan.phases.length, 3)
      assert.equal(days.length, 15)
      assert.deepEqual(days.map((day) => day.day), Array.from({ length: 15 }, (_, index) => index + 1))
    })
  })
})

test('property: every day includes display fields and compatibility fields', () => {
  industries.forEach((industryCode) => {
    goals.forEach((goalCode) => {
      const plan = buildPlan({ industryCode, goalCode })

      flattenDays(plan).forEach((day) => {
        assertNonEmptyString(day.goal, `day ${day.day} goal`)
        assert.equal(day.action, day.goal)
        assertNonEmptyString(day.topicDirection, `day ${day.day} topicDirection`)
        assert.equal(day.content, day.topicDirection)
        assertNonEmptyString(day.adPlan, `day ${day.day} adPlan`)
        assert.equal(day.ad, day.adPlan)
        assertNonEmptyString(day.reviewMetrics, `day ${day.day} reviewMetrics`)
        assert.equal(day.kpi, day.reviewMetrics)
      })
    })
  })
})

test('property: every day script contains four shots', () => {
  industries.forEach((industryCode) => {
    goals.forEach((goalCode) => {
      const plan = buildPlan({ industryCode, goalCode })

      flattenDays(plan).forEach((day) => {
        assert.ok(day.shootingScript, `day ${day.day} shootingScript`)
        assertNonEmptyString(day.shootingScript.hook, `day ${day.day} hook`)
        assert.equal(day.shootingScript.shots.length, 4)
        day.shootingScript.shots.forEach((shot, index) => {
          assertNonEmptyString(shot, `day ${day.day} shot ${index + 1}`)
        })
      })
    })
  })
})

test('maps frontend ad support modes to distinct delivery plans', () => {
  const naturalPlan = buildQuickPlanFromTemplates({ industryCode: 'restaurant', goalCode: 'conversion', adSupport: 'no' })
  const douPlan = buildQuickPlanFromTemplates({ industryCode: 'restaurant', goalCode: 'conversion', adSupport: 'dou' })
  const localPlan = buildQuickPlanFromTemplates({ industryCode: 'restaurant', goalCode: 'conversion', adSupport: 'local' })
  const collectAdPlans = (plan) => flattenDays(plan).map((day) => day.adPlan).join('\n')

  assert.doesNotMatch(collectAdPlans(naturalPlan), /DOU\+|本地推小额投流/)
  assert.match(collectAdPlans(douPlan), /DOU\+ 小额投流/)
  assert.match(collectAdPlans(localPlan), /本地推小额投流/)
})

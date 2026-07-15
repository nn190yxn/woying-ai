import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test, { after } from 'node:test'

import {
  buildQuickPlanFromTemplates,
  industryStrategies,
  migrateSavedPlan,
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
  diagnosisContext: {
    targetAudience: `${industryCode} target audience`,
    coreOffer: `${industryCode} core offer`,
    offerPrice: `${industryCode} offer price`,
    userObjection: `${industryCode} objection`,
    proofAssets: `${industryCode} proof assets`,
    conversionPath: `${industryCode} conversion path`,
    painSummary: `${industryCode} pain summary`
  }
})

const collectText = (value) => {
  if (Array.isArray(value)) return value.map((item) => collectText(item)).join('\n')
  if (value && typeof value === 'object') return Object.values(value).map((item) => collectText(item)).join('\n')
  return value === undefined || value === null ? '' : String(value)
}

const flattenDays = (plan) => plan.phases.flatMap((phase) => phase.days)

test('property: generated plans do not include forbidden terms for their industry', () => {
  industries.forEach((industryCode) => {
    goals.forEach((goalCode) => {
      const input = buildInput({ industryCode, goalCode })
      const plan = validateQuickPlanResult(buildQuickPlanFromTemplates(input), input, { generationMode: 'rule' })
      const text = collectText(plan)

      industryStrategies[industryCode].forbiddenTerms.forEach((term) => {
        assert.ok(!text.includes(term), `${industryCode} ${goalCode} should not include ${term}`)
      })
    })
  })
})

test('property: saved plan migration preserves day status fields', () => {
  const legacyPlan = {
    days: Array.from({ length: 15 }, (_, index) => ({
      day: index + 1,
      phase: index < 5 ? '测试期' : index < 10 ? '放大期' : '转化期',
      goal: `day ${index + 1} goal`,
      topicDirection: `day ${index + 1} topic`,
      status: index === 2 ? '已完成' : index === 10 ? '已复盘' : '未开始'
    }))
  }
  const plan = migrateSavedPlan({
    industry: 'education',
    goal: 'leads',
    planVersion: 1,
    diagnosisContext: { weakness: 'retention' },
    plan: legacyPlan
  })
  const days = flattenDays(plan)

  assert.equal(days[2].status, '已完成')
  assert.equal(days[10].status, '已复盘')
  assert.equal(days[14].status, '未开始')
})

test('property: diagnosis entry generates a fresh plan before loading saved plans', async () => {
  const source = await readFile(new URL('../../frontend/src/views/douyin/QuickPlanAgent.vue', import.meta.url), 'utf8')
  const sourceGuardIndex = source.indexOf('if (diagnosisContext.source)')
  const generateIndex = source.indexOf('generate()', sourceGuardIndex)
  const loadSavedIndex = source.indexOf('loadSavedPlan()', sourceGuardIndex)

  assert.ok(sourceGuardIndex > 0)
  assert.ok(generateIndex > sourceGuardIndex)
  assert.ok(loadSavedIndex > generateIndex)
})

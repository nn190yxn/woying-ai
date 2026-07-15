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

export const quickPlanSemanticIndustries = ['restaurant', 'beauty', 'education']
export const quickPlanSemanticGoals = ['traffic', 'conversion', 'leads']

const diagnosisContexts = {
  restaurant: {
    mode: 'group-buy',
    weakness: 'traffic',
    targetAudience: '附近想带朋友聚餐又怕踩雷的顾客',
    coreOffer: '招牌双人套餐',
    offerPrice: '双人餐 128 元，含招牌菜、饮品和晚市核销规则',
    userObjection: '怕分量少、怕排队、怕团购券不能用',
    proofAssets: '后厨出餐、真实分量、桌台翻台、老客评价',
    conversionPath: '点击主页团购券或私信发送套餐关键词',
    painSummary: '播放低、到店核销少、评论问题少',
    metrics: '近 30 天播放 32000，私信 28，核销 9'
  },
  beauty: {
    mode: 'appointment',
    weakness: 'conversion',
    targetAudience: '想做护理又担心被推销的女性顾客',
    coreOffer: '皮肤管理体验卡',
    offerPrice: '体验价 99 元，含检测、护理和到店流程说明',
    userObjection: '怕效果差、怕卫生没保障、怕到店被加价',
    proofAssets: '工具消毒、操作流程、产品资质、顾客反馈',
    conversionPath: '私信发送体验项目并预约到店',
    painSummary: '咨询不少但预约到店少',
    metrics: '近 30 天播放 56000，私信 86，预约 14'
  },
  education: {
    mode: 'leads',
    weakness: 'retention',
    targetAudience: '正在给孩子选课又担心不适应的家长',
    coreOffer: '数学试听课和能力测评',
    offerPrice: '免费测评一次，含年级诊断和课后反馈',
    userObjection: '怕老师不负责、怕孩子听不懂、怕花钱没效果',
    proofAssets: '老师资质、课堂互动、学习成果、家长反馈',
    conversionPath: '私信发送年级和学习问题，预约试听或测评课',
    painSummary: '线索分散、试听预约少、家长信任不足',
    metrics: '近 30 天播放 41000，私信 64，试听 11'
  }
}

const buildSemanticInput = ({ industryCode, goalCode }) => ({
  industryCode,
  goalCode,
  frequency: 5,
  adSupport: goalCode === 'traffic' ? 'no' : 'yes',
  diagnosisContext: {
    ...diagnosisContexts[industryCode],
    industry: industryCode,
    goal: goalCode
  }
})

const flattenPlanDays = (plan) => plan.phases.flatMap((phase) => phase.days)

const createSemanticPlan = ({ industryCode, goalCode }) => {
  const input = buildSemanticInput({ industryCode, goalCode })
  const plan = validateQuickPlanResult(buildQuickPlanFromTemplates(input), input, { generationMode: 'rule' })
  return { input, plan }
}

const collectPlanText = (value) => {
  if (Array.isArray(value)) return value.map((item) => collectPlanText(item)).join('\n')
  if (value && typeof value === 'object') return Object.values(value).map((item) => collectPlanText(item)).join('\n')
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

const assertString = (value, message) => {
  assert.equal(typeof value, 'string', message)
  assert.ok(value.trim().length > 0, message)
}

export const assertQuickPlanProtocol = ({ plan, industryCode, goalCode }) => {
  assertString(plan.title, 'plan.title should be a non-empty string')
  assertString(plan.summary, 'plan.summary should be a non-empty string')
  assert.equal(plan.meta.planVersion, QUICK_PLAN_RESULT_VERSION)
  assert.equal(plan.meta.industryCode, industryCode)
  assert.equal(plan.meta.goalCode, goalCode)
  assertString(plan.meta.inputHash, 'plan.meta.inputHash should be a non-empty string')
  assert.equal(plan.meta.migrated, false)
  assert.ok(Array.isArray(plan.researchBrief), 'plan.researchBrief should be an array')
  assert.ok(plan.researchBrief.length >= 7, 'plan.researchBrief should include core business context')
  assert.ok(Array.isArray(plan.riskBoundary), 'plan.riskBoundary should be an array')
  assert.ok(plan.riskBoundary.length >= 3, 'plan.riskBoundary should include risk guidance')
  assert.equal(plan.phases.length, 3)

  const days = flattenPlanDays(plan)
  assert.equal(days.length, 15)
  assert.deepEqual(days.map((day) => day.day), Array.from({ length: 15 }, (_, index) => index + 1))

  days.forEach((day) => {
    assertString(day.phase, `day ${day.day} phase should be present`)
    assertString(day.goal, `day ${day.day} goal should be present`)
    assertString(day.action, `day ${day.day} action should be present`)
    assert.equal(day.action, day.goal)
    assertString(day.workType, `day ${day.day} workType should be present`)
    assertString(day.videoFunction, `day ${day.day} videoFunction should be present`)
    assertString(day.shootingMethod, `day ${day.day} shootingMethod should be present`)
    assertString(day.topicDirection, `day ${day.day} topicDirection should be present`)
    assertString(day.content, `day ${day.day} content should be present`)
    assert.equal(day.content, day.topicDirection)
    assertString(day.executionTool, `day ${day.day} executionTool should be present`)
    assertString(day.adPlan, `day ${day.day} adPlan should be present`)
    assertString(day.ad, `day ${day.day} ad should be present`)
    assert.equal(day.ad, day.adPlan)
    assertString(day.customerNurture, `day ${day.day} customerNurture should be present`)
    assertString(day.reviewMetrics, `day ${day.day} reviewMetrics should be present`)
    assertString(day.kpi, `day ${day.day} kpi should be present`)
    assert.equal(day.kpi, day.reviewMetrics)
    assertString(day.status, `day ${day.day} status should be present`)

    assert.ok(day.shootingScript && typeof day.shootingScript === 'object', `day ${day.day} shootingScript should be present`)
    assertString(day.shootingScript.hook, `day ${day.day} shootingScript.hook should be present`)
    assert.ok(Array.isArray(day.shootingScript.shots), `day ${day.day} shootingScript.shots should be an array`)
    assert.equal(day.shootingScript.shots.length, 4)
    day.shootingScript.shots.forEach((shot, index) => assertString(shot, `day ${day.day} shot ${index + 1} should be present`))
    assert.ok(Array.isArray(day.shootingScript.talkingPoints), `day ${day.day} talkingPoints should be an array`)
    assert.ok(day.shootingScript.talkingPoints.length >= 3, `day ${day.day} talkingPoints should include planning details`)
    assertString(day.shootingScript.voiceover, `day ${day.day} voiceover should be present`)
    assertString(day.shootingScript.cta, `day ${day.day} cta should be present`)
    assertString(day.shootingScript.duration, `day ${day.day} duration should be present`)
  })
}

const assertTextIncludes = (text, terms, label) => {
  terms.forEach((term) => {
    assert.ok(text.includes(term), `${label} should include ${term}`)
  })
}

const assertTextExcludes = (text, terms, label) => {
  terms.forEach((term) => {
    assert.ok(!text.includes(term), `${label} should not include ${term}`)
  })
}

const normalizeUniqueText = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const assertUniqueValues = ({ values, expectedCount, label }) => {
  const uniqueValues = new Set(values.map((value) => normalizeUniqueText(value)))
  assert.equal(uniqueValues.size, expectedCount, `${label} should include ${expectedCount} unique values`)
}

export const assertQuickPlanScriptUniqueness = ({ plan, label }) => {
  const days = flattenPlanDays(plan)
  assert.equal(days.length, 15)

  assertUniqueValues({
    values: days.map((day) => day.shootingScript.hook),
    expectedCount: 15,
    label: `${label} hooks`
  })
  assertUniqueValues({
    values: days.map((day) => day.shootingScript.shots.join('\n')),
    expectedCount: 15,
    label: `${label} shot groups`
  })
  assertUniqueValues({
    values: days.map((day) => day.shootingScript.cta),
    expectedCount: 15,
    label: `${label} ctas`
  })
}

const quickPlanResearchFields = [
  'coreOffer',
  'offerPrice',
  'userObjection',
  'proofAssets',
  'conversionPath'
]

export const assertQuickPlanResearchCoverage = ({ input, plan, label }) => {
  const context = input.diagnosisContext
  const planText = collectPlanText(plan)
  const researchBriefText = collectPlanText(plan.researchBrief)

  quickPlanResearchFields.forEach((field) => {
    const value = context[field]
    assertString(value, `${label} ${field} should be configured`)
    assert.ok(planText.includes(value), `${label} plan should include ${field}`)
    assert.ok(researchBriefText.includes(value), `${label} researchBrief should include ${field}`)
  })

  plan.phases.forEach((phase) => {
    const phaseText = collectPlanText(phase.days)
    quickPlanResearchFields.forEach((field) => {
      assert.ok(phaseText.includes(context[field]), `${label} ${phase.name} should include ${field}`)
    })
  })
}

quickPlanSemanticIndustries.forEach((industryCode) => {
  quickPlanSemanticGoals.forEach((goalCode) => {
    test(`quick plan semantic protocol: ${industryCode} ${goalCode}`, () => {
      const { plan } = createSemanticPlan({ industryCode, goalCode })

      assertQuickPlanProtocol({ plan, industryCode, goalCode })
    })
  })
})

test('quick plan semantic terms: restaurant conversion', () => {
  const { plan } = createSemanticPlan({ industryCode: 'restaurant', goalCode: 'conversion' })
  const planText = collectPlanText(plan)

  assertTextIncludes(planText, ['团购', '核销', '套餐', '到店'], 'restaurant conversion plan')
})

test('quick plan semantic terms: beauty conversion', () => {
  const { plan } = createSemanticPlan({ industryCode: 'beauty', goalCode: 'conversion' })
  const planText = collectPlanText(plan)

  assertTextIncludes(planText, ['预约', '留资', '体验卡', '到店'], 'beauty conversion plan')
  assertTextExcludes(planText, ['团购', '套餐核销'], 'beauty conversion plan')
})

test('quick plan semantic terms: education leads', () => {
  const { plan } = createSemanticPlan({ industryCode: 'education', goalCode: 'leads' })
  const planText = collectPlanText(plan)

  assertTextIncludes(planText, ['试听', '测评课', '家长反馈', '留资'], 'education leads plan')
})

quickPlanSemanticIndustries.forEach((industryCode) => {
  quickPlanSemanticGoals.forEach((goalCode) => {
    test(`quick plan script uniqueness: ${industryCode} ${goalCode}`, () => {
      const { plan } = createSemanticPlan({ industryCode, goalCode })

      assertQuickPlanScriptUniqueness({ plan, label: `${industryCode} ${goalCode}` })
    })
  })
})

quickPlanSemanticIndustries.forEach((industryCode) => {
  quickPlanSemanticGoals.forEach((goalCode) => {
    test(`quick plan research coverage: ${industryCode} ${goalCode}`, () => {
      const { input, plan } = createSemanticPlan({ industryCode, goalCode })

      assertQuickPlanResearchCoverage({ input, plan, label: `${industryCode} ${goalCode}` })
    })
  })
})

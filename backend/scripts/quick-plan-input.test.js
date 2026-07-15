import assert from 'node:assert/strict'
import test, { after } from 'node:test'

import {
  createQuickPlanInputHash,
  normalizeIndustryCode,
  normalizeQuickPlanInput,
  quickPlanIndustryAliasMap
} from '../src/services/douyin/index.js'

after(() => {
  setImmediate(() => process.exit(process.exitCode || 0))
})

test('normalizes supported industry aliases to strategy codes', () => {
  const cases = [
    ['restaurant', 'restaurant'],
    ['餐饮', 'restaurant'],
    ['餐饮店', 'restaurant'],
    ['beauty', 'beauty'],
    ['美业', 'beauty'],
    ['医美', 'beauty'],
    ['education', 'education'],
    ['教培', 'education'],
    ['service', 'service'],
    ['生活服务', 'service']
  ]

  cases.forEach(([alias, expected]) => {
    assert.equal(normalizeIndustryCode(alias), expected)
  })
})

test('prefers explicit goal code over diagnosis weakness', () => {
  const input = normalizeQuickPlanInput({
    industryCode: '美业',
    goalCode: 'leads',
    diagnosisContext: {
      weakness: 'conversion'
    }
  })

  assert.equal(input.industryCode, 'beauty')
  assert.equal(input.goalCode, 'leads')
  assert.equal(input.diagnosisContext.goal, 'leads')
})

test('derives goal code from diagnosis weakness when goal is missing', () => {
  const cases = [
    ['traffic', 'traffic'],
    ['content', 'traffic'],
    ['conversion', 'conversion'],
    ['retention', 'conversion'],
    ['ads', 'conversion'],
    ['unknown', 'traffic']
  ]

  cases.forEach(([weakness, expectedGoal]) => {
    const input = normalizeQuickPlanInput({
      industryCode: 'education',
      diagnosisContext: { weakness }
    })

    assert.equal(input.goalCode, expectedGoal)
    assert.equal(input.diagnosisContext.goal, expectedGoal)
  })
})

test('fills missing diagnosis context from the selected industry strategy', () => {
  const input = normalizeQuickPlanInput({
    industryCode: '餐饮',
    diagnosisContext: {
      targetAudience: '周边 3 公里家庭客'
    }
  })

  assert.equal(input.diagnosisContext.targetAudience, '周边 3 公里家庭客')
  assert.equal(input.diagnosisContext.coreOffer, '招牌菜或双人套餐')
  assert.equal(input.diagnosisContext.offerPrice, '套餐权益、使用时段、预约规则和核销限制')
  assert.equal(input.diagnosisContext.userObjection, '怕踩雷、怕排队、怕分量少')
  assert.equal(input.diagnosisContext.conversionPath, '点击主页团购券或私信发送套餐关键词')
  assert.deepEqual(input.diagnosisContext.filledFields, [
    'coreOffer',
    'offerPrice',
    'userObjection',
    'proofAssets',
    'conversionPath',
    'painSummary'
  ])
})

test('creates stable input hash for equivalent object key order', () => {
  const first = createQuickPlanInputHash({
    industryCode: '餐饮',
    goalCode: 'conversion',
    diagnosisContext: {
      coreOffer: '双人套餐',
      targetAudience: '周边白领'
    }
  })
  const second = createQuickPlanInputHash({
    goalCode: 'conversion',
    diagnosisContext: {
      targetAudience: '周边白领',
      coreOffer: '双人套餐'
    },
    industryCode: '餐饮'
  })

  assert.equal(first, second)
  assert.match(first, /^[a-f0-9]{16}$/)
})

test('property: every configured industry alias maps to an existing strategy code', () => {
  const supportedIndustryCodes = new Set(['restaurant', 'beauty', 'education', 'service'])

  Object.keys(quickPlanIndustryAliasMap).forEach((alias) => {
    assert.ok(supportedIndustryCodes.has(normalizeIndustryCode(alias)))
  })
})

test('property: normalized inputs produce stable hashes across repeated calls', () => {
  const inputs = [
    { industryCode: '餐饮', goalCode: 'traffic' },
    { industryCode: '医美', diagnosisContext: { weakness: 'conversion' } },
    { industryCode: '教培', diagnosisContext: { weakness: 'retention' } },
    { industryCode: '生活服务', goalCode: 'live', frequency: 3, adSupport: 'yes' }
  ]

  inputs.forEach((input) => {
    const first = createQuickPlanInputHash(input)
    const second = createQuickPlanInputHash(input)

    assert.equal(first, second)
    assert.match(first, /^[a-f0-9]{16}$/)
  })
})

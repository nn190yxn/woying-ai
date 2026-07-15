import crypto from 'crypto'
import { getIndustryStrategy } from './quickPlanStrategies.js'

export const QUICK_PLAN_DEFAULT_INDUSTRY = 'restaurant'
export const QUICK_PLAN_DEFAULT_GOAL = 'traffic'
export const QUICK_PLAN_DEFAULT_MODE = 'group-buy'
export const QUICK_PLAN_DEFAULT_FREQUENCY = 1
export const QUICK_PLAN_DEFAULT_AD_SUPPORT = 'no'

export const quickPlanIndustryAliasMap = {
  restaurant: 'restaurant',
  food: 'restaurant',
  catering: 'restaurant',
  '餐饮': 'restaurant',
  '餐饮店': 'restaurant',
  beauty: 'beauty',
  medical_beauty: 'beauty',
  '美业': 'beauty',
  '美容': 'beauty',
  '医美': 'beauty',
  '美甲': 'beauty',
  '美睫': 'beauty',
  education: 'education',
  edu: 'education',
  training: 'education',
  '教培': 'education',
  '教育': 'education',
  service: 'service',
  local_service: 'service',
  '生活服务': 'service',
  '同城服务': 'service'
}

export const quickPlanGoalOptions = ['traffic', 'conversion', 'leads', 'live']

export const quickPlanWeaknessGoalMap = {
  traffic: 'traffic',
  content: 'traffic',
  conversion: 'conversion',
  retention: 'conversion',
  ads: 'conversion'
}

const normalizeString = (value) => String(value || '').trim()

const quickPlanContextDefaults = {
  targetAudience: 'customerType',
  coreOffer: 'defaultProduct',
  offerPrice: 'defaultOfferPrice',
  userObjection: 'defaultObjection',
  proofAssets: 'proofAssets',
  conversionPath: 'conversionPath',
  painSummary: 'defaultObjection'
}

const normalizeHashValue = (value) => {
  if (Array.isArray(value)) return value.map((item) => normalizeHashValue(item))
  if (!value || typeof value !== 'object') return value
  return Object.keys(value)
    .sort()
    .reduce((normalized, key) => {
      normalized[key] = normalizeHashValue(value[key])
      return normalized
    }, {})
}

export const normalizeIndustryCode = (value) => {
  const raw = normalizeString(value).toLowerCase()
  return quickPlanIndustryAliasMap[raw] || QUICK_PLAN_DEFAULT_INDUSTRY
}

export const normalizeGoalCode = (goal, diagnosisContext = {}) => {
  const raw = normalizeString(goal).toLowerCase()
  if (quickPlanGoalOptions.includes(raw)) return raw
  const weakness = normalizeString(diagnosisContext.weakness).toLowerCase()
  return quickPlanWeaknessGoalMap[weakness] || QUICK_PLAN_DEFAULT_GOAL
}

export const normalizeQuickPlanInput = (input = {}) => {
  const diagnosisContext = input.diagnosisContext && typeof input.diagnosisContext === 'object'
    ? { ...input.diagnosisContext }
    : {}
  const industryCode = normalizeIndustryCode(input.industryCode || input.industry || diagnosisContext.industry)
  const goalCode = normalizeGoalCode(input.goalCode || input.goal, diagnosisContext)
  const industryStrategy = getIndustryStrategy(industryCode)
  const filledFields = []

  Object.entries(quickPlanContextDefaults).forEach(([contextKey, strategyKey]) => {
    if (normalizeString(diagnosisContext[contextKey])) return
    diagnosisContext[contextKey] = industryStrategy[strategyKey]
    filledFields.push(contextKey)
  })

  return {
    industryCode,
    goalCode,
    mode: normalizeString(input.mode || diagnosisContext.mode) || QUICK_PLAN_DEFAULT_MODE,
    frequency: Number(input.frequency || diagnosisContext.frequency) || QUICK_PLAN_DEFAULT_FREQUENCY,
    adSupport: normalizeString(input.adSupport || input.ad_support || diagnosisContext.adSupport) || QUICK_PLAN_DEFAULT_AD_SUPPORT,
    diagnosisContext: {
      ...diagnosisContext,
      industry: industryCode,
      goal: goalCode,
      filledFields
    }
  }
}

export const createQuickPlanInputHash = (input = {}) => {
  const normalized = normalizeHashValue(normalizeQuickPlanInput(input))
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 16)
}

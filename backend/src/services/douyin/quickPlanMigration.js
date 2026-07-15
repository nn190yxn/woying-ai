import {
  QUICK_PLAN_RESULT_VERSION,
  validateQuickPlanResult
} from './quickPlanGenerator.js'

const parseStoredValue = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const collectDays = (plan = {}) => {
  if (Array.isArray(plan.days)) return plan.days.filter((day) => day && typeof day === 'object')
  if (!Array.isArray(plan.phases)) return []
  return plan.phases.flatMap((phase) => Array.isArray(phase?.days) ? phase.days : [])
    .filter((day) => day && typeof day === 'object')
}

const collectStatuses = (plan = {}) => {
  const statuses = new Map()
  collectDays(plan).forEach((day, index) => {
    const dayNumber = Number(day.day || index + 1)
    if (dayNumber && day.status) statuses.set(dayNumber, day.status)
  })
  return statuses
}

const restoreStatuses = (plan, statuses) => {
  if (!statuses.size) return plan
  plan.phases?.forEach((phase) => {
    phase.days?.forEach((day) => {
      const status = statuses.get(Number(day.day))
      if (status) day.status = status
    })
  })
  return plan
}

const hasCompleteScript = (day) => {
  const script = day?.shootingScript
  return script && typeof script === 'object' && Array.isArray(script.shots) && script.shots.length >= 4
}

const hasStandardPlanShape = (plan = {}) => {
  const days = collectDays(plan)
  return Array.isArray(plan.researchBrief) && plan.researchBrief.length > 0 &&
    Array.isArray(plan.riskBoundary) && plan.riskBoundary.length > 0 &&
    Array.isArray(plan.phases) && plan.phases.length === 3 &&
    days.length === 15 && days.every(hasCompleteScript) &&
    Number(plan.meta?.planVersion) >= QUICK_PLAN_RESULT_VERSION
}

const normalizeLegacyPlanShape = (plan) => {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan.phases) || !Array.isArray(plan.days)) return plan
  const phaseRanges = [
    { name: '测试期', start: 0, end: 5 },
    { name: '放大期', start: 5, end: 10 },
    { name: '转化期', start: 10, end: 15 }
  ]

  return {
    ...plan,
    phases: phaseRanges.map((phase) => {
      const days = plan.days.slice(phase.start, phase.end)
      return {
        name: days[0]?.phase || phase.name,
        days
      }
    })
  }
}

const buildMigrationInput = (row = {}) => ({
  industry: row.industry || row.industryCode || row.plan?.meta?.industryCode,
  goal: row.goal || row.goalCode || row.plan?.meta?.goalCode,
  frequency: row.frequency,
  adSupport: row.adSupport || row.ad_support,
  diagnosisContext: parseStoredValue(row.diagnosisContext ?? row.diagnosis_context, {})
})

export const migrateSavedPlan = (row = {}) => {
  const sourcePlan = parseStoredValue(row.plan, null)
  const plan = normalizeLegacyPlanShape(sourcePlan && typeof sourcePlan === 'object' ? sourcePlan : null)
  const statuses = collectStatuses(plan || {})
  const storedVersion = Number(row.planVersion ?? row.plan_version ?? plan?.meta?.planVersion ?? 1)
  const migrated = !hasStandardPlanShape(plan || {}) || storedVersion < QUICK_PLAN_RESULT_VERSION
  const planForValidation = plan
    ? {
        ...plan,
        meta: {
          ...(plan.meta && typeof plan.meta === 'object' ? plan.meta : {}),
          migrated
        }
      }
    : null
  const normalized = validateQuickPlanResult(planForValidation, buildMigrationInput(row), {
    generationMode: plan?.meta?.generationMode || 'saved'
  })

  normalized.meta = {
    ...normalized.meta,
    planVersion: QUICK_PLAN_RESULT_VERSION,
    migrated
  }

  return restoreStatuses(normalized, statuses)
}

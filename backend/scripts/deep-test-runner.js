import fs from 'fs'
import { pathToFileURL } from 'url'
import { CALCULATORS } from '../src/services/calculatorEngine.js'
import { normalizeToolPayload } from '../src/services/toolPayloadNormalizer.js'

try {
  const dotenv = await import('dotenv')
  dotenv.default.config(process.env.DOTENV_CONFIG_PATH ? { path: process.env.DOTENV_CONFIG_PATH } : undefined)
} catch {
  // Listing test cases does not require local runtime dependencies.
}

const args = process.argv.slice(2)
const base = process.env.BASE_URL || 'http://127.0.0.1:3000'
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 60000)
const testFile = process.env.TEST_FILE || './scripts/test-payloads.json'
const reportFile = process.env.REPORT_FILE || ''

function readArg(name) {
  const prefix = `${name}=`
  const match = args.find(arg => arg.startsWith(prefix))
  if (match) return match.slice(prefix.length)
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : ''
}

const filters = {
  group: readArg('--group'),
  code: readArg('--code'),
  endpointPrefix: readArg('--endpointPrefix')
}
const listOnly = args.includes('--list')
let token = process.env.TOKEN || ''

function sampleValueForInput(input, code) {
  const samples = {
    industry: 'restaurant',
    storeName: '样板餐饮门店',
    storeType: code.includes('beauty') ? 'community' : 'normal',
    cityLevel: 'tier2',
    isFranchise: false,
    beautyType: 'skin-care',
    goal: '提升到店转化',
    period: '30天',
    periodLabel: '近30天',
    mealPeriod: '全天',
    drinkName: '招牌柠檬茶',
    dishName: '招牌牛肉饭',
    campaignName: '端午到店转化活动',
    totalInvestment: 120000,
    totalRevenue: 260000,
    monthlyProfit: 18000,
    rent: 18000,
    salary: 42000,
    depreciation: 6000,
    otherFixed: 8000,
    dineInPct: 70,
    dineInVarCost: 35,
    deliveryPct: 30,
    deliveryArrivalRate: 78,
    deliveryVarCost: 42,
    area: 120,
    seats: 48,
    hours: 10,
    avgTicket: 68,
    actualRevenue: 220000,
    targetProfit: 30000,
    franchiseFee: 0,
    deposit: 20000,
    renovationPerSqm: 1200,
    equipmentCost: 90000,
    initialMaterial: 15000,
    rentMonthly: 18000,
    rentDepositMonths: 2,
    licenseCost: 8000,
    marketingBudget: 12000,
    reserveMonths: 3,
    otherCost: 10000,
    rawWeight: 100,
    netWeight: 78,
    purchasePrice: 8,
    wasteSellable: true,
    wastePrice: 1.5,
    totalCustomers: 1800,
    tableCount: 45,
    dailyCups: 650,
    operatingHours: 11,
    staffCount: 6,
    peakHours: 3,
    peakCups: 260,
    monthlyRevenue: 220000,
    employeeCount: 12,
    totalSalary: 52000,
    revenue: 220000,
    price: 38,
    platformFee: 8,
    packageCost: 2,
    foodCost: 12,
    deliverySubsidy: 3,
    monthlyOrders: 1800,
    avgOrderValue: 68,
    platformFeeRate: 18,
    foodCostRate: 35,
    packageCostPerOrder: 2,
    deliverySubsidyPerOrder: 3,
    monthlyMarketing: 12000,
    monthlyFixed: 45000,
    repeatRate: 28,
    dineInRevenue: 150000,
    dineInMargin: 62,
    currentCash: 180000,
    baseSalary: 38000,
    utilities: 6000,
    marketingRate: 8,
    months: 6,
    upcomingExpenses: 20000,
    memberPrepay: 30000,
    investment: 50000,
    return: 85000,
    expiredStudents: 120,
    renewedStudents: 82,
    renewalWindowDays: 30,
    avgTuition: 6800,
    newStudents: 36,
    totalStudents: 220,
    totalPurchased: 3200,
    consumed: 2280,
    scheduledHours: 420,
    attendanceRate: 86,
    courseFee: 6800,
    teacherCost: 1800,
    venueCost: 700,
    materialCost: 300,
    fixedCost: 90000,
    coursePrice: 6800,
    costPerStudent: 1800,
    teacherCount: 8,
    totalHours: 720,
    bookedHours: 520,
    rooms: 6,
    totalMarketingCost: 36000,
    initialCash: 160000,
    monthlyCost: 120000,
    totalClasses: 2400,
    consumedClasses: 1720,
    totalCards: 380,
    consumedCards: 248,
    avgCardValue: 2800,
    totalCustomers: 650,
    scheduledAppointments: 420,
    showUpRate: 82,
    servicePrice: 680,
    productCost: 120,
    laborCost: 160,
    avgRevenue: 680,
    avgCostRate: 42,
    visitors: 1200,
    converted: 210,
    trialVisitors: 360,
    trialConverted: 98,
    newVisitors: 420,
    newConverted: 86,
    repurchasedCustomers: 260,
    periodDays: 90,
    serviceCycleDays: 30,
    dormantCustomers: 80,
    purchaseFrequency: 2.2,
    customerLifespan: 18,
    cac: 180,
    serviceGrossMargin: 68,
    retentionCost: 25,
    overheadCost: 80,
    avgInventory: 42000,
    costOfGoods: 180000,
    dishPrice: 38,
    dishCost: 14,
    dishSales: 680,
    totalSales: 6200,
    totalDishes: 38,
    repeatCustomers: 260,
    avgRepeatInterval: 18,
    newCustomerCost: 68,
    bedCount: 8,
    periodStartDebt: 520000,
    monthSales: 180000,
    monthConsumption: 135000,
    monthRefund: 8000,
    experienceCount: 180,
    retainedCount: 92,
    repurchasedCount: 58,
    fixedSalary: 48000,
    productRate: 18,
    laborCommissionRate: 22,
    platformRate: 6,
    deviceCost: 260000,
    deviceLifespan: 36,
    costPerSession: 180,
    operatorCommissionRate: 18,
    pricePerSession: 880,
    sessionsPerMonth: 80,
    rechargeAmount: 3000,
    giftAmount: 600,
    marginRate: 65,
    totalCost: 18000,
    days: 7,
    orders: 280,
    grossMargin: 62,
    oldCustomers: 600,
    newCustomers: 80,
    rewardCost: 4800,
    newRevenue: 56000,
    otherCAC: 160,
    startCustomers: 800,
    endActive: 620,
    dormantDays: 60,
    churned: 90,
    avgOrder: 78,
    freq: 2.5,
    frequency: 2.5,
    retentionMonths: 10,
    normalPrice: 128,
    normalMargin: 62,
    discount: 0.82,
    promoOrders: 420,
    normalOrders: 220,
    hourlyFee: 180,
    monthlyHours: 12,
    extraIncomePct: 12
  }

  if (input === 'categories') return [{ name: '炒菜', revenue: 90000, cost: 32000 }, { name: '饮品', revenue: 36000, cost: 9800 }]
  if (input === 'ingredients') return [{ name: '茶底', amount: 180, unit: 'ml', packageWeight: 1000, packageUnit: 'ml', packagePrice: 18 }, { name: '柠檬', amount: 60, unit: 'g', packageWeight: 500, packageUnit: 'g', packagePrice: 12 }]
  if (input === 'dishes') return [{ name: '招牌牛肉饭', cost: 14, role: 'main', pricingMethod: 'margin', targetMargin: 62 }, { name: '柠檬茶', cost: 4, role: 'image', pricingMethod: 'margin', targetMargin: 72 }]
  if (['front', 'back', 'mgmt', 'beauticians', 'consultants', 'managers', 'receptions'].includes(input)) return [{ role: input, count: 2, salary: 6500, commission: 1200 }]
  if (input === 'projects') return [{ name: '补水护理', price: 398, cost: 80, count: 220, type: 'traffic' }, { name: '抗衰项目', price: 1280, cost: 260, count: 80, type: 'profit' }]
  if (input === 'channels') return [{ name: '抖音', cost: 12000, leads: 220, converted: 46, enabled: true, cac: 260, weight: 40 }, { name: '转介绍', cost: 5000, leads: 120, converted: 38, enabled: true, cac: 132, weight: 30 }]
  if (input === 'stages') return [{ name: '线索', count: 1000 }, { name: '到店', count: 320 }, { name: '成交', count: 96 }, { name: '复购', count: 42 }]
  return samples[input] ?? 100
}

function groupForCalculator(code) {
  if (code.includes('education')) return 'G'
  if (code.includes('beauty')) return 'H'
  if (['channel-cac', 'campaign-roi', 'referral-roi', 'conversion-funnel', 'retention-rate', 'marketing-budget', 'churn-rate', 'ltv-restaurant', 'ltv-education', 'promotion-profit'].includes(code)) return 'I'
  if (code.includes('restaurant') || ['investment-budget', 'food-yield-rate', 'turnover-rate-restaurant', 'cup-efficiency', 'drink-cost', 'dish-pricing', 'food-waste-rate', 'delivery-profit', 'delivery-analysis', 'inventory-turnover', 'dish-contribution', 'repurchase-rate'].includes(code)) return 'E-F'
  return 'C'
}

function buildCalculatorTests() {
  return Object.entries(CALCULATORS)
    .filter(([, definition]) => definition && typeof definition.calc === 'function')
    .map(([code, definition]) => ({
      code,
      name: definition.name || code,
      group: groupForCalculator(code),
      endpoint: `/api/generate/${code}`,
      expectedShape: 'unified-calculator-result',
      payload: Object.fromEntries((definition.inputs || []).map(input => [input, sampleValueForInput(input, code)]))
    }))
}

function normalizeTestConfig(raw) {
  if (Array.isArray(raw)) return raw
  const tests = Array.isArray(raw.tests) ? raw.tests : []
  const generated = raw.generateCalculators === false ? [] : buildCalculatorTests()
  return [...tests, ...generated]
}

function applyFilters(tests) {
  return tests.filter(test => {
    if (filters.group && test.group !== filters.group) return false
    if (filters.code && test.code !== filters.code) return false
    if (filters.endpointPrefix && !test.endpoint.startsWith(filters.endpointPrefix)) return false
    return true
  })
}

const SKIP_INPUT_VALIDATION_PREFIXES = ['/api/xhs/', '/api/douyin/', '/api/private/']

function validateInputProtocol(endpoint, payload) {
  if (SKIP_INPUT_VALIDATION_PREFIXES.some(prefix => endpoint.startsWith(prefix))) return null
  if (!endpoint.startsWith('/api/generate/')) return null

  const toolCode = endpoint.replace('/api/generate/', '')
  const calcDef = CALCULATORS[toolCode]
  if (!calcDef || !calcDef.inputs || typeof calcDef.calc !== 'function') return null

  const normalizedPayload = normalizeToolPayload(toolCode, payload)

  const missing = calcDef.inputs.filter(key => normalizedPayload[key] === undefined || normalizedPayload[key] === null)
  if (missing.length > 0) {
    return { matched: false, missingFields: missing }
  }
  return { matched: true, missingFields: [] }
}

function scoreDimension(value, criteria) {
  if (criteria.type === 'presence') return value ? 2 : 0
  if (criteria.type === 'count') {
    if (!value || value.length === 0) return 0
    return value.length >= criteria.threshold ? 2 : 1
  }
  if (criteria.type === 'boolean') return value === true ? 2 : 0
  if (criteria.type === 'depth') {
    if (!value || value.length === 0) return 0
    const hasDeep = value.some(s => (s.items && s.items.length >= 3) || s.subsections)
    return hasDeep ? 2 : 1
  }
  return 0
}

function detectStructureCompat(data) {
  const hasUnifiedLayer = data.status && data.degraded !== undefined && data.meta
  if (!hasUnifiedLayer) return false

  const innerResult = data.result
  if (!innerResult || typeof innerResult !== 'object') return false

  const domainFields = [
    'radar',
    'radarData',
    'phases',
    'recommendedTiers',
    'totalScore',
    'diagnosis',
    'suggestions',
    'products',
    'topics',
    'script',
    'analysis',
    'upgradePath',
    'retentionCalendar',
    'implementationTimeline',
    'planName',
    'weeklyPlan',
    'tips',
    'strategies',
    'nextActions',
    'metrics',
    'recommendedKeywords',
    'tagStrategy',
    'seoTips',
    'optimizationPoints',
    'competitors',
    'opportunities',
    'threats',
    'angles',
    'ctaTemplates',
    'costEstimate',
    'positioning',
    'consistencyScore',
    'budgetAllocation',
    'targeting',
    'bidStrategy',
    'persona',
    'contentMatrix',
    'isWorthInvesting',
    'screeningResult',
    'benchmark',
    'expectedClicks',
    'expectedConversions',
    'cpa',
    'recommendation',
    'funnel',
    'checklist',
    'ipName',
    'slogan',
    'tags',
    'pillars',
    'recommendedModel',
    'allModels',
    'referralRewards',
    'implementationSteps',
    'scriptSnippets',
    'dailySchedule',
    'weeklyEvents',
    'contentRatio',
    'engagementTargets',
    'weeklyReportTemplate',
    'redLines',
    'sopReference'
  ]
  return domainFields.some(key => innerResult[key] !== undefined)
}

function detectDomainPayloadSignals(test, result, innerResult) {
  const target = innerResult || result
  if (!target || typeof target !== 'object') return false

  const legacyAgentRoute = /^\/api\/(xhs|douyin|private)\//.test(test.endpoint || '')
  const hasLegacyDomainPayload = legacyAgentRoute
    && ['agent', 'status', 'result', 'upgradeHint'].some(key => result?.[key] !== undefined)
    && Object.keys(target).length >= 2

  return Boolean(
    target.radar
    || target.radarData
    || target.totalScore !== undefined
    || target.diagnosis
    || target.suggestions
    || (Array.isArray(target.phases) && target.phases.length > 0)
    || (Array.isArray(target.products) && target.products.length > 0)
    || (Array.isArray(target.topics) && target.topics.length > 0)
    || target.script
    || target.analysis
    || target.upgradePath
    || (Array.isArray(target.recommendedTiers) && target.recommendedTiers.length > 0)
    || (Array.isArray(target.retentionCalendar) && target.retentionCalendar.length > 0)
    || (Array.isArray(target.implementationTimeline) && target.implementationTimeline.length > 0)
    || target.planName
    || (Array.isArray(target.weeklyPlan) && target.weeklyPlan.length > 0)
    || (Array.isArray(target.tips) && target.tips.length > 0)
    || (Array.isArray(target.strategies) && target.strategies.length > 0)
    || (Array.isArray(target.nextActions) && target.nextActions.length > 0)
    || target.metrics
    || (Array.isArray(target.recommendedKeywords) && target.recommendedKeywords.length > 0)
    || (Array.isArray(target.tagStrategy) && target.tagStrategy.length > 0)
    || (Array.isArray(target.seoTips) && target.seoTips.length > 0)
    || target.optimizationPoints
    || target.competitors
    || (Array.isArray(target.opportunities) && target.opportunities.length > 0)
    || (Array.isArray(target.threats) && target.threats.length > 0)
    || (Array.isArray(target.angles) && target.angles.length > 0)
    || (Array.isArray(target.ctaTemplates) && target.ctaTemplates.length > 0)
    || target.costEstimate
    || target.positioning
    || target.consistencyScore !== undefined
    || target.budgetAllocation
    || target.targeting
    || target.bidStrategy
    || target.persona
    || (Array.isArray(target.contentMatrix) && target.contentMatrix.length > 0)
    || target.isWorthInvesting !== undefined
    || target.screeningResult
    || target.benchmark
    || target.expectedClicks !== undefined
    || target.expectedConversions !== undefined
    || target.cpa
    || target.recommendation
    || (Array.isArray(target.funnel) && target.funnel.length > 0)
    || (Array.isArray(target.checklist) && target.checklist.length > 0)
    || target.ipName
    || target.slogan
    || (Array.isArray(target.tags) && target.tags.length > 0)
    || (Array.isArray(target.pillars) && target.pillars.length > 0)
    || target.recommendedModel
    || (Array.isArray(target.allModels) && target.allModels.length > 0)
    || target.referralRewards
    || (Array.isArray(target.implementationSteps) && target.implementationSteps.length > 0)
    || target.scriptSnippets
    || (Array.isArray(target.dailySchedule) && target.dailySchedule.length > 0)
    || (Array.isArray(target.weeklyEvents) && target.weeklyEvents.length > 0)
    || target.contentRatio
    || target.engagementTargets
    || target.weeklyReportTemplate
    || (Array.isArray(target.redLines) && target.redLines.length > 0)
    || target.sopReference
    || hasLegacyDomainPayload
  )
}

function detectTermQuality(test, data) {
  const text = JSON.stringify(data)
  const terms = test.industryTerms || []
  if (!terms.length) return null
  const hits = terms.filter(term => text.includes(term))
  return { hits, total: terms.length, passed: hits.length >= Math.min(2, terms.length) }
}

function detectFlowHealth(data, result) {
  return Boolean(data.status || result.sections || result.actions || result.summary || data.summary)
}

async function runTest(test) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }

  const inputValidation = validateInputProtocol(test.endpoint, test.payload)
  if (inputValidation && !inputValidation.matched) {
    return {
      code: test.code,
      http: 0,
      degraded: null,
      scores: null,
      totalScore: 0,
      status: 'INPUT_MISMATCH',
      missingFields: inputValidation.missingFields,
      inputMatched: false,
      error: `缺少必要字段: ${inputValidation.missingFields.join(', ')}`
    }
  }

  try {
    const r = await fetch(`${base}${test.endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(test.payload),
      signal: AbortSignal.timeout(timeoutMs)
    })
    const data = await r.json()
    if (!r.ok) {
      return { code: test.code, http: r.status, degraded: null, scores: null, totalScore: 0, status: 'FAIL', error: data.error || data.message || 'http error' }
    }

    const degraded = data.degraded === true || data.status === 'fallback' || data.isFallback === true
    const structureCompat = detectStructureCompat(data)

    const result = data.result || data
    const innerResult = data.result || null

    const sections = result.sections || (innerResult?.suggestions ? [{ title: '建议', items: innerResult.suggestions }] : null)
    const actions = result.actions || (innerResult?.suggestions ? innerResult.suggestions.map(s => ({ title: s })) : null)
    const riskNotes = result.riskNotes || []
    const kbEnhanced = result.meta?.kbEnhanced || result.meta?.extra?.kbEnhanced || data.meta?.kbEnhanced || false
    const cta = result.customizationCTA || result.meta?.customizationCTA || data.meta?.customizationCTA || false
    const hasDomainSignals = detectDomainPayloadSignals(test, result, innerResult)
    const termQuality = detectTermQuality(test, data)
    const flowHealth = detectFlowHealth(data, result)
    const textualSummary = data.summary || data.title || result.summary || result.content || result.text || ''
    const hasFailureText = String(textualSummary).includes('生成失败') || String(textualSummary).includes('失败')
    const benchmarks = result.benchmarks || result.dimensionRank || result.scores || innerResult?.radar || innerResult?.radarData || innerResult?.totalScore || hasDomainSignals

    const structureDepthScore = structureCompat && innerResult
      ? 2
      : hasDomainSignals
        ? 2
        : scoreDimension(sections, { type: 'depth' })

    const dimensions = {
      benchmarks: scoreDimension(benchmarks, { type: 'presence' }),
      actions: scoreDimension(actions, { type: 'count', threshold: 3 }),
      riskNotes: scoreDimension(riskNotes, { type: 'count', threshold: 2 }),
      kbEnhanced: scoreDimension(kbEnhanced, { type: 'boolean' }),
      structureDepth: structureDepthScore,
      cta: scoreDimension(cta, { type: 'presence' })
    }
    const totalScore = Object.values(dimensions).reduce((a, b) => a + b, 0)

    let status
    if (hasFailureText) {
      status = 'FAIL'
    } else if (degraded) {
      status = 'DEGRADED'
    } else if (totalScore >= 8 || hasDomainSignals || String(textualSummary).trim().length >= 12) {
      status = 'PASS'
    } else {
      status = 'FAIL'
    }

    return {
      code: test.code,
      http: r.status,
      degraded,
      structureCompat,
      engineType: data.meta?.engineType || data.engineType || data.meta?.fallbackType || 'n/a',
      summary: String(textualSummary).slice(0, 80),
      hasSections: Boolean(data.sections && data.sections.length > 0),
      sectionsCount: data.sections?.length || 0,
      hasActions: Boolean(data.actions && data.actions.length > 0),
      actionsCount: data.actions?.length || 0,
      hasRiskNotes: Boolean(data.riskNotes && data.riskNotes.length > 0),
      riskNotesCount: data.riskNotes?.length || 0,
      hasBenchmarks: Boolean(data.benchmarks || data.dimensionRank || data.scores || innerResult?.radar || innerResult?.radarData || innerResult?.totalScore || hasDomainSignals),
      kbEnhanced: data.meta?.kbEnhanced || data.meta?.extra?.kbEnhanced || false,
      kbFiles: data.meta?.kbFilesUsed || data.meta?.extra?.kbFilesUsed || [],
      hasCta: Boolean(data.customizationCTA || data.meta?.customizationCTA),
      hasDomainSignals,
      flowHealth,
      termQuality,
      shapeCompat: structureCompat || hasDomainSignals,
      dimensions,
      totalScore,
      status,
      ...(inputValidation ? { inputMatched: inputValidation.matched } : {})
    }
  } catch (e) {
    return { code: test.code, http: 0, degraded: null, scores: null, totalScore: 0, status: 'FAIL', error: e.message }
  }
}

async function main() {
  const tests = applyFilters(normalizeTestConfig(JSON.parse(fs.readFileSync(testFile, 'utf8'))))

  if (listOnly) {
    for (const test of tests) {
      console.log(`${test.group || '-'}\t${test.code}\t${test.endpoint}`)
    }
    console.log(`total=${tests.length}`)
    return
  }

  if (!token) {
    if (!process.env.JWT_SECRET) {
      console.error('TOKEN or JWT_SECRET is required to run deep tests. Use --list to inspect test cases without credentials.')
      process.exitCode = 1
      return
    }
    const { default: jwt } = await import('jsonwebtoken')
    token = jwt.sign(
      {
        userId: Number(process.env.TEST_USER_ID || 1),
        memberLevel: process.env.TEST_MEMBER_LEVEL || 'annual'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
  }

  console.log(`baseUrl=${base} timeoutMs=${timeoutMs} tests=${tests.length}`)

  const results = []
  for (const test of tests) {
    const result = await runTest(test)
    results.push(result)
    const compatTag = result.structureCompat ? ' STRUCTURE_COMPAT' : ''
    const missingTag = result.missingFields ? ` missing=${result.missingFields.join(',')}` : ''
    console.log(`[${result.status}] ${result.code} http=${result.http} degraded=${result.degraded} score=${result.totalScore}${compatTag}${missingTag} engine=${result.engineType} summary=${result.summary || result.error || 'n/a'}`)
  }

  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const mismatchCount = results.filter(r => r.status === 'INPUT_MISMATCH').length
  const degradedCount = results.filter(r => r.status === 'DEGRADED').length
  const compatCount = results.filter(r => r.structureCompat).length
  const scoredResults = results.filter(r => r.status !== 'INPUT_MISMATCH')
  const avgScore = scoredResults.length > 0 ? scoredResults.reduce((a, r) => a + r.totalScore, 0) / scoredResults.length : 0

  console.log(`\nSummary: ${passCount} PASS, ${failCount} FAIL, ${mismatchCount} INPUT_MISMATCH, ${degradedCount} DEGRADED, ${compatCount} STRUCTURE_COMPAT, avgScore=${avgScore.toFixed(1)}`)

  if (failCount > 0) {
    console.log('Failed tools:')
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  ${r.code}: score=${r.totalScore} error=${r.error || 'low score'}`)
    }
  }

  if (mismatchCount > 0) {
    console.log('Input mismatch tools:')
    for (const r of results.filter(r => r.status === 'INPUT_MISMATCH')) {
      console.log(`  ${r.code}: missing=${r.missingFields.join(',')}`)
    }
  }

  if (reportFile) {
    const lines = [
      '# 全量工具深测执行报告',
      '',
      `- baseUrl: ${base}`,
      `- timeoutMs: ${timeoutMs}`,
      `- tests: ${tests.length}`,
      `- summary: ${passCount} PASS, ${failCount} FAIL, ${mismatchCount} INPUT_MISMATCH, ${degradedCount} DEGRADED, ${compatCount} STRUCTURE_COMPAT, avgScore=${avgScore.toFixed(1)}`,
      '',
      '| 分组 | 工具 | 端点 | HTTP | degraded | engineType | 得分 | 状态 | 摘要 |',
      '|---|---|---|---|---|---|---|---|---|'
    ]
    for (const result of results) {
      const test = tests.find(item => item.code === result.code) || {}
      const summary = String(result.summary || result.error || '').replace(/\|/g, '/')
      lines.push(`| ${test.group || ''} | ${result.code} | ${test.endpoint || ''} | ${result.http} | ${result.degraded} | ${result.engineType || ''} | ${result.totalScore} | ${result.status} | ${summary} |`)
    }
    fs.writeFileSync(reportFile, `${lines.join('\n')}\n`)
    console.log(`report=${reportFile}`)
  }

  if (failCount > 0 || mismatchCount > 0 || degradedCount > 0) process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
  process.exit(process.exitCode || 0)
}

export {
  applyFilters,
  buildCalculatorTests,
  detectDomainPayloadSignals,
  detectFlowHealth,
  detectStructureCompat,
  detectTermQuality,
  normalizeTestConfig,
  scoreDimension,
  validateInputProtocol
}

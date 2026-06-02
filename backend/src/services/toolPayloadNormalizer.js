function ensureArray(value) {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []
  return [value]
}

function toNumberOr(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function normalizeToolPayload(toolCode, formData) {
  const normalized = { ...(formData || {}) }

  if (!normalized.industry) {
    normalized.industry = 'catering'
  }

  if (toolCode === 'friend') {
    return {
      ...normalized,
      scene: normalized.scene || '当前业务',
      highlight: normalized.highlight || '核心卖点',
      type: normalized.type || 'product',
      tone: normalized.tone || 'natural'
    }
  }

  if (toolCode === 'topic') {
    return {
      ...normalized,
      goals: ensureArray(normalized.goals),
      contentTypes: ensureArray(normalized.contentTypes),
      scenes: ensureArray(normalized.scenes),
      platforms: ensureArray(normalized.platforms),
      count: Number(normalized.count) || 10
    }
  }

  if (toolCode === 'festival') {
    return {
      ...normalized,
      goal: normalized.goal || 'promote',
      contentType: normalized.contentType || 'poster'
    }
  }

  if (toolCode === 'fission') {
    const budgetMap = {
      low: 500,
      mid: 2000,
      high: 5000,
      vip: 8000
    }
    if (typeof normalized.budget === 'string' && budgetMap[normalized.budget] !== undefined) {
      normalized.budget = budgetMap[normalized.budget]
    }
    return {
      ...normalized,
      customerScale: normalized.customerScale || '未知',
      channel: normalized.channel || 'mixed',
      priceRange: normalized.priceRange || 'mid',
      budget: normalized.budget || 2000
    }
  }

  if (toolCode === 'marketing-plan') {
    return {
      ...normalized,
      goal: normalized.goal || '提升销售额',
      budget: normalized.budget || '5000',
      duration: normalized.duration || normalized.period || '1周'
    }
  }

  if (toolCode === 'meituan') {
    const monthlyOrders = Number(normalized.monthlyOrders) || 0
    const monthlySales = Number(normalized.monthlySales) || 0
    const avgOrderValue = monthlyOrders > 0
      ? monthlySales / monthlyOrders
      : Number(normalized.avgOrderValue) || 0

    return {
      ...normalized,
      industry: normalized.industry || 'restaurant',
      monthlyOrders,
      monthlySales,
      avgOrderValue,
      platformRate: Number(normalized.platformRate ?? normalized.platformFeeRate) || 0,
      platformFeeRate: Number(normalized.platformFeeRate ?? normalized.platformRate) || 0,
      repurchaseRate: Number(normalized.repurchaseRate ?? normalized.repeatRate) || 0,
      repeatRate: Number(normalized.repeatRate ?? normalized.repurchaseRate) || 0,
      reviewScore: Number(normalized.reviewScore) || 4.5,
      issues: ensureArray(normalized.issues)
    }
  }

  if (toolCode === 'retention-rate') {
    const period = String(normalized.period || '30')
    const retainedMap = {
      '30': normalized.customers30,
      '60': normalized.customers60,
      '90': normalized.customers90
    }

    return {
      ...normalized,
      period,
      startCustomers: toNumberOr(normalized.startCustomers ?? normalized.totalCustomers),
      newCustomers: toNumberOr(normalized.newCustomers),
      endActive: toNumberOr(normalized.endActive ?? retainedMap[period] ?? normalized.currentActive),
      dormantDays: toNumberOr(normalized.dormantDays ?? normalized.avgVisitInterval ?? period, 30)
    }
  }

  if (toolCode === 'marketing-budget') {
    const industryDefaultChannels = {
      restaurant: [
        { key: 'douyin', enabled: true, cac: 200 },
        { key: 'meituan', enabled: true, cac: 150 },
        { key: 'referral', enabled: true, cac: 50 }
      ],
      education: [
        { key: 'douyin', enabled: true, cac: 300 },
        { key: 'community', enabled: true, cac: 120 },
        { key: 'referral', enabled: true, cac: 80 }
      ],
      beauty: [
        { key: 'douyin', enabled: true, cac: 180 },
        { key: 'community', enabled: true, cac: 60 },
        { key: 'referral', enabled: true, cac: 40 }
      ],
      service: [
        { key: 'douyin', enabled: true, cac: 220 },
        { key: 'offline', enabled: true, cac: 100 },
        { key: 'referral', enabled: true, cac: 60 }
      ]
    }
    const industryKey = normalized.industry === 'catering' ? 'restaurant' : normalized.industry
    const inferredChannels = industryDefaultChannels[industryKey] || industryDefaultChannels.restaurant

    return {
      ...normalized,
      totalBudget: toNumberOr(normalized.totalBudget ?? normalized.budget ?? normalized.budgetAmount),
      goal: normalized.goal || normalized.marketingGoal || 'balanced',
      channels: Array.isArray(normalized.channels) && normalized.channels.length > 0
        ? normalized.channels
        : inferredChannels
    }
  }

  if (toolCode === 'churn-rate') {
    const startCustomers = toNumberOr(normalized.startCustomers ?? normalized.totalCustomers)
    const endCustomers = toNumberOr(normalized.endCustomers)
    const newCustomers = toNumberOr(normalized.newCustomers)
    const inferredChurned = startCustomers > 0 && endCustomers > 0
      ? Math.max(0, startCustomers + newCustomers - endCustomers)
      : 0

    return {
      ...normalized,
      startCustomers,
      churned: toNumberOr(normalized.churned ?? normalized.lostCustomers, inferredChurned),
      avgOrder: toNumberOr(normalized.avgOrder ?? normalized.avgOrderValue ?? normalized.avgLtv),
      freq: toNumberOr(normalized.freq ?? normalized.frequency, 1)
    }
  }

  if (toolCode === 'ltv-education') {
    const hourlyFee = toNumberOr(normalized.hourlyFee ?? normalized.courseFee ?? normalized.avgCoursePrice)
    const monthlyHours = toNumberOr(normalized.monthlyHours ?? normalized.studentFrequency, 1)
    const retentionMonths = toNumberOr(normalized.retentionMonths ?? normalized.monthsEnrolled)
    const materialFee = toNumberOr(normalized.materialFee)
    const examFee = toNumberOr(normalized.examFee)
    const baseMonthlyRevenue = hourlyFee * monthlyHours
    const extraIncomePct = normalized.extraIncomePct != null
      ? toNumberOr(normalized.extraIncomePct)
      : (baseMonthlyRevenue > 0 ? ((materialFee + examFee) / baseMonthlyRevenue) * 100 : 0)

    return {
      ...normalized,
      hourlyFee,
      monthlyHours,
      retentionMonths,
      extraIncomePct,
      cac: toNumberOr(normalized.cac)
    }
  }

  if (toolCode === 'promotion-profit') {
    const originalPrice = toNumberOr(normalized.originalPrice)
    const discountPrice = toNumberOr(normalized.discountPrice)
    const dailySales = toNumberOr(normalized.dailySales)
    const incrementalRate = toNumberOr(normalized.incrementalRate)
    const inferredDiscount = originalPrice > 0 && discountPrice > 0
      ? (discountPrice / originalPrice) * 100
      : undefined
    const inferredNormalOrders = dailySales > 0
      ? Math.round(dailySales / (1 + (incrementalRate / 100)))
      : 0

    return {
      ...normalized,
      normalPrice: toNumberOr(normalized.normalPrice ?? normalized.originalPrice),
      normalMargin: toNumberOr(normalized.normalMargin ?? normalized.marginRate),
      discount: toNumberOr(normalized.discount, inferredDiscount),
      promoOrders: toNumberOr(normalized.promoOrders ?? normalized.dailySales),
      normalOrders: toNumberOr(normalized.normalOrders, inferredNormalOrders),
      days: toNumberOr(normalized.days ?? normalized.period, 1)
    }
  }

  return normalized
}

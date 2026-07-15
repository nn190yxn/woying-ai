import express from 'express'
import { query } from '../models/db.js'
import { generateStructured } from '../services/ai.js'
import { getKBContextWithMeta } from '../services/kbService.js'
import {
  buildQuickPlanFromTemplates,
  createQuickPlanInputHash,
  migrateSavedPlan,
  normalizeIndustryCode,
  normalizeQuickPlanInput,
  normalizeQuickPlanResultCompat,
  validateQuickPlanResult
} from '../services/douyin/index.js'

const router = express.Router()

// 中间件：验证会员等级
const checkAccess = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权', requiredLevel: 'free' })
  }

  try {
    const jwt = await import('jsonwebtoken')
    const token = authHeader.split(' ')[1]
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET)

    const users = await query('SELECT member_level FROM users WHERE id = ?', [decoded.userId])
    if (users.length === 0) {
      return res.status(403).json({ error: '用户不存在' })
    }

    req.userLevel = users[0].member_level || 'free'
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.status(401).json({ error: '无效的 Token' })
  }
}

// 智能体权限映射
const AGENT_ACCESS = {
  diagnosis: 'free',        // 体检诊断
  content_planner: 'starter', // 内容策划
  script_generator: 'starter', // 脚本生成
  title_optimizer: 'starter', // 标题优化
  data_diagnoser: 'pro',     // 数据诊断
  product_pricing: 'pro',    // 组品定价
  ad_calculator: 'pro',      // 投流计算器
  full_strategy: 'annual'    // 完整战略（引导 1v1）
}

// 权限检查中间件
const requireLevel = (requiredLevel) => {
  return (req, res, next) => {
    const levelOrder = { free: 0, starter: 1, pro: 2, annual: 3 }
    if (levelOrder[req.userLevel] < levelOrder[requiredLevel]) {
      return res.status(403).json({
        error: '需要更高会员等级',
        requiredLevel,
        upgradeHint: requiredLevel === 'annual'
          ? '预约专家 1v1 定制全案'
          : `升级为${requiredLevel}会员解锁此功能`
      })
    }
    next()
  }
}

const parseJsonValue = (text) => {
  const trimmed = (text || '').trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (!match) return null
    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

let quickPlanTableReady = false
let reviewRecordTableReady = false

const ensureQuickPlanColumn = async (columnName, definition) => {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'douyin_quick_plans'
       AND COLUMN_NAME = ?`,
    [columnName]
  )
  const exists = Number(rows?.[0]?.count || rows?.[0]?.COUNT || 0) > 0
  if (!exists) await query(`ALTER TABLE douyin_quick_plans ADD COLUMN ${definition}`)
}

const ensureQuickPlanTable = async () => {
  if (quickPlanTableReady) return
  await query(`CREATE TABLE IF NOT EXISTS douyin_quick_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    industry VARCHAR(64) NOT NULL,
    goal VARCHAR(64) NOT NULL,
    frequency VARCHAR(16) NOT NULL,
    ad_support VARCHAR(32) NOT NULL,
    plan_version INT NOT NULL DEFAULT 1,
    input_hash VARCHAR(64),
    diagnosis_context JSON,
    plan JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_user_douyin_quick_plan (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  await ensureQuickPlanColumn('plan_version', 'plan_version INT NOT NULL DEFAULT 1')
  await ensureQuickPlanColumn('input_hash', 'input_hash VARCHAR(64)')
  quickPlanTableReady = true
}

const parseStoredJson = (value, fallback) => {
  if (!value) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const formatSavedQuickPlan = (row) => {
  const plan = normalizeQuickPlanResultCompat(migrateSavedPlan(row))
  return {
    id: row.id,
    industry: normalizeIndustryCode(row.industry),
    goal: row.goal,
    frequency: row.frequency,
    adSupport: row.ad_support,
    planVersion: Number(row.plan_version || plan?.meta?.planVersion || 1),
    inputHash: row.input_hash || plan?.meta?.inputHash || null,
    diagnosisContext: parseStoredJson(row.diagnosis_context, {}),
    plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

const ensureReviewRecordTable = async () => {
  if (reviewRecordTableReady) return
  await query(`CREATE TABLE IF NOT EXISTS douyin_review_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    industry VARCHAR(64),
    goal VARCHAR(64),
    source_context JSON,
    input_data JSON NOT NULL,
    result_data JSON NOT NULL,
    effective_content_types JSON,
    next_actions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_douyin_review_created (user_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  reviewRecordTableReady = true
}

const formatReviewRecord = (row) => ({
  id: row.id,
  industry: row.industry,
  goal: row.goal,
  sourceContext: parseStoredJson(row.source_context, {}),
  inputData: parseStoredJson(row.input_data, {}),
  resultData: parseStoredJson(row.result_data, null),
  effectiveContentTypes: parseStoredJson(row.effective_content_types, []),
  nextActions: parseStoredJson(row.next_actions, []),
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const buildReviewInsights = (records) => {
  const typeMap = new Map()
  const totals = {
    records: records.length,
    views: 0,
    completes: 0,
    messages: 0,
    inquiries: 0,
    redemptions: 0,
    revenue: 0,
    adSpend: 0
  }

  for (const record of records) {
    const input = record.inputData || {}
    const views = toNumber(input.views)
    const completes = toNumber(input.completes)
    const messages = toNumber(input.messages)
    const inquiries = toNumber(input.inquiries)
    const redemptions = toNumber(input.redemptions)
    const revenue = toNumber(input.revenue)
    const adSpend = toNumber(input.adSpend)
    const types = Array.isArray(record.effectiveContentTypes) ? record.effectiveContentTypes : []

    totals.views += views
    totals.completes += completes
    totals.messages += messages
    totals.inquiries += inquiries
    totals.redemptions += redemptions
    totals.revenue += revenue
    totals.adSpend += adSpend

    for (const type of types.map((item) => String(item || '').trim()).filter(Boolean)) {
      const current = typeMap.get(type) || { type, count: 0, views: 0, completes: 0, inquiries: 0, redemptions: 0, revenue: 0, adSpend: 0 }
      current.count += 1
      current.views += views
      current.completes += completes
      current.inquiries += inquiries
      current.redemptions += redemptions
      current.revenue += revenue
      current.adSpend += adSpend
      typeMap.set(type, current)
    }
  }

  const topContentTypes = Array.from(typeMap.values())
    .map((item) => ({
      ...item,
      avgViews: Math.round(item.views / Math.max(item.count, 1)),
      completionRate: item.views > 0 ? Number((item.completes / item.views * 100).toFixed(1)) : 0,
      inquiryRate: item.views > 0 ? Number((item.inquiries / item.views * 100).toFixed(2)) : 0,
      roi: item.adSpend > 0 ? Number((item.revenue / item.adSpend).toFixed(2)) : null
    }))
    .sort((a, b) => (b.count - a.count) || (b.avgViews - a.avgViews))
    .slice(0, 5)

  const completionRate = totals.views > 0 ? Number((totals.completes / totals.views * 100).toFixed(1)) : 0
  const inquiryRate = totals.views > 0 ? Number((totals.inquiries / totals.views * 100).toFixed(2)) : 0
  const redemptionRate = totals.inquiries > 0 ? Number((totals.redemptions / totals.inquiries * 100).toFixed(1)) : 0
  const roi = totals.adSpend > 0 ? Number((totals.revenue / totals.adSpend).toFixed(2)) : null
  const topNames = topContentTypes.map((item) => item.type)
  const mainShortfall = completionRate < 25
    ? '内容完播不足'
    : inquiryRate < 0.5
      ? '私信咨询不足'
      : redemptionRate < 30
        ? '到店核销不足'
        : roi !== null && roi < 1.5
          ? '投流效率不足'
          : '有效内容可放大'

  return {
    recordCount: totals.records,
    topContentTypes,
    metrics: {
      totalViews: totals.views,
      completionRate,
      inquiryRate,
      redemptionRate,
      roi
    },
    nextRoundSuggestion: {
      title: topNames.length ? `下一轮优先放大：${topNames.slice(0, 3).join('、')}` : '下一轮先补充有效内容类型',
      reason: topNames.length
        ? `最近 ${totals.records} 次复盘中，这些内容类型出现频次最高，可作为下一轮 15 天计划的赛马起点。`
        : '当前复盘记录还没有沉淀有效内容类型，建议先记录门店实拍、顾客案例、老板口播等可复用标签。',
      recommendedGoal: mainShortfall === '有效内容可放大' ? 'conversion' : 'traffic',
      focusContentTypes: topNames.slice(0, 3),
      shortfall: mainShortfall,
      actions: [
        topNames.length ? `把 ${topNames[0]} 安排到下一轮前 3 天连续测试` : '每次复盘补充有效内容类型标签',
        completionRate < 25 ? '下一轮优先优化前 3 秒钩子和视频节奏' : '保留当前完播表现较好的内容结构',
        inquiryRate < 0.5 ? '在有效内容结尾增加私信或团购动作引导' : '继续复用能带来咨询的表达方式',
        roi !== null && roi < 1.5 ? '投流先用小预算复测高完播素材' : '把预算集中给已验证内容类型'
      ]
    }
  }
}

const buildScriptFallback = ({ industry, topic, format, duration, target }) => {
  const formatName = {
    talking: '口播讲解型',
    story: '剧情反转型',
    showcase: '种草展示型',
    comparison: '对比评测型',
    tutorial: '教程步骤型'
  }[format] || '口播讲解型'
  const durationSeconds = Number(duration) || 30
  const coreTopic = topic || '门店核心产品'
  const industryName = {
    restaurant: '餐饮',
    beauty: '美业',
    education: '教培',
    service: '生活服务'
  }[industry] || '本地生活'

  return {
    title: `${industryName}${coreTopic}${formatName}脚本`,
    duration: durationSeconds,
    template: formatName,
    scenes: [
      { time: '0-3s', action: '人物或服务结果近景开场，字幕突出痛点', text: `别急着选${coreTopic}，先看这 3 个判断标准`, bgm: '短促提示音' },
      { time: durationSeconds <= 15 ? '3-10s' : '3-15s', action: '展示真实门店、服务过程或产品细节', text: `第一看流程，第二看效果，第三看后续服务`, bgm: '节奏加快' },
      { time: durationSeconds <= 15 ? '10-15s' : '15-25s', action: '用对比画面或案例说明价值', text: `${target || '本地客户'}最容易踩坑的地方，其实是只看价格`, bgm: '重点音效' },
      ...(durationSeconds <= 15 ? [] : [
        { time: '25-30s', action: '镜头回到老板或员工，给出行动引导', text: `想要${coreTopic}避坑清单，评论区留言`, bgm: '行动引导音效' }
      ])
    ],
    tips: [
      '前 3 秒直接抛痛点，字幕要大且具体',
      '画面必须出现真实服务过程或门店细节',
      '结尾只放一个行动指令，降低用户决策成本',
      '发布后重点观察完播率、评论率和私信咨询量'
    ],
    isRuleFallback: true
  }
}

const industryNameMap = {
  restaurant: '餐饮',
  beauty: '美业',
  education: '教培',
  service: '生活服务'
}

const modeNameMap = {
  'group-buy': '团购交易型',
  'lead-gen': '线索留资型',
  brand: '品牌曝光型'
}

export const DIAGNOSIS_SCORING_VERSION = 'douyin-diagnosis-benchmark-v1'

const localLifeBenchmarks = {
  restaurant: {
    avgViews: { cold: 300, stable: 1000, strong: 3000 },
    weeklyPosts: { cold: 3, stable: 7, strong: 14 },
    conversionRate: { cold: 8, stable: 18, strong: 35 },
    inquiryRate: { stable: 3 },
    followerRate: { cold: 8, strong: 20 },
    cpa: { stable: 150, strong: 80 }
  },
  beauty: {
    avgViews: { cold: 300, stable: 1200, strong: 3500 },
    weeklyPosts: { cold: 3, stable: 7, strong: 14 },
    conversionRate: { cold: 10, stable: 22, strong: 40 },
    inquiryRate: { stable: 4 },
    followerRate: { cold: 10, strong: 24 },
    cpa: { stable: 180, strong: 100 }
  },
  education: {
    avgViews: { cold: 200, stable: 800, strong: 2500 },
    weeklyPosts: { cold: 3, stable: 6, strong: 12 },
    conversionRate: { cold: 6, stable: 15, strong: 30 },
    inquiryRate: { stable: 2 },
    followerRate: { cold: 6, strong: 16 },
    cpa: { stable: 220, strong: 120 }
  },
  service: {
    avgViews: { cold: 250, stable: 900, strong: 2800 },
    weeklyPosts: { cold: 3, stable: 7, strong: 14 },
    conversionRate: { cold: 8, stable: 18, strong: 35 },
    inquiryRate: { stable: 3 },
    followerRate: { cold: 8, strong: 20 },
    cpa: { stable: 180, strong: 90 }
  }
}

const clampScore = (value) => Math.max(20, Math.min(95, Math.round(value)))

const hasMetricValue = (metrics, key) => {
  const value = metrics?.[key]
  if (value === undefined || value === null || value === '') return false
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

const metricNumber = (metrics, key) => {
  const value = Number(metrics?.[key])
  return Number.isFinite(value) && value >= 0 ? value : 0
}

const countPains = (painPoints, key) => Array.isArray(painPoints?.[key]) ? painPoints[key].length : 0

export const buildDimensionInsights = ({ industry, mode, painPoints = {}, metrics = {}, interview = {} }) => {
  const benchmark = localLifeBenchmarks[industry] || localLifeBenchmarks.restaurant
  const weeklyPosts = metricNumber(metrics, 'weeklyPosts')
  const avgViews = metricNumber(metrics, 'avgViewsPerVideo')
  const monthlyViews = metricNumber(metrics, 'monthlyViews')
  const monthlyFollowers = metricNumber(metrics, 'monthlyFollowers')
  const inquiries = metricNumber(metrics, 'monthlyInquiries')
  const conversions = metricNumber(metrics, 'monthlyConversions')
  const adBudget = metricNumber(metrics, 'monthlyAdBudget')
  const metricPresence = {
    weeklyPosts: hasMetricValue(metrics, 'weeklyPosts'),
    avgViews: hasMetricValue(metrics, 'avgViewsPerVideo'),
    monthlyViews: hasMetricValue(metrics, 'monthlyViews'),
    monthlyFollowers: hasMetricValue(metrics, 'monthlyFollowers'),
    inquiries: hasMetricValue(metrics, 'monthlyInquiries'),
    conversions: hasMetricValue(metrics, 'monthlyConversions'),
    adBudget: hasMetricValue(metrics, 'monthlyAdBudget')
  }
  const filledMetrics = Object.values(metricPresence).filter(Boolean).length

  const expectedMonthlyViews = Math.max(avgViews * Math.max(weeklyPosts * 4, 1), monthlyViews)
  const inquiryRate = monthlyViews ? (inquiries / monthlyViews) * 1000 : 0
  const conversionRate = inquiries ? (conversions / inquiries) * 100 : 0
  const costPerConversion = adBudget && conversions ? adBudget / conversions : 0
  const followerRate = monthlyViews ? (monthlyFollowers / monthlyViews) * 1000 : 0

  const trafficPain = countPains(painPoints, 'traffic')
  const contentPain = countPains(painPoints, 'content')
  const conversionPain = countPains(painPoints, 'conversion')
  const retentionPain = countPains(painPoints, 'retention')
  const adsPain = countPains(painPoints, 'ads')
  const hasTrafficGoal = interview.goal === 'traffic'
  const hasConversionGoal = interview.goal === 'conversion'
  const hasContentGoal = interview.goal === 'content'
  const hasAdsGoal = interview.goal === 'ads'
  const hasRetentionGoal = interview.goal === 'retention'

  const trafficScore = clampScore(
    (avgViews >= benchmark.avgViews.strong ? 82 : avgViews >= benchmark.avgViews.stable ? 68 : avgViews >= benchmark.avgViews.cold ? 48 : avgViews > 0 ? 34 : metricPresence.avgViews ? 28 : 50)
    + (monthlyViews >= 100000 ? 8 : monthlyViews >= 30000 ? 4 : 0)
    - trafficPain * 8
    - (hasTrafficGoal ? 4 : 0)
  )
  const contentScore = clampScore(
    (weeklyPosts >= benchmark.weeklyPosts.strong ? 82 : weeklyPosts >= benchmark.weeklyPosts.stable ? 68 : weeklyPosts >= benchmark.weeklyPosts.cold ? 52 : weeklyPosts > 0 ? 36 : metricPresence.weeklyPosts ? 30 : 48)
    - contentPain * 9
    - (hasContentGoal ? 4 : 0)
  )
  const conversionScore = clampScore(
    (conversionRate >= benchmark.conversionRate.strong ? 82 : conversionRate >= benchmark.conversionRate.stable ? 66 : conversionRate >= benchmark.conversionRate.cold ? 50 : conversions > 0 ? 38 : inquiries >= 30 ? 42 : metricPresence.inquiries || metricPresence.conversions ? 30 : 48)
    + (inquiryRate >= benchmark.inquiryRate.stable ? 4 : 0)
    - conversionPain * 8
    - (hasConversionGoal ? 4 : 0)
  )
  const retentionScore = clampScore(
    (followerRate >= benchmark.followerRate.strong ? 78 : followerRate >= benchmark.followerRate.cold ? 62 : monthlyFollowers > 0 ? 48 : metricPresence.monthlyFollowers ? 34 : 50)
    - retentionPain * 10
    - (hasRetentionGoal ? 4 : 0)
  )
  const adsScore = clampScore(
    adBudget > 0
      ? (costPerConversion && costPerConversion <= benchmark.cpa.strong ? 74 : costPerConversion && costPerConversion <= benchmark.cpa.stable ? 58 : conversions > 0 ? 44 : 38) - adsPain * 8 - (hasAdsGoal ? 4 : 0)
      : 46 - adsPain * 10 - (hasAdsGoal ? 4 : 0)
  )

  const radarData = {
    traffic: trafficScore,
    content: contentScore,
    conversion: conversionScore,
    retention: retentionScore,
    ads: adsScore
  }
  const dimensionNames = {
    traffic: '流量力',
    content: '内容力',
    conversion: mode === 'lead-gen' ? '留资转化力' : '团购转化力',
    retention: '留存复购力',
    ads: '投流效率'
  }
  const sortedDimensions = Object.entries(radarData).sort((a, b) => a[1] - b[1])
  const [weakestKey, weakestScore] = sortedDimensions[0]
  const secondWeakness = sortedDimensions[1]

  const profileMap = {
    traffic: avgViews < 300 ? '低播放冷启动型' : '流量放大不足型',
    content: weeklyPosts < 3 ? '内容供给不足型' : '内容结构待优化型',
    conversion: conversions === 0 ? '转化链路断点型' : '流量转化漏损型',
    retention: monthlyFollowers === 0 ? '粉丝沉淀不足型' : '留存复购薄弱型',
    ads: adBudget > 0 ? '投流效率待校准型' : '付费放大缺口型'
  }
  const confidence = filledMetrics >= 6 ? '高' : filledMetrics >= 4 ? '中' : '低'
  const dimensionDetails = [
    {
      key: 'traffic',
      name: dimensionNames.traffic,
      score: trafficScore,
      basis: `单条均播 ${metricPresence.avgViews ? avgViews : '未填'}，参考稳定线 ${benchmark.avgViews.stable}+；流量痛点 ${trafficPain} 项`
    },
    {
      key: 'content',
      name: dimensionNames.content,
      score: contentScore,
      basis: `近 7 天发布 ${metricPresence.weeklyPosts ? weeklyPosts : '未填'} 条，参考稳定线 ${benchmark.weeklyPosts.stable}+；内容痛点 ${contentPain} 项`
    },
    {
      key: 'conversion',
      name: dimensionNames.conversion,
      score: conversionScore,
      basis: `月咨询 ${metricPresence.inquiries ? inquiries : '未填'}，月成交/留资 ${metricPresence.conversions ? conversions : '未填'}，转化率 ${inquiries ? `${conversionRate.toFixed(1)}%` : '缺失'}，参考稳定线 ${benchmark.conversionRate.stable}%+`
    },
    {
      key: 'retention',
      name: dimensionNames.retention,
      score: retentionScore,
      basis: `月增粉 ${metricPresence.monthlyFollowers ? monthlyFollowers : '未填'}，千次播放增粉 ${monthlyViews ? followerRate.toFixed(1) : '缺失'}，留存痛点 ${retentionPain} 项`
    },
    {
      key: 'ads',
      name: dimensionNames.ads,
      score: adsScore,
      basis: `月投流 ${metricPresence.adBudget ? adBudget : '未填'} 元，${costPerConversion ? `单次成交/留资成本约 ${Math.round(costPerConversion)} 元，参考稳定线 ${benchmark.cpa.stable} 元以内` : '缺少可核算 CPA'}；投流痛点 ${adsPain} 项`
    }
  ].sort((a, b) => a.score - b.score)

  return {
    metrics: { weeklyPosts, avgViews, monthlyViews, monthlyFollowers, inquiries, conversions, adBudget, expectedMonthlyViews, inquiryRate, conversionRate, costPerConversion, followerRate, filledMetrics, metricPresence },
    pains: { trafficPain, contentPain, conversionPain, retentionPain, adsPain },
    radarData,
    weakestKey,
    weakestScore,
    secondWeaknessKey: secondWeakness?.[0],
    secondWeaknessScore: secondWeakness?.[1],
    weakestName: dimensionNames[weakestKey],
    secondWeaknessName: secondWeakness ? dimensionNames[secondWeakness[0]] : '',
    profile: profileMap[weakestKey],
    confidence,
    dimensionNames,
    benchmark,
    dimensionDetails
  }
}

export const buildDiagnosisFallback = ({ industry, mode, painPoints = {}, metrics = {}, interview = {} }) => {
  const industryName = industryNameMap[industry] || '本地生活'
  const modeName = modeNameMap[mode] || '综合经营型'
  const insight = buildDimensionInsights({ industry, mode, painPoints, metrics, interview })
  const { weeklyPosts, avgViews, monthlyViews, monthlyFollowers, inquiries, conversions, adBudget, inquiryRate, conversionRate, costPerConversion, filledMetrics, metricPresence } = insight.metrics
  const isLowConfidence = insight.confidence === '低'
  const conversionLabel = mode === 'lead-gen' ? '留资' : '核销/成交'

  const suggestionMap = {
    traffic: [
      `先用 3 条同城痛点短视频测试流量入口，开头 3 秒直接点出${industryName}客户决策痛点`,
      '把门店位置、价格锚点和服务结果放进前 5 秒，优先提升同城推荐识别'
    ],
    content: [
      `未来 7 天至少发布 5 条内容，按“痛点解释、过程展示、顾客案例、套餐对比、老板观点”五类赛马`,
      '每条视频只测试一个变量：开头钩子、主体结构或结尾行动指令，避免一次改太多看不出原因'
    ],
    conversion: [
      `把主推${mode === 'lead-gen' ? '咨询入口' : '团购套餐'}固定到视频结尾和主页，评论区只引导一个动作`,
      `用咨询到${conversionLabel}转化率做日复盘，低于 15% 时优先检查套餐利益点、客服回复和到店承接`
    ],
    retention: [
      '把评论、私信和到店用户沉淀到老客池，设置 7 天二次触达话术',
      '每周至少发布 1 条老客案例或复购福利内容，避免账号只做一次性获客'
    ],
    ads: [
      adBudget > 0 ? `先按${costPerConversion ? `约 ${Math.round(costPerConversion)} 元/${conversionLabel}` : '单次转化成本'}复盘投流效率，暂停无转化素材` : '先不要放大预算，等自然流量内容跑出高互动素材后再小额投本地推',
      '投流只放大已经验证过的素材，先测 3 个同城人群包和 2 个成交目标'
    ]
  }
  const suggestions = [
    ...suggestionMap[insight.weakestKey],
    ...(suggestionMap[insight.secondWeaknessKey] || []),
    '把本次体检转成 15 天计划，每天记录发布量、播放、咨询、成交和投流花费，7 天后只保留有效动作'
  ].slice(0, 6)

  return {
    radarData: insight.radarData,
    diagnosis: `${isLowConfidence ? '当前为初筛判断。' : ''}${industryName}${modeName}属于“${insight.profile}”，主短板是${insight.weakestName}（${insight.weakestScore}分）${insight.secondWeaknessName ? `，次短板是${insight.secondWeaknessName}（${insight.secondWeaknessScore}分）` : ''}。${interview.mainBottleneck ? `用户自述瓶颈为“${interview.mainBottleneck}”，` : ''}下一步应先修正最低分链路，再进入 15 天执行计划。`,
    dataBasis: [
      `数据完整度：${filledMetrics}/7，诊断置信度：${insight.confidence}`,
      `流量依据：月播放 ${metricPresence.monthlyViews ? monthlyViews : '未填'}，单条均播 ${metricPresence.avgViews ? avgViews : '未填'}，流量力 ${insight.radarData.traffic} 分`,
      `内容依据：近 7 天发布 ${metricPresence.weeklyPosts ? weeklyPosts : '未填'} 条，内容力 ${insight.radarData.content} 分`,
      `转化依据：月咨询 ${metricPresence.inquiries ? inquiries : '未填'}，月${conversionLabel} ${metricPresence.conversions ? conversions : '未填'}，${inquiries ? `咨询转${conversionLabel}率约 ${conversionRate.toFixed(1)}%` : '转化率缺失'}`,
      `沉淀与投流依据：月增粉 ${metricPresence.monthlyFollowers ? monthlyFollowers : '未填'}，月投流 ${metricPresence.adBudget ? adBudget : '未填'} 元${monthlyViews ? `，千次播放咨询约 ${inquiryRate.toFixed(1)} 次` : ''}`
    ],
    confidence: insight.confidence,
    benchmarkSummary: `${industryName}${modeName}参考线：单条均播 ${insight.benchmark.avgViews.stable}+、近 7 天发布 ${insight.benchmark.weeklyPosts.stable}+、咨询转${conversionLabel}率 ${insight.benchmark.conversionRate.stable}%+、付费${conversionLabel}成本 ${insight.benchmark.cpa.stable} 元以内。`,
    dimensionDetails: insight.dimensionDetails,
    suggestions,
    nextQuestions: [
      `最低分维度“${insight.weakestName}”最近 7 天的原始数据明细是多少？`,
      `当前主推${mode === 'lead-gen' ? '留资权益' : '团购套餐'}的价格、利润和成交路径是什么？`,
      '过去 30 天有没有单条表现最好的视频？它的播放、完播、咨询和成交分别是多少？'
    ],
    riskBoundary: [
      isLowConfidence ? '当前基础数据不足，本报告属于初筛判断，建议补齐近 7 天发布、播放、咨询、成交和投流数据后再生成执行计划。' : '本报告基于当前填写数据和痛点勾选生成，适合作为下一步排查顺序，不替代真实投放和成交数据复盘。',
      '建议先小范围执行 3-5 天，观察播放、私信、咨询、核销和投流成本变化，再决定是否放大预算。'
    ],
    recommendedNext: ['douyin-quick-plan', 'douyin-script-generator', 'douyin-conversion-path'],
    diagnosticProfile: insight.profile,
    weakestDimension: insight.weakestKey,
    scoringVersion: DIAGNOSIS_SCORING_VERSION,
    isRuleFallback: true
  }
}

const normalizeDiagnosisResult = (value, fallback) => {
  if (!value || Array.isArray(value) || typeof value !== 'object') return fallback
  const uniqueItems = (items) => [...new Set(items.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()))]
  return {
    ...fallback,
    aiDiagnosis: typeof value.diagnosis === 'string' && value.diagnosis.trim() ? value.diagnosis.trim() : undefined,
    suggestions: uniqueItems([...fallback.suggestions, ...(Array.isArray(value.suggestions) ? value.suggestions : [])]).slice(0, 6),
    nextQuestions: uniqueItems([...fallback.nextQuestions, ...(Array.isArray(value.nextQuestions) ? value.nextQuestions : [])]).slice(0, 3),
    riskBoundary: uniqueItems([...(Array.isArray(fallback.riskBoundary) ? fallback.riskBoundary : []), ...(Array.isArray(value.riskBoundary) ? value.riskBoundary : [])]).slice(0, 3),
    recommendedNext: Array.isArray(value.recommendedNext) && value.recommendedNext.length ? value.recommendedNext : fallback.recommendedNext
  }
}

const buildTitleFallback = ({ industry, originalTitle, style }) => {
  const baseTitle = originalTitle || '门店内容'
  const industryName = industryNameMap[industry] || '本地生活'
  const styleName = {
    number: '数字型',
    pain: '痛点型',
    curiosity: '悬念型',
    benefit: '利益型',
    mixed: '混合推荐'
  }[style] || '混合推荐'

  return [
    { text: `${industryName}老板都在用的 3 个${baseTitle}方法`, reason: `数字型标题，适合${styleName}方向，降低用户理解成本` },
    { text: `${baseTitle}效果差，先检查这 5 个细节`, reason: '痛点前置，吸引正在遇到问题的同城用户' },
    { text: `为什么同行做${baseTitle}更容易出单`, reason: '对比悬念，激发用户点击和评论' },
    { text: `${baseTitle}这样做，客户更愿意咨询`, reason: '利益明确，适合承接私信和团购转化' },
    { text: `做${industryName}多年，我建议这样拍${baseTitle}`, reason: '老板经验口吻，强化信任感和专业感' }
  ].map(item => ({ ...item, isRuleFallback: true }))
}

const buildCoverFallback = ({ topic, type }) => {
  const coreTopic = topic || '门店服务'
  const typeName = {
    number: '数字型',
    suspense: '悬念型',
    pain: '痛点型',
    contrast: '对比型',
    mixed: '混合推荐'
  }[type] || '混合推荐'

  return [
    { type: '数字型', text: `${coreTopic}必看 3 个细节`, reason: `数字钩子清晰，适合${typeName}方向` },
    { type: '悬念型', text: `为什么你的${coreTopic}没人问`, reason: '用疑问制造停留，适合封面大字' },
    { type: '痛点型', text: `${coreTopic}别只看价格`, reason: '直击本地用户决策误区' },
    { type: '对比型', text: `普通${coreTopic} vs 专业服务`, reason: '对比能放大价值差异' },
    { type: '信任型', text: `老板亲测的${coreTopic}清单`, reason: '老板视角增强真实感和信任感' }
  ].map(item => ({ ...item, isRuleFallback: true }))
}

const buildLocalAdFallback = ({ industry, goal, dailyBudget, range }) => {
  const industryName = industryNameMap[industry] || '本地生活'
  const goalName = {
    store: '门店到店',
    leads: '表单留资',
    followers: '账号涨粉'
  }[goal] || '门店到店'

  return {
    title: `${industryName}行业本地推${goalName}策略`,
    summary: `日预算 ${Number(dailyBudget) || 0} 元，覆盖${range || '5km'}范围，以下为详细投放方案。`,
    targeting: [
      `地域：门店${range || '5km'}范围`,
      industry === 'restaurant' ? '兴趣：美食探店、团购、同城生活' : industry === 'beauty' ? '兴趣：美容护肤、美甲美睫、个人护理' : '兴趣：教育培训、亲子、升学',
      '年龄：25-45 岁（核心消费人群）',
      '排除：同行账号、已转化用户',
      goal === 'store' ? '行为：近期搜索过团购/门店相关' : goal === 'leads' ? '行为：近期填写过表单/咨询过服务' : '行为：关注过同类账号'
    ],
    creatives: [
      '前 3 秒必须出现门店环境/产品特写',
      '使用"同城限时福利"作为核心钩子',
      '视频中必须出现价格锚点（原价 vs 现价）',
      '结尾 5 秒明确引导行动（点击组件/留资）',
      '准备 3-5 条不同素材轮播测试，避免素材疲劳'
    ],
    bidding: [
      '前期（1-3 天）：使用系统智能出价，让算法学习',
      '中期（4-7 天）：根据 CPA 数据手动微调，上下浮动 10-20%',
      '成熟期（7 天后）：稳定出价，放量跑量',
      `目标 CPA 建议：${goal === 'store' ? '30-50 元/单' : goal === 'leads' ? '50-80 元/条' : '2-5 元/粉丝'}`,
      '如果 CPA 超标 30% 以上，暂停该计划重新定向'
    ],
    schedule: [
      '投放时段：11:00-14:00（午间）+ 17:00-21:00（晚间高峰）',
      '周一至周四：正常投放，预算分配 60%',
      '周五至周日：加大投放，预算分配 40%（周末到店率高）',
      '节假日前 3 天：提前布局，预算可提升 50%',
      '每周末复盘数据，淘汰低效计划，复制高效计划'
    ],
    budgetAllocation: [
      { name: '测试期素材', percent: 30, amount: Math.round((Number(dailyBudget) || 0) * 0.3), color: '#3b82f6' },
      { name: '跑量素材加投', percent: 50, amount: Math.round((Number(dailyBudget) || 0) * 0.5), color: '#10b981' },
      { name: '追投爆款', percent: 20, amount: Math.round((Number(dailyBudget) || 0) * 0.2), color: '#f59e0b' }
    ],
    isRuleFallback: true
  }
}

const buildIpPositioningFallback = ({ industry, personality, experience, goal }) => {
  const industryName = industryNameMap[industry] || '本地生活'
  const personalityMap = {
    professional: { name: '专家型', slogan: '用专业说话，用数据证明', tags: ['技术流', '干货派', '行业权威'] },
    friendly: { name: '暖心理', slogan: '做你身边最懂 XX 的朋友', tags: ['贴心', '耐心', '可信赖'] },
    direct: { name: '真性情型', slogan: '敢说真话，敢揭行业内幕', tags: ['直率', '敢说', '反差萌'] },
    humorous: { name: '段子手型', slogan: '笑着笑着就学到了', tags: ['搞笑', '接地气', '记忆点强'] },
    storyteller: { name: '故事型', slogan: '每个顾客都有一个故事', tags: ['共情', '温暖', '真实'] }
  }
  const p = personalityMap[personality] || personalityMap.professional
  return {
    ipName: `${industryName}行业${p.name}IP`,
    slogan: p.slogan,
    tags: p.tags,
    pillars: [
      { name: '专业知识输出', desc: '分享行业干货、技术解析、避坑指南', example: `${industryName}行业 90% 的人都不知道的 3 个真相` },
      { name: '真实工作日常', desc: '展示幕后工作场景，建立真实感', example: `从业 ${experience || '5-10'} 年的${industryName}人日常` },
      { name: '顾客故事/案例', desc: '用真实案例证明专业与价值', example: `这位顾客为什么会反复选择我们` }
    ],
    dos: ['保持固定更新频率（每周 3-5 条）', '统一视觉风格（封面/字幕/着装）', '回复评论区互动，建立粉丝连接', '定期分享个人成长与学习经历'],
    donts: ['不要频繁更换人设风格', '不要过度营销，内容要大于广告', '不要与其他行业盲目对标', '不要忽视负面评论，要真诚回应'],
    goalNote: goal === 'franchise' ? '招商加盟方向需要更强的品牌叙事和案例背书。' : '定位应围绕真实经历和用户决策点展开。',
    isRuleFallback: true
  }
}

const buildFullStrategyFallback = ({ industry }) => {
  const industryName = industryNameMap[industry] || '本地生活'
  return {
    title: `${industryName}行业 90 天周期倒推战略`,
    summary: '本战略采用"蓄水-爆发-稳定"三阶段模型，配合 7 天长效赛马机制，逐步建立品牌同城影响力。',
    phases: [
      {
        badge: 'Phase 1',
        badgeClass: 'badge-phase-1',
        name: '第 1-30 天：蓄水期（标签建立与流量积累）',
        desc: '核心目标：让算法认识你，让同城用户刷到你',
        tasks: [
          '完成账号装修（头像/简介/背景图/置顶视频）',
          '发布 15-20 条垂直内容，建立行业标签',
          '测试 3-5 种内容模板，找到数据最优解',
          '启动小额 DOU+ 测试（日预算 100-200 元）',
          '建立基础私域导流路径（企微/社群）'
        ],
        metrics: [
          { label: '粉丝增长', target: '+500-1000' },
          { label: '月均播放', target: '5万+' },
          { label: '团购/留资', target: '50+ 单' },
          { label: '内容标签', target: '精准匹配' }
        ],
        locked: true
      },
      {
        badge: 'Phase 2',
        badgeClass: 'badge-phase-2',
        name: '第 31-60 天：爆发期（赛马放大与转化收割）',
        desc: '核心目标：放大跑量素材，提升转化效率',
        tasks: [
          '复制已验证的内容模板，提高更新频率',
          '开启本地推投放，定向同城高意向人群',
          '策划 1-2 场主题营销活动（限时/联名）',
          '建立直播常态化（每周 2-3 场）',
          '优化转化链路（团购页面/私信自动回复）'
        ],
        metrics: [
          { label: '粉丝增长', target: '+2000-3000' },
          { label: '月均播放', target: '20万+' },
          { label: '团购/留资', target: '200+ 单' },
          { label: 'ROI', target: '> 1:3' }
        ],
        locked: true
      },
      {
        badge: 'Phase 3',
        badgeClass: 'badge-phase-3',
        name: '第 61-90 天：稳定期（品牌心智与复购体系）',
        desc: '核心目标：从流量思维转向留量思维',
        tasks: [
          '建立会员体系与复购激励机制',
          '策划老客专属活动（生日/纪念日）',
          '打造老板 IP 人设，提升品牌信任度',
          '探索多账号矩阵（主号+员工号）',
          '沉淀 SOP，形成可复制的增长模型'
        ],
        metrics: [
          { label: '粉丝增长', target: '+1000-1500' },
          { label: '复购率', target: '> 30%' },
          { label: '月均 GMV', target: '稳定增长' },
          { label: '品牌搜索量', target: '提升 50%' }
        ],
        locked: true
      }
    ],
    isRuleFallback: true
  }
}

const buildConversionPathFallback = ({ scenario, industry }) => {
  const industryName = industryNameMap[industry] || '本地生活'
  const scenarioName = {
    'group-buy': '团购转化',
    'private-msg': '私信留资',
    wechat: '企微导流'
  }[scenario] || '团购转化'

  if (scenario === 'private-msg') {
    return {
      title: `${industryName}${scenarioName} SOP 检查表`,
      funnel: [
        { label: '内容种草', desc: '视频/直播激发需求' },
        { label: '进入主页', desc: '点击头像进入主页查看简介' },
        { label: '发送私信', desc: '通过私信咨询详情' },
        { label: '自动回复', desc: '系统自动发送留资引导' },
        { label: '留资成功', desc: '用户提交电话/微信号' },
        { label: '跟进转化', desc: '销售团队跟进完成转化' }
      ],
      checklist: [
        { text: '主页简介是否包含清晰的私信领取引导语？', done: false },
        { text: '私信自动回复是否设置 2 小时内响应承诺？', done: false },
        { text: '自动回复话术是否自然且包含下一步动作？', done: false },
        { text: '是否使用官方留资组件收集客资？', done: false },
        { text: '私信关键词回复是否覆盖高频问题？', done: false },
        { text: '是否有专人负责高意向私信二次跟进？', done: false },
        { text: '留资表单是否控制在 3 个字段以内？', done: false },
        { text: '留资后是否有确认短信或添加提醒？', done: false },
        { text: '线索跟进 SOP 是否明确 24 小时内首次联系？', done: false },
        { text: '是否记录线索来源视频和咨询关键词？', done: false }
      ],
      isRuleFallback: true
    }
  }

  if (scenario === 'wechat') {
    return {
      title: `${industryName}${scenarioName} SOP 检查表`,
      funnel: [
        { label: '内容触达', desc: '视频/直播引导添加企微' },
        { label: '扫码添加', desc: '通过官方组件或私信发送企微二维码' },
        { label: '通过验证', desc: '企微自动通过并发送欢迎语' },
        { label: '标签管理', desc: '根据来源自动打标签分类' },
        { label: '社群运营', desc: '拉入对应社群持续培育' },
        { label: '复购转化', desc: '定期活动/推送促进复购' }
      ],
      checklist: [
        { text: '企微欢迎语是否个性化并说明用户来源？', done: false },
        { text: '是否设置来源、行业、意向等级自动标签？', done: false },
        { text: '社群是否有明确群规与价值输出节奏？', done: false },
        { text: '是否定期推送有价值内容并控制广告占比？', done: false },
        { text: '是否有会员等级或积分体系承接复购？', done: false },
        { text: '社群活动频率是否保持每周 1-2 次？', done: false },
        { text: '是否有专属客服一对一跟进高意向客户？', done: false },
        { text: '是否设置 30 天未互动流失预警？', done: false },
        { text: '企微朋友圈是否每日保持稳定更新？', done: false },
        { text: '是否追踪从企微到成交的全链路数据？', done: false }
      ],
      isRuleFallback: true
    }
  }

  return {
    title: `${industryName}${scenarioName} SOP 检查表`,
    funnel: [
      { label: '视频种草', desc: '内容激发兴趣，挂载团购组件' },
      { label: '点击组件', desc: '用户点击左下角/评论区团购链接' },
      { label: '浏览详情', desc: '查看套餐内容、评价、门店信息' },
      { label: '下单购买', desc: '完成支付，获得核销码' },
      { label: '到店核销', desc: '顾客到店消费，完成核销' }
    ],
    checklist: [
      { text: '团购套餐标题是否包含核心卖点？', done: false },
      { text: '套餐图片是否高清且突出核心产品？', done: false },
      { text: '是否设置原价对比和限时机制？', done: false },
      { text: '团购详情页是否包含地址、营业时间和预约方式？', done: false },
      { text: '视频结尾是否有明确行动引导？', done: false },
      { text: '是否设置限量或限时提升紧迫感？', done: false },
      { text: '评论区是否置顶团购引导评论？', done: false },
      { text: '私信自动回复是否包含团购链接或核销说明？', done: false },
      { text: '核销率是否高于 70%？', done: false },
      { text: '是否有顾客评价管理和差评处理机制？', done: false }
    ],
    isRuleFallback: true
  }
}

const buildProductPricingFallback = ({ industry, stage }) => {
  if (industry === 'restaurant') {
    return {
      type: '团购交易型',
      stage,
      products: [
        { role: '引流款', name: '9.9 元秒杀单人餐', price: 9.9, target: '拉升 GMV，触发同城推荐', limit: '每日 20 份' },
        { role: '主推款', name: '128 元双人招牌套餐', price: 128, target: '承接流量，核销率 > 70%', margin: '55%' },
        { role: '利润款', name: '199 元四人聚餐', price: 199, target: '拉升毛利，周末溢价', margin: '65%' },
        { role: '复购款', name: '299 元三次卡', price: 299, target: '30 天复购率提升', margin: '60%' }
      ],
      warnings: ['引流款占比不超过 30%，否则拉低整体 GPM'],
      upgradeHint: '生成完整 SKU 定价测算表需升级高阶会员或预约 1v1 咨询',
      isRuleFallback: true
    }
  }

  return {
    type: '线索留资型',
    stage,
    products: [
      { role: '引流款', name: '49 元初次体验', price: 49, target: '到店率 > 60%', conversion: '留资率 > 80%' },
      { role: '主推款', name: '1280 元季度疗程', price: 1280, target: '7 天内升单率 > 25%', conversion: '跟进 SOP 执行' },
      { role: '利润款', name: '3980 元年度 VIP', price: 3980, target: '老客复购 > 40%', conversion: '专属服务' },
      { role: '防御款', name: '599 元单项卡', price: 599, target: '守住价格底线', conversion: '不打价格战' }
    ],
    upgradeChain: [
      '体验当天 → 展示效果 → 推荐限时优惠',
      '体验后 3 天 → 客服回访 → 推送案例',
      '体验后 7 天 → 最后逼单 → 赠送附加服务'
    ],
    warnings: ['线索成本 < 80 元，到店转化率 > 40%'],
    upgradeHint: '定制升单话术 SOP 需预约专家 1v1',
    isRuleFallback: true
  }
}

// 1. 体检诊断智能体
router.post('/diagnosis', checkAccess, requireLevel('free'), async (req, res) => {
  const { industry, mode, painPoints = {}, metrics = {}, interview = {} } = req.body
  const fallbackResult = buildDiagnosisFallback({ industry, mode, painPoints, metrics, interview })
  const kbResult = getKBContextWithMeta('douyin-growth', req.userLevel || 'free', { industry, mode, painPoints, metrics, interview }, { rawFallback: true })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音本地生活经营顾问，擅长用知识库做门店体检、内容诊断、团购/留资转化和投流建议。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `知识库参考：
${kbResult.context || '暂无命中知识库，请按抖音本地生活经营方法论分析。'}

用户访谈：
- 行业：${industryNameMap[industry] || industry || '本地生活'}
- 经营模式：${modeNameMap[mode] || mode || '未提供'}
- 当前目标：${interview.goal || '未提供'}
- 最大瓶颈：${interview.mainBottleneck || '未提供'}
- 当前做法：${interview.currentAction || '未提供'}
- 目标客群：${interview.targetAudience || '未提供'}
- 痛点勾选：${JSON.stringify(painPoints)}
- 基础数据：${JSON.stringify(metrics)}

系统已根据用户数据计算出的诊断底稿：
${JSON.stringify({
  radarData: fallbackResult.radarData,
  diagnosticProfile: fallbackResult.diagnosticProfile,
  weakestDimension: fallbackResult.weakestDimension,
  confidence: fallbackResult.confidence,
  dataBasis: fallbackResult.dataBasis,
  ruleSuggestions: fallbackResult.suggestions
}, null, 2)}

请生成一个 JSON 对象，字段包含：
- radarData: 对象，包含 traffic、content、conversion、retention、ads 五个 0-100 分数
- diagnosis: 120 字以内诊断结论
- dataBasis: 3-5 条诊断依据，必须说明使用了哪些数据、哪些字段缺失、哪些结论属于假设
- confidence: 诊断置信度，只能是 高、中、低
- suggestions: 4-6 条优先优化建议，每条必须可执行
- nextQuestions: 3 个后续追问，用于进入 15 天计划前补充信息
- recommendedNext: 2-3 个推荐下一步工具 code

要求：
1. 必须以“诊断底稿”为主，不得改写底稿中的最低分维度、置信度和核心依据。
2. 必须结合行业、经营模式、痛点和用户访谈内容。
3. 建议必须体现抖音同城、内容钩子、团购/留资承接、复购或投流至少 3 类能力。
4. 基础数据缺失超过 3 项时，confidence 必须为 低，diagnosis 必须写明“当前为初筛判断”。
5. 数据不足时给区间化判断，避免使用“明显短板”“严重缺失”等过度确定表达。
6. 不同输入必须体现不同分型、不同主短板和不同优先动作。`,
      temperature: 0.65,
      max_tokens: 1800,
      responseFormat: { type: 'json_object' }
    })
    const parsed = parseJsonValue(content)
    const result = normalizeDiagnosisResult(parsed, fallbackResult)
    res.json({
      agent: 'diagnosis',
      status: 'success',
      result,
      meta: {
        kbEnhanced: Boolean(kbResult.context),
        kbFilesUsed: kbResult.meta?.kbFilesUsed || []
      },
      isRuleFallback: !parsed
    })
  } catch (error) {
    res.json({
      agent: 'diagnosis',
      status: 'success',
      result: fallbackResult,
      meta: {
        kbEnhanced: Boolean(kbResult.context),
        kbFilesUsed: kbResult.meta?.kbFilesUsed || []
      },
      isRuleFallback: true
    })
  }
})

// 2. 组品定价智能体（核心）
router.post('/product-pricing', checkAccess, requireLevel('pro'), async (req, res) => {
  const { industry, stage, currentProducts, costStructure, competitorRange } = req.body
  const fallbackResult = buildProductPricingFallback({ industry, stage })

  // 根据行业分轨调用不同知识库
  const knowledgeBase = industry === 'restaurant'
    ? '餐饮行业/营销案例/*'
    : industry === 'beauty'
      ? '美业行业/营销案例/*'
      : '教培行业/营销案例/*'

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音本地生活组品定价专家，擅长餐饮团购、美业留资和教培试听转化。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[industry] || industry || '本地生活'}
经营阶段：${stage || '未提供'}
现有产品：${JSON.stringify(currentProducts || [])}
成本结构：${JSON.stringify(costStructure || {})}
竞对价格区间：${JSON.stringify(competitorRange || {})}

请生成一个 JSON 对象，字段包含：
- type: 组品类型
- stage: 当前阶段
- products: 4 个产品建议，每项包含 role、name、price、target，并按行业补充 margin 或 conversion
- upgradeChain: 可选，线索留资型需要给 3 步升单链路
- warnings: 数组，2-4 条关键提醒
- upgradeHint: 升级定制引导文案

要求：
1. 产品角色必须覆盖引流款、主推款、利润款和防御/复购款。
2. 价格要结合竞对区间和成本结构，避免只套默认模板。
3. 餐饮重点关注核销率、GPM、毛利率；美业和教培重点关注留资、到店、升单、续费。
4. 输出必须能被前端直接渲染。`,
      temperature: 0.75,
      max_tokens: 2600
    })
    const parsed = parseJsonValue(content)
    res.json({
      agent: 'product-pricing',
      status: 'success',
      knowledgeBase,
      result: parsed || fallbackResult,
      isRuleFallback: !parsed
    })
  } catch (error) {
    res.json({
      agent: 'product-pricing',
      status: 'success',
      knowledgeBase,
      result: fallbackResult,
      isRuleFallback: true
    })
  }
})

// 3. 内容策划智能体
router.post('/content-planner', checkAccess, requireLevel('starter'), async (req, res) => {
  const { industry, audience5A, contentType, preference } = req.body

  res.json({
    agent: 'content-planner',
    status: 'success',
    topics: [
      {
        title: '90% 的人不知道的行业内幕',
        hook: '前 3 秒设置悬念',
        structure: '痛点 → 揭秘 → 解决方案',
        target5A: audience5A || 'A2'
      }
    ]
  })
})

// 4. 脚本生成智能体
router.post('/script-generator', checkAccess, requireLevel('starter'), async (req, res) => {
  const { industry, topic, format, duration, target } = req.body
  const fallbackScript = buildScriptFallback({ industry, topic, format, duration, target })

  try {
    const content = await generateStructured({
      systemPrompt: `你是抖音本地生活短视频脚本策划专家，服务中小企业老板。你必须输出可拍摄、可执行、符合平台节奏的分镜脚本 JSON，不输出 Markdown。`,
      userPrompt: `行业：${industry || '本地生活'}
核心主题或产品：${topic || '门店核心产品'}
脚本类型：${format || 'talking'}
视频时长：${duration || 30} 秒
目标人群：${target || '本地潜在客户'}

请生成一个 JSON 对象，字段必须包含：
- title: 脚本标题
- duration: 数字，视频秒数
- template: 中文脚本类型
- scenes: 数组，每项包含 time、action、text、bgm
- tips: 数组，3-5 条拍摄要点

要求：
1. 前 3 秒必须有强钩子。
2. 画面要适合本地商家真实拍摄。
3. 台词避免空泛口号，必须围绕主题和行业。
4. 结尾给一个明确行动引导。`,
      temperature: 0.8,
      max_tokens: 2200
    })
    const script = parseJsonValue(content) || fallbackScript

    res.json({
      agent: 'script-generator',
      status: 'success',
      script
    })
  } catch (error) {
    res.json({
      agent: 'script-generator',
      status: 'success',
      script: fallbackScript
    })
  }
})

// 5. 标题优化智能体
router.post('/title-optimizer', checkAccess, requireLevel('starter'), async (req, res) => {
  const { industry, originalTitle, style } = req.body
  const fallbackTitles = buildTitleFallback({ industry, originalTitle, style })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音本地生活标题优化专家，服务中小企业老板。你必须输出 JSON 数组，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[industry] || industry || '本地生活'}
原标题：${originalTitle || '门店内容'}
风格偏好：${style || 'mixed'}

请生成 5 个抖音短视频标题，JSON 数组格式，每项包含：
- text: 优化后的标题，30 字以内
- reason: 推荐理由，说明点击率提升逻辑

要求：
1. 标题必须适合本地生活商家真实发布。
2. 覆盖痛点、数字、悬念、利益、信任至少 3 类方向。
3. 禁止空泛口号和无法拍摄的标题。`,
      temperature: 0.85,
      max_tokens: 1800
    })
    const titles = parseJsonValue(content) || fallbackTitles

    res.json({
      agent: 'title-optimizer',
      status: 'success',
      titles: Array.isArray(titles) ? titles : fallbackTitles
    })
  } catch (error) {
    res.json({
      agent: 'title-optimizer',
      status: 'success',
      titles: fallbackTitles
    })
  }
})

// 6. 封面文案智能体
router.post('/cover-helper', checkAccess, requireLevel('starter'), async (req, res) => {
  const { topic, type } = req.body
  const fallbackCovers = buildCoverFallback({ topic, type })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音封面文案策划专家，擅长为本地生活商家生成封面大字钩子。你必须输出 JSON 数组，不输出 Markdown。',
      userPrompt: `视频主题：${topic || '门店服务'}
钩子类型：${type || 'mixed'}

请生成 5 条封面文案，JSON 数组格式，每项包含：
- type: 中文钩子类型
- text: 封面文案，建议 12 字以内
- reason: 推荐理由

要求：
1. 文案必须适合放在抖音封面大字。
2. 覆盖数字型、悬念型、痛点型、对比型等方向。
3. 避免夸张虚假承诺。`,
      temperature: 0.85,
      max_tokens: 1800
    })
    const covers = parseJsonValue(content) || fallbackCovers

    res.json({
      agent: 'cover-helper',
      status: 'success',
      covers: Array.isArray(covers) ? covers : fallbackCovers
    })
  } catch (error) {
    res.json({
      agent: 'cover-helper',
      status: 'success',
      covers: fallbackCovers
    })
  }
})

// 7. 数据诊断智能体
router.post('/data-diagnoser', checkAccess, requireLevel('pro'), async (req, res) => {
  const { views, likes, completes, saves, shares, comments } = req.body

  const viewRate = views > 0 ? (likes / views * 100).toFixed(1) : 0
  const completeRate = views > 0 ? (completes / views * 100).toFixed(1) : 0
  const saveRate = views > 0 ? (saves / views * 100).toFixed(1) : 0

  res.json({
    agent: 'data-diagnoser',
    analysis: {
      viewRate,
      completeRate,
      saveRate,
      issues: saveRate < 2 ? ['收藏率偏低，内容有用性不足'] : [],
      suggestions: ['在 15-25s 插入干货清单画面，引导截图收藏']
    }
  })
})

router.get('/review-records/latest', checkAccess, requireLevel('pro'), async (req, res) => {
  try {
    await ensureReviewRecordTable()
    const rows = await query(
      `SELECT id, industry, goal, source_context, input_data, result_data, effective_content_types, next_actions, created_at, updated_at
       FROM douyin_review_records
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.userId]
    )

    res.json({
      agent: 'data-diagnoser',
      status: rows.length ? 'success' : 'empty',
      reviewRecord: rows.length ? formatReviewRecord(rows[0]) : null
    })
  } catch (error) {
    res.status(500).json({ message: '读取最近复盘记录失败' })
  }
})

router.get('/review-records', checkAccess, requireLevel('pro'), async (req, res) => {
  try {
    await ensureReviewRecordTable()
    const rows = await query(
      `SELECT id, industry, goal, source_context, input_data, result_data, effective_content_types, next_actions, created_at, updated_at
       FROM douyin_review_records
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.userId]
    )

    res.json({
      agent: 'data-diagnoser',
      status: 'success',
      reviewRecords: rows.map(formatReviewRecord)
    })
  } catch (error) {
    res.status(500).json({ message: '读取复盘记录失败' })
  }
})

router.get('/review-records/insights', checkAccess, requireLevel('pro'), async (req, res) => {
  try {
    await ensureReviewRecordTable()
    const rows = await query(
      `SELECT id, industry, goal, source_context, input_data, result_data, effective_content_types, next_actions, created_at, updated_at
       FROM douyin_review_records
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.userId]
    )
    const records = rows.map(formatReviewRecord)

    res.json({
      agent: 'data-diagnoser',
      status: records.length ? 'success' : 'empty',
      insights: buildReviewInsights(records)
    })
  } catch (error) {
    res.status(500).json({ message: '生成复盘洞察失败' })
  }
})

router.post('/review-records', checkAccess, requireLevel('pro'), async (req, res) => {
  const {
    industry = null,
    goal = null,
    sourceContext = {},
    inputData,
    resultData,
    effectiveContentTypes = [],
    nextActions = []
  } = req.body

  if (!inputData || typeof inputData !== 'object' || !resultData || typeof resultData !== 'object') {
    return res.status(400).json({ message: '复盘输入和诊断结果不能为空' })
  }

  try {
    await ensureReviewRecordTable()
    const inserted = await query(
      `INSERT INTO douyin_review_records
       (user_id, industry, goal, source_context, input_data, result_data, effective_content_types, next_actions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        industry,
        goal,
        JSON.stringify(sourceContext || {}),
        JSON.stringify(inputData),
        JSON.stringify(resultData),
        JSON.stringify(Array.isArray(effectiveContentTypes) ? effectiveContentTypes : []),
        JSON.stringify(Array.isArray(nextActions) ? nextActions : [])
      ]
    )

    const rows = await query(
      `SELECT id, industry, goal, source_context, input_data, result_data, effective_content_types, next_actions, created_at, updated_at
       FROM douyin_review_records
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [inserted.insertId, req.userId]
    )

    res.json({
      agent: 'data-diagnoser',
      status: 'success',
      reviewRecord: rows.length ? formatReviewRecord(rows[0]) : null
    })
  } catch (error) {
    res.status(500).json({ message: '保存复盘记录失败' })
  }
})

// 8. 投流计算器智能体
router.post('/ad-calculator', checkAccess, requireLevel('pro'), async (req, res) => {
  const { budget, platform, goal, cpc, conversionRate } = req.body

  const expectedClicks = budget / (cpc || 2)
  const expectedConversions = expectedClicks * (conversionRate || 0.03)
  const cpa = expectedConversions > 0 ? budget / expectedConversions : 0

  res.json({
    agent: 'ad-calculator',
    result: {
      expectedClicks: Math.round(expectedClicks),
      expectedConversions: Math.round(expectedConversions),
      cpa: cpa.toFixed(2),
      recommendation: cpa > 80 ? 'CPA 偏高，建议优化素材定向' : 'CPA 健康，可适当加投'
    }
  })
})

// 9. 完整战略智能体（引导 1v1）
router.post('/full-strategy-legacy', checkAccess, requireLevel('annual'), async (req, res) => {
  // 即使高阶会员也只显示骨架，引导 1v1
  res.json({
    agent: 'full-strategy',
    status: 'locked',
    phases: [
      { name: '第 1-30 天：蓄水期', detail: null },
      { name: '第 31-60 天：爆发期', detail: null },
      { name: '第 61-90 天：稳定期', detail: null }
    ],
    upgradePath: {
      type: '1v1_consultation',
      title: '预约专家定制全案',
      description: 'AI 生成草稿 + 运营专家沟通润色 = 尊享定制报告',
      contactHint: '提交需求后，专属顾问将在 24 小时内联系您'
    }
  })
})

router.post('/quick-plan', checkAccess, requireLevel('pro'), async (req, res) => {
  const { industry, goal, frequency, adSupport, diagnosisContext = {} } = req.body
  const quickPlanInput = normalizeQuickPlanInput({ industry, goal, frequency, adSupport, diagnosisContext })
  const rulePlan = buildQuickPlanFromTemplates(quickPlanInput)

  if (diagnosisContext.source || diagnosisContext.metrics || diagnosisContext.profile || diagnosisContext.weakness) {
    return res.json({
      agent: 'quick-plan',
      status: 'success',
      plan: rulePlan,
      isRuleFallback: true,
      upgradeHint: '升级高阶会员可获得 30 天长期赛马表和投流复盘模板。'
    })
  }

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音本地生活 15 天速胜计划专家。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[quickPlanInput.industryCode] || quickPlanInput.industryCode || '本地生活'}
目标：${quickPlanInput.goalCode}
每日更新频率：${quickPlanInput.frequency || 1}
投流方式：${quickPlanInput.adSupport || 'no'}
诊断上下文：
- 来源：${quickPlanInput.diagnosisContext.source || '手动生成'}
- 主短板：${quickPlanInput.diagnosisContext.weakness || '未提供'}
- 诊断分型：${quickPlanInput.diagnosisContext.profile || '未提供'}
- 置信度：${quickPlanInput.diagnosisContext.confidence || '未提供'}
- 关键数据摘要：${quickPlanInput.diagnosisContext.metrics || '未提供'}
- 用户自述瓶颈：${quickPlanInput.diagnosisContext.bottleneck || '未提供'}
- 目标客户：${quickPlanInput.diagnosisContext.targetAudience || '未提供'}
- 主推产品：${quickPlanInput.diagnosisContext.coreOffer || '未提供'}
- 价格权益：${quickPlanInput.diagnosisContext.offerPrice || '未提供'}
- 用户顾虑：${quickPlanInput.diagnosisContext.userObjection || '未提供'}
- 可拍证明：${quickPlanInput.diagnosisContext.proofAssets || '未提供'}
- 承接路径：${quickPlanInput.diagnosisContext.conversionPath || '未提供'}
- 复盘沉淀的有效内容类型：${quickPlanInput.diagnosisContext.effectiveTypes || '未提供'}
- 下一轮复盘建议：${quickPlanInput.diagnosisContext.reviewSuggestion || '未提供'}

请生成一个 JSON 对象，字段包含 title、summary、riskBoundary、phases。
riskBoundary 必须为 3 条字符串数组，覆盖数据复盘边界、投流放量边界、行业合规边界。
phases 必须为三个阶段数组，每个阶段包含 name、days。
days 的每一项必须包含以下字段：
- day: 1-15 的数字
- phase: 测试期、放大期或收割期
- goal: 今日目标，老板能直接执行
- action: 与 goal 保持一致，用于兼容旧版前端
- workType: 作品类型，例如测试内容、赛马内容、转化内容、案例内容、复盘记录
- videoFunction: 视频功能，例如同城拉新、信任建立、成交转化、数据复盘
- shootingMethod: 拍摄方式，例如老板口播、门店实拍、顾客案例、口播 + 门店画面、数据表复盘
- topicDirection: 内容方向，要具体到当天选题
- content: 与 topicDirection 保持一致，用于兼容旧版前端
- executionTool: 执行工具，优先从脚本生成器、标题优化器、封面助手、转化链路、本地推策略、投流评估、视频数据诊断中选择 1-3 个
- adPlan: 投流安排，若不投流也要写自然流量执行安排
- ad: 与 adPlan 保持一致，用于兼容旧版前端
- customerNurture: 客户培育动作，例如评论承接、私信促单、企微跟进、到店提醒、复购提醒
- reviewMetrics: 复盘指标，必须包含可观察指标
- kpi: 与 reviewMetrics 保持一致，用于兼容旧版前端
- shootingScript: 拍摄文案对象，必须包含 hook、shots、voiceover、cta、duration；shots 必须是 4 条镜头清单，voiceover 必须是当天可直接照读的口播文案
- status: 固定使用未开始、进行中、已完成、已复盘之一，默认 Day 1 为进行中，其余为未开始

要求：必须输出完整 15 天，不要省略任何字段，不要输出 Markdown。`,
      temperature: 0.78,
      max_tokens: 2600
    })
    const parsed = parseJsonValue(content)
    const plan = validateQuickPlanResult(parsed, quickPlanInput, { generationMode: parsed ? 'ai' : 'ruleFallback' })
    res.json({
      agent: 'quick-plan',
      status: 'success',
      plan,
      upgradeHint: '升级高阶会员可获得 30 天长期赛马表和投流复盘模板。'
    })
  } catch (error) {
    res.json({
      agent: 'quick-plan',
      status: 'success',
      plan: validateQuickPlanResult(null, quickPlanInput, { generationMode: 'ruleFallback' }),
      isRuleFallback: true,
      upgradeHint: '升级高阶会员可获得 30 天长期赛马表和投流复盘模板。'
    })
  }
})

router.get('/quick-plan/saved', checkAccess, requireLevel('pro'), async (req, res) => {
  try {
    await ensureQuickPlanTable()
    const rows = await query(
      'SELECT id, industry, goal, frequency, ad_support, plan_version, input_hash, diagnosis_context, plan, created_at, updated_at FROM douyin_quick_plans WHERE user_id = ? LIMIT 1',
      [req.userId]
    )

    if (!rows.length) {
      return res.json({ agent: 'quick-plan', status: 'empty', savedPlan: null })
    }

    res.json({
      agent: 'quick-plan',
      status: 'success',
      savedPlan: formatSavedQuickPlan(rows[0])
    })
  } catch (error) {
    res.status(500).json({ message: '读取已保存计划失败' })
  }
})

router.post('/quick-plan/saved', checkAccess, requireLevel('pro'), async (req, res) => {
  const { industry, goal, frequency, adSupport, diagnosisContext = {}, plan } = req.body
  const quickPlanInput = normalizeQuickPlanInput({ industry, goal, frequency, adSupport, diagnosisContext })

  if (!plan || typeof plan !== 'object') {
    return res.status(400).json({ message: '计划内容不能为空' })
  }

  const inputHash = createQuickPlanInputHash(quickPlanInput)
  if (plan.meta?.inputHash && plan.meta.inputHash !== inputHash) {
    return res.status(409).json({ message: '计划配置已变更，请重新生成后再保存' })
  }

  const normalizedPlan = validateQuickPlanResult(plan, quickPlanInput, { generationMode: plan?.meta?.generationMode || 'saved' })

  try {
    await ensureQuickPlanTable()
    await query(
      `INSERT INTO douyin_quick_plans (user_id, industry, goal, frequency, ad_support, plan_version, input_hash, diagnosis_context, plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         industry = VALUES(industry),
         goal = VALUES(goal),
         frequency = VALUES(frequency),
         ad_support = VALUES(ad_support),
         plan_version = VALUES(plan_version),
         input_hash = VALUES(input_hash),
         diagnosis_context = VALUES(diagnosis_context),
         plan = VALUES(plan),
         updated_at = CURRENT_TIMESTAMP`,
      [
        req.userId,
        quickPlanInput.industryCode,
        quickPlanInput.goalCode,
        String(quickPlanInput.frequency || '1'),
        quickPlanInput.adSupport || 'no',
        normalizedPlan.meta?.planVersion || 1,
        normalizedPlan.meta?.inputHash || null,
        JSON.stringify(quickPlanInput.diagnosisContext || {}),
        JSON.stringify(normalizedPlan)
      ]
    )

    const rows = await query(
      'SELECT id, industry, goal, frequency, ad_support, plan_version, input_hash, diagnosis_context, plan, created_at, updated_at FROM douyin_quick_plans WHERE user_id = ? LIMIT 1',
      [req.userId]
    )

    res.json({
      agent: 'quick-plan',
      status: 'success',
      savedPlan: rows.length ? formatSavedQuickPlan(rows[0]) : null
    })
  } catch (error) {
    res.status(500).json({ message: '保存计划失败' })
  }
})

router.patch('/quick-plan/saved/status', checkAccess, requireLevel('pro'), async (req, res) => {
  const { day, status } = req.body
  const allowedStatuses = ['未开始', '进行中', '已完成', '已复盘']

  if (!Number(day) || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: '任务状态参数无效' })
  }

  try {
    await ensureQuickPlanTable()
    const rows = await query(
      'SELECT id, industry, goal, frequency, ad_support, plan_version, input_hash, diagnosis_context, plan, created_at, updated_at FROM douyin_quick_plans WHERE user_id = ? LIMIT 1',
      [req.userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: '尚未保存计划' })
    }

    const savedPlan = formatSavedQuickPlan(rows[0])
    const nextPlan = savedPlan.plan
    for (const phase of nextPlan?.phases || []) {
      for (const item of phase.days || []) {
        if (Number(item.day) === Number(day)) {
          item.status = status
        }
      }
    }

    await query(
      'UPDATE douyin_quick_plans SET plan = ?, plan_version = ?, input_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [
        JSON.stringify(nextPlan),
        nextPlan.meta?.planVersion || savedPlan.planVersion || 1,
        nextPlan.meta?.inputHash || savedPlan.inputHash || null,
        req.userId
      ]
    )

    res.json({
      agent: 'quick-plan',
      status: 'success',
      savedPlan: {
        ...savedPlan,
        planVersion: nextPlan.meta?.planVersion || savedPlan.planVersion,
        inputHash: nextPlan.meta?.inputHash || savedPlan.inputHash || null,
        plan: nextPlan,
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({ message: '更新任务状态失败' })
  }
})

router.post('/conversion-path', checkAccess, requireLevel('starter'), async (req, res) => {
  const { scenario, industry } = req.body
  const fallbackResult = buildConversionPathFallback({ scenario, industry })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音本地生活转化链路 SOP 专家，擅长团购、私信留资和企微承接。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[industry] || industry || '本地生活'}
转化场景：${scenario || 'group-buy'}

请生成一个 JSON 对象，字段包含：
- title: 方案标题
- funnel: 数组，每项包含 label、desc
- checklist: 数组，每项包含 text、done，done 固定为 false

要求：
1. funnel 要覆盖从内容触达到最终成交的完整链路。
2. checklist 要给 8-10 条可执行检查项。
3. 必须符合平台合规要求，避免直接诱导展示手机号、微信号。`,
      temperature: 0.76,
      max_tokens: 2200
    })
    const parsed = parseJsonValue(content)
    res.json({
      agent: 'conversion-path',
      status: 'success',
      result: parsed || fallbackResult,
      upgradeHint: '升级高阶会员可获得行业转化话术库、自动回复模板和成交追踪表。'
    })
  } catch (error) {
    res.json({
      agent: 'conversion-path',
      status: 'success',
      result: fallbackResult,
      isRuleFallback: true,
      upgradeHint: '升级高阶会员可获得行业转化话术库、自动回复模板和成交追踪表。'
    })
  }
})

router.post('/local-ad-strategy', checkAccess, requireLevel('pro'), async (req, res) => {
  const { industry, goal, dailyBudget, range } = req.body
  const fallbackResult = buildLocalAdFallback({ industry, goal, dailyBudget, range })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音本地推投放策略专家。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[industry] || industry || '本地生活'}
投放目标：${goal || 'store'}
日预算：${dailyBudget || 0}
覆盖范围：${range || '5km'}

请生成一个 JSON 对象，字段包含 title、summary、targeting、creatives、bidding、schedule、budgetAllocation。`,
      temperature: 0.75,
      max_tokens: 2200
    })
    const parsed = parseJsonValue(content)
    res.json({
      agent: 'local-ad-strategy',
      status: 'success',
      result: parsed || fallbackResult,
      upgradeHint: '升级高阶会员可获得更细的地域分层和素材轮播建议。'
    })
  } catch (error) {
    res.json({
      agent: 'local-ad-strategy',
      status: 'success',
      result: fallbackResult,
      isRuleFallback: true,
      upgradeHint: '升级高阶会员可获得更细的地域分层和素材轮播建议。'
    })
  }
})

router.post('/ip-positioning', checkAccess, requireLevel('pro'), async (req, res) => {
  const { industry, personality, experience, goal } = req.body
  const fallbackResult = buildIpPositioningFallback({ industry, personality, experience, goal })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音老板 IP 定位专家。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[industry] || industry || '本地生活'}
性格特质：${personality || 'professional'}
从业年限：${experience || '5-10'}
IP 目标：${goal || 'trust'}

请生成一个 JSON 对象，字段包含 ipName、slogan、tags、pillars、dos、donts。`,
      temperature: 0.8,
      max_tokens: 2200
    })
    const parsed = parseJsonValue(content)
    res.json({
      agent: 'ip-positioning',
      status: 'success',
      result: parsed || fallbackResult,
      upgradeHint: '升级高阶会员可获得年度内容日历和人设一致性检查表。'
    })
  } catch (error) {
    res.json({
      agent: 'ip-positioning',
      status: 'success',
      result: fallbackResult,
      isRuleFallback: true,
      upgradeHint: '升级高阶会员可获得年度内容日历和人设一致性检查表。'
    })
  }
})

router.post('/full-strategy', checkAccess, requireLevel('annual'), async (req, res) => {
  const { industry } = req.body
  const fallbackStrategy = buildFullStrategyFallback({ industry })

  try {
    const content = await generateStructured({
      systemPrompt: '你是抖音 90 天周期战略专家。你必须输出 JSON，不输出 Markdown。',
      userPrompt: `行业：${industryNameMap[industry] || industry || '本地生活'}

请生成一个 JSON 对象，字段包含 title、summary、phases。phases 为三个阶段数组，每个阶段包含 badge、badgeClass、name、desc、tasks、metrics、locked。`,
      temperature: 0.72,
      max_tokens: 2400
    })
    const parsed = parseJsonValue(content)
    res.json({
      agent: 'full-strategy',
      status: 'locked',
      phases: parsed?.phases || fallbackStrategy.phases,
      upgradePath: {
        type: '1v1_consultation',
        title: '预约专家定制全案',
        description: 'AI 生成草稿 + 运营专家沟通润色 = 尊享定制报告',
        contactHint: '提交需求后，专属顾问将在 24 小时内联系您'
      },
      title: parsed?.title || fallbackStrategy.title,
      summary: parsed?.summary || fallbackStrategy.summary,
      isRuleFallback: !parsed
    })
  } catch (error) {
    res.json({
      agent: 'full-strategy',
      status: 'locked',
      phases: fallbackStrategy.phases,
      upgradePath: {
        type: '1v1_consultation',
        title: '预约专家定制全案',
        description: 'AI 生成草稿 + 运营专家沟通润色 = 尊享定制报告',
        contactHint: '提交需求后，专属顾问将在 24 小时内联系您'
      },
      title: fallbackStrategy.title,
      summary: fallbackStrategy.summary,
      isRuleFallback: true
    })
  }
})

export default router

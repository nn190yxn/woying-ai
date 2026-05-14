import express from 'express'
import { query } from '../models/db.js'
import { generateStructured } from '../services/ai.js'
import { isAiAvailabilityError } from '../services/failover.js'
import { getKBContextWithMeta, getMaxTokensForLevel, getTemperatureForTool } from '../services/kbService.js'

const router = express.Router()

const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const industryLabelMap = {
  restaurant: '餐饮',
  beauty: '美业',
  education: '教培',
  service: '生活服务'
}

const getIndustryLabel = (industry) => industryLabelMap[industry] || '本地门店'

const AGENT_KB_TOOL = {
  diagnosis: 'douyin-growth',
  product_pricing: 'douyin-growth',
  content_planner: 'topic',
  script_generator: 'script',
  data_diagnoser: 'douyin-growth',
  ad_calculator: 'douyin-growth',
  full_strategy: 'douyin-growth'
}

const buildKnowledgeAiNotes = (notes = []) => [
  ...notes,
  '本工具主链路为知识库 + AI 生成，输出仍需结合账号历史均值、同城竞争强度、客单价、毛利和履约能力复核。',
  '如缺少历史数据，请先用小预算或 7-14 天内容测试建立自己的基线，再决定是否放大。'
]

const buildFallbackNotes = (notes = []) => [
  '本次为降级生成结果：知识库 + AI 主链路中的 AI 生成服务暂不可用，系统已使用知识库规则兜底输出；建议 AI 服务恢复后再生成一次做深度细化。',
  ...buildKnowledgeAiNotes(notes)
]

function parseJsonObject(rawText) {
  const text = String(rawText || '').trim()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function buildMeta(agentKey, kbResult, extra = {}) {
  return {
    agentType: 'knowledge-ai',
    kbToolCode: AGENT_KB_TOOL[agentKey],
    kbFilesUsed: kbResult.meta?.kbFilesUsed || [],
    kbFilesMissing: kbResult.meta?.kbFilesMissing || [],
    kbSectionsMissing: kbResult.meta?.kbSectionsMissing || [],
    kbContextChars: kbResult.meta?.contextChars || 0,
    kbRetrievalMode: kbResult.meta?.retrievalMode || 'mapping_only',
    ...extra
  }
}

function normalizeAiPayload(agentKey, parsed) {
  const base = {
    agent: agentKey,
    status: 'success',
    engineType: 'knowledge-ai',
    degraded: false
  }

  switch (agentKey) {
    case 'diagnosis':
      return { ...base, result: parsed.result || parsed }
    case 'product_pricing':
      return { ...base, result: parsed.result || parsed, knowledgeBase: parsed.knowledgeBase }
    case 'content_planner':
      return { ...base, topics: parsed.topics || parsed.result?.topics || [], riskNotes: parsed.riskNotes || parsed.result?.riskNotes || [] }
    case 'script_generator':
      return { ...base, script: parsed.script || parsed.result?.script || parsed }
    case 'data_diagnoser':
      return { ...base, analysis: parsed.analysis || parsed.result || parsed }
    case 'ad_calculator':
      return { ...base, result: parsed.result || parsed }
    case 'full_strategy':
      return { ...base, phases: parsed.phases || parsed.result?.phases || [], upgradePath: parsed.upgradePath || parsed.result?.upgradePath }
    default:
      return { ...base, result: parsed }
  }
}

async function runKnowledgeAiAgent(agentKey, req, fallbackBuilder, promptBuilder) {
  const kbToolCode = AGENT_KB_TOOL[agentKey] || 'douyin-growth'
  const memberLevel = req.userLevel || 'free'
  const kbResult = getKBContextWithMeta(kbToolCode, memberLevel, req.body)
  const industry = getIndustryLabel(req.body?.industry)
  const systemPrompt = `你是抖音本地生活经营顾问，服务对象是中小商家老板。

你的输出必须基于“知识库上下文 + 用户输入”生成。
如果知识库上下文不足，要明确哪些结论需要用账号后台、门店经营数据或投放后台二次复核。
不要虚构平台官方规则、绝对转化率或统一行业硬基准。
必须输出 JSON 对象，不要输出 Markdown。`

  const userPrompt = `${promptBuilder(req.body, industry)}

【知识库上下文】
${kbResult.context || '未命中专属知识切片，请基于用户输入和可复核经营指标输出，并明确需要用户二次确认的数据。'}`

  try {
    const raw = await generateStructured({
      systemPrompt,
      userPrompt,
      temperature: getTemperatureForTool(kbToolCode),
      max_tokens: getMaxTokensForLevel(kbToolCode, memberLevel)
    })
    const parsed = parseJsonObject(raw)
    if (!parsed) {
      throw new Error('AI 返回内容无法解析为 JSON')
    }

    const payload = normalizeAiPayload(agentKey, parsed)
    return {
      ...payload,
      meta: buildMeta(agentKey, kbResult, { aiUsed: true })
    }
  } catch (error) {
    const fallbackPayload = fallbackBuilder(req.body)
    return {
      ...fallbackPayload,
      agent: agentKey,
      status: 'success',
      engineType: 'knowledge-ai',
      degraded: true,
      fallbackType: 'rule-based-rag',
      meta: buildMeta(agentKey, kbResult, {
        aiUsed: false,
        fallbackReason: isAiAvailabilityError(error) ? 'ai_unavailable' : 'ai_or_parse_failed'
      })
    }
  }
}

const checkAccess = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权', requiredLevel: 'free' })
  }

  try {
    const jwt = await import('jsonwebtoken')
    const token = authHeader.split(' ')[1]
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'woai-ai-secret-key')

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

function buildDiagnosisFallback(formData) {
  const { industry, mode, painPoints } = formData
  const selectedPains = Array.isArray(painPoints) ? painPoints : []
  const hasPain = (keyword) => selectedPains.some(item => String(item).includes(keyword))
  const radarData = {
    conversion: hasPain('转化') || hasPain('核销') ? 35 : 65,
    traffic: hasPain('流量') || hasPain('播放') ? 40 : 68,
    content: hasPain('内容') || hasPain('不知道拍') ? 42 : 66,
    retention: hasPain('复购') || hasPain('留存') ? 45 : 62,
    profit: hasPain('投流') || hasPain('ROI') ? 48 : 64
  }
  const weakest = Object.entries(radarData).sort((a, b) => a[1] - b[1])[0]
  const weakLabel = {
    conversion: '转化链路',
    traffic: '同城流量',
    content: '内容供给',
    retention: '复购留存',
    profit: '投流利润'
  }[weakest[0]]

  return {
    result: {
      radarData,
      diagnosis: `${getIndustryLabel(industry)}账号当前最需要优先复盘的是${weakLabel}。${mode === 'group-buy' ? '团购模式要同步看曝光、点击、下单、核销和复购。' : '线索模式要同步看留资、私信响应、到店和成交。'}`,
      suggestions: [
        '先把近 30 天内容按播放、完播、互动、私信和成交线索分层，找出可复用样本',
        mode === 'group-buy' ? '把主推团购套餐拆成引流款、承接款和利润款，分别看点击、下单与核销' : '把线索入口、私信回复和到店邀约拆开记录，避免只统计表单数',
        '设置私信自动回复与人工跟进时限，确保高意向用户不流失'
      ],
      riskNotes: buildFallbackNotes(['诊断分数来自用户勾选痛点和知识库兜底权重，不代表平台官方账号评分。'])
    }
  }
}

function buildProductPricingFallback(formData) {
  const { industry, stage } = formData
  return {
    knowledgeBase: AGENT_KB_TOOL.product_pricing,
    result: industry === 'restaurant'
      ? {
        type: '团购交易型',
        stage,
        products: [
          { role: '引流款', name: '9.9 元秒杀单人餐', price: 9.9, target: '拉升 GMV，触发同城推荐', limit: '每日 20 份' },
          { role: '主推款', name: '128 元双人招牌套餐', price: 128, target: '承接流量，核销率按账号历史团购均值复核', margin: '需按菜品成本卡复核' },
          { role: '利润款', name: '199 元四人聚餐', price: 199, target: '拉升毛利，优先放在周末和高峰场景', margin: '需按桌均毛利复核' },
          { role: '复购款', name: '299 元三次卡', price: 299, target: '观察 30 天复购趋势', margin: '需按履约成本复核' }
        ],
        warnings: buildFallbackNotes(['引流款占比需要按毛利、库存、核销时段和承接能力控制。']),
        upgradeHint: '生成完整 SKU 定价测算表需升级高阶会员或预约 1v1 咨询'
      }
      : {
        type: '线索留资型',
        stage,
        products: [
          { role: '引流款', name: '49 元初次体验', price: 49, target: '到店率按历史预约和同城渠道分别复核', conversion: '留资率需按投放入口和私信承接拆开看' },
          { role: '主推款', name: '1280 元季度疗程', price: 1280, target: '7 天内升单率以门店历史体验客为基线', conversion: '跟进 SOP 执行' },
          { role: '利润款', name: '3980 元年度 VIP', price: 3980, target: '老客复购按项目周期和耗卡节奏复核', conversion: '专属服务' },
          { role: '防御款', name: '599 元单项卡', price: 599, target: '守住价格底线', conversion: '不打价格战' }
        ],
        warnings: buildFallbackNotes(['线索成本和到店转化率必须按城市、项目客单、渠道入口和客服响应时效拆开判断。']),
        upgradeHint: '定制升单话术 SOP 需预约专家 1v1'
      }
  }
}

function buildContentPlannerFallback(formData) {
  const { industry, audience5A, preference } = formData
  return {
    topics: [
      { title: `${getIndustryLabel(industry)}客户最常问的 3 个问题`, hook: '前 3 秒先抛出真实客户疑问', structure: '客户问题 → 真实场景 → 判断方法 → 行动建议', target5A: audience5A || 'A2' },
      { title: `${preference || '门店'}服务为什么值得现在体验`, hook: '用对比展示客户决策前后的变化', structure: '旧做法 → 新体验 → 证据 → 到店/私信引导', target5A: audience5A || 'A3' }
    ],
    riskNotes: buildFallbackNotes(['选题发布前需要替换为真实案例、真实场景和门店可履约承诺。'])
  }
}

function buildScriptFallback(formData) {
  const safeTopic = formData.topic || '主推产品'
  const seconds = toNumber(formData.duration, 30)
  return {
    script: {
      title: `${safeTopic}短视频脚本`,
      format: formData.format || 'talking',
      duration: seconds,
      '0-3s': `钩子：做${safeTopic}前，先看这个容易被忽略的细节`,
      '3-15s': `痛点：很多客户只看到价格，却没看懂${safeTopic}背后的效果、流程和风险边界`,
      '15-30s': '解决方案：用一个真实场景讲清服务步骤、关键判断点和适合人群',
      '30-45s': seconds > 30 ? '行动引导：引导评论关键词或私信咨询，并说明预约前需要确认的信息' : '行动引导：引导评论关键词或私信咨询'
    },
    riskNotes: buildFallbackNotes(['脚本不能替代真实拍摄素材，必须把台词里的场景、案例和承诺替换为门店真实内容。'])
  }
}

function buildDataDiagnoserFallback(formData) {
  const views = toNumber(formData.views)
  const likes = toNumber(formData.likes)
  const completes = toNumber(formData.completes)
  const saves = toNumber(formData.saves)
  const shares = toNumber(formData.shares)
  const comments = toNumber(formData.comments)
  const viewRate = views > 0 ? (likes / views * 100).toFixed(1) : '0.0'
  const completeRate = views > 0 ? (completes / views * 100).toFixed(1) : '0.0'
  const saveRate = views > 0 ? (saves / views * 100).toFixed(1) : '0.0'
  const interactionRate = views > 0 ? ((likes + saves + shares + comments) / views * 100).toFixed(1) : '0.0'

  return {
    analysis: {
      viewRate,
      completeRate,
      saveRate,
      interactionRate,
      issues: [
        toNumber(saveRate) < 2 ? '收藏率低于当前样本观察线，需复盘内容是否足够可保存' : null,
        toNumber(completeRate) < 20 ? '完播偏弱，需复盘前 3 秒钩子和信息密度' : null
      ].filter(Boolean),
      suggestions: [
        '在 15-25s 插入清单、步骤或对比画面，引导截图收藏',
        '把本条视频与账号近 30 天同类型内容比较，避免只按单条数据下结论'
      ],
      riskNotes: buildFallbackNotes(['数据诊断未接入平台官方后台，只基于用户填写数据做知识库兜底分析。'])
    }
  }
}

function buildAdCalculatorFallback(formData) {
  const budget = toNumber(formData.budget)
  const cpc = toNumber(formData.cpc, 2)
  const conversionRate = toNumber(formData.conversionRate, 0.03)
  const expectedClicks = cpc > 0 ? budget / cpc : 0
  const expectedConversions = expectedClicks * conversionRate
  const cpa = expectedConversions > 0 ? budget / expectedConversions : 0

  return {
    result: {
      expectedClicks: Math.round(expectedClicks),
      expectedConversions: Math.round(expectedConversions),
      cpa: cpa.toFixed(2),
      recommendation: cpa > 80
        ? 'CPA 高于本次输入目标的观察线，建议先优化素材、定向和承接页，再考虑加预算'
        : 'CPA 暂时低于本次输入目标的观察线，可以小幅加预算继续验证，但需同步看成交质量和毛利',
      riskNotes: buildFallbackNotes(['默认 CPC 和转化率仅用于估算，正式投放必须使用后台真实消耗、转化和成交数据复盘。'])
    }
  }
}

router.post('/diagnosis', checkAccess, requireLevel('free'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'diagnosis',
    req,
    buildDiagnosisFallback,
    (formData, industry) => `任务：生成抖音经营体检诊断。
行业：${industry}
经营模式：${formData.mode || '未说明'}
用户勾选痛点：${JSON.stringify(formData.painPoints || [])}

请输出 JSON：
{
  "result": {
    "radarData": {"conversion": 0-100, "traffic": 0-100, "content": 0-100, "retention": 0-100, "profit": 0-100},
    "diagnosis": "诊断结论",
    "suggestions": ["建议1", "建议2", "建议3"],
    "riskNotes": ["风险说明"]
  }
}`
  )
  res.json(payload)
})

router.post('/product-pricing', checkAccess, requireLevel('pro'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'product_pricing',
    req,
    buildProductPricingFallback,
    (formData, industry) => `任务：生成抖音团购/线索组品定价方案。
行业：${industry}
阶段：${formData.stage || '未说明'}
现有产品：${JSON.stringify(formData.currentProducts || formData.products || [])}
成本结构：${JSON.stringify(formData.costStructure || {})}
竞品价格带：${JSON.stringify(formData.competitorRange || {})}

请输出 JSON：
{
  "result": {
    "type": "团购交易型或线索留资型",
    "stage": "阶段",
    "products": [{"role":"角色","name":"产品名","price":数字或字符串,"target":"目标","margin":"毛利/复核口径"}],
    "warnings": ["风险提示"],
    "upgradeHint": "升级提示"
  }
}`
  )
  res.json(payload)
})

router.post('/content-planner', checkAccess, requireLevel('starter'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'content_planner',
    req,
    buildContentPlannerFallback,
    (formData, industry) => `任务：生成抖音内容策划选题。
行业：${industry}
5A 人群阶段：${formData.audience5A || '未说明'}
内容类型：${formData.contentType || '未说明'}
偏好/主推方向：${formData.preference || '未说明'}

请输出 JSON：
{
  "topics": [{"title":"选题","hook":"开头钩子","structure":"内容结构","target5A":"5A阶段"}],
  "riskNotes": ["风险说明"]
}`
  )
  res.json(payload)
})

router.post('/script-generator', checkAccess, requireLevel('starter'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'script_generator',
    req,
    buildScriptFallback,
    (formData, industry) => `任务：生成抖音短视频分镜脚本。
行业：${industry}
主题/产品：${formData.topic || '未说明'}
格式：${formData.format || '未说明'}
时长：${formData.duration || '未说明'}

请输出 JSON：
{
  "script": {
    "title": "脚本标题",
    "format": "脚本类型",
    "duration": 数字,
    "0-3s": "开头",
    "3-15s": "主体一",
    "15-30s": "主体二",
    "30-45s": "行动引导"
  },
  "riskNotes": ["风险说明"]
}`
  )
  res.json(payload)
})

router.post('/data-diagnoser', checkAccess, requireLevel('pro'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'data_diagnoser',
    req,
    buildDataDiagnoserFallback,
    (formData, industry) => `任务：生成抖音视频数据诊断。
行业：${industry}
数据：${JSON.stringify({
      views: formData.views,
      likes: formData.likes,
      completes: formData.completes,
      saves: formData.saves,
      shares: formData.shares,
      comments: formData.comments
    })}

请输出 JSON：
{
  "analysis": {
    "viewRate": "点赞/播放百分比",
    "completeRate": "完播/播放百分比",
    "saveRate": "收藏/播放百分比",
    "interactionRate": "互动/播放百分比",
    "issues": ["问题"],
    "suggestions": ["建议"],
    "riskNotes": ["风险说明"]
  }
}`
  )
  res.json(payload)
})

router.post('/ad-calculator', checkAccess, requireLevel('pro'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'ad_calculator',
    req,
    buildAdCalculatorFallback,
    (formData, industry) => `任务：生成抖音投流测算和投放建议。
行业：${industry}
预算：${formData.budget || 0}
平台：${formData.platform || '抖音'}
目标：${formData.goal || '未说明'}
CPC：${formData.cpc || '未说明'}
转化率：${formData.conversionRate || '未说明'}

请输出 JSON：
{
  "result": {
    "expectedClicks": 数字,
    "expectedConversions": 数字,
    "cpa": "数字字符串",
    "recommendation": "建议",
    "riskNotes": ["风险说明"]
  }
}`
  )
  res.json(payload)
})

router.post('/full-strategy', checkAccess, requireLevel('annual'), async (req, res) => {
  const payload = await runKnowledgeAiAgent(
    'full_strategy',
    req,
    () => ({
      phases: [
        { name: '第 1-30 天：蓄水期', detail: null },
        { name: '第 31-60 天：爆发期', detail: null },
        { name: '第 61-90 天：稳定期', detail: null }
      ],
      upgradePath: {
        type: '1v1_consultation',
        title: '预约专家定制全案',
        description: '知识库初稿 + AI 生成 + 运营专家沟通润色 = 尊享定制报告',
        contactHint: '提交需求后，专属顾问将在 24 小时内联系您'
      }
    }),
    (formData, industry) => `任务：生成抖音 90 天完整战略框架。
行业：${industry}
用户输入：${JSON.stringify(formData || {})}

请输出 JSON：
{
  "phases": [{"name":"阶段名","detail":"阶段策略"}],
  "upgradePath": {"type":"1v1_consultation","title":"预约专家定制全案","description":"说明","contactHint":"联系提示"}
}`
  )
  res.json(payload)
})

export default router

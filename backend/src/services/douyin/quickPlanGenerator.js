import { createQuickPlanInputHash, normalizeQuickPlanInput } from './quickPlanInput.js'
import { getGoalStrategy, getIndustryStrategy } from './quickPlanStrategies.js'
import { groupQuickPlanTemplatesByPhase } from './quickPlanTemplates.js'

export const QUICK_PLAN_RESULT_VERSION = 2

export const quickPlanCompatFieldPairs = [
  ['goal', 'action'],
  ['topicDirection', 'content'],
  ['adPlan', 'ad'],
  ['reviewMetrics', 'kpi']
]

const firstPresent = (...values) => values.find((value) => value !== undefined && value !== null && value !== '')

const modeLabels = {
  'group-buy': '团购成交',
  appointment: '预约到店',
  leads: '留资咨询',
  live: '直播预热'
}

const weaknessLabels = {
  traffic: '流量冷启动',
  content: '内容完播不足',
  conversion: '转化承接不足',
  retention: '复购和私域承接不足',
  ads: '投流效率不足'
}

const normalizeText = (value, fallback = '') => String(firstPresent(value, fallback) || '').trim()

const replaceIntentTokens = (text, research) => normalizeText(text)
  .replaceAll('主推产品', research.coreOffer)
  .replaceAll('用户顾虑', research.objection)
  .replaceAll('证明素材', research.proofAssets)
  .replaceAll('价格权益', research.offerPrice)
  .replaceAll('转化路径', research.conversionPath)
  .replaceAll('目标客户', research.audience)

const getProofItem = (proofAssets, index) => {
  const items = normalizeText(proofAssets).split(/[、,，]/).map((item) => item.trim()).filter(Boolean)
  return items[index] || items[0] || proofAssets
}

const buildResearchContext = ({ normalizedInput, industryStrategy, goalStrategy }) => {
  const diagnosisContext = normalizedInput.diagnosisContext || {}
  const modeLabel = modeLabels[normalizedInput.mode] || normalizedInput.mode || '本地生活经营'
  const weaknessLabel = weaknessLabels[diagnosisContext.weakness] || diagnosisContext.painSummary || goalStrategy.name
  const adSupport = normalizedInput.adSupport
  const hasAd = adSupport === true || ['yes', 'dou', 'local'].includes(adSupport)
  const adLabel = adSupport === 'dou' ? 'DOU+ ' : adSupport === 'local' ? '本地推' : ''

  return {
    industryName: industryStrategy.name,
    goalName: goalStrategy.name,
    modeLabel,
    weaknessLabel,
    audience: normalizeText(diagnosisContext.targetAudience, industryStrategy.customerType),
    bottleneck: normalizeText(diagnosisContext.bottleneck || diagnosisContext.painSummary, weaknessLabel),
    currentAction: normalizeText(diagnosisContext.currentAction, `每周发布 ${normalizedInput.frequency} 条内容并观察数据`),
    coreOffer: normalizeText(diagnosisContext.coreOffer, industryStrategy.defaultProduct),
    offerPrice: normalizeText(diagnosisContext.offerPrice, industryStrategy.defaultOfferPrice),
    objection: normalizeText(diagnosisContext.userObjection, industryStrategy.defaultObjection),
    proofAssets: normalizeText(diagnosisContext.proofAssets, industryStrategy.proofAssets),
    conversionPath: normalizeText(diagnosisContext.conversionPath, industryStrategy.conversionPath),
    painSummary: normalizeText(diagnosisContext.painSummary, weaknessLabel),
    metrics: normalizeText(diagnosisContext.metrics, '当前数据样本较少，先用播放、完播、评论和私信做快速校准'),
    frequency: Number(normalizedInput.frequency) || 1,
    hasAd,
    adLabel,
    conversionMetric: industryStrategy.conversionMetric,
    actionEntry: industryStrategy.actionEntry,
    sceneAssets: industryStrategy.sceneAssets,
    cta: goalStrategy.cta,
    phaseFocus: goalStrategy.phaseFocus || [],
    goalMetrics: goalStrategy.reviewMetrics || []
  }
}

const buildResearchBrief = ({ normalizedInput, research }) => {
  const diagnosisContext = normalizedInput.diagnosisContext || {}
  return [
    `经营模式：${research.modeLabel}；主短板：${research.weaknessLabel}`,
    `目标客户：${research.audience}`,
    `主推产品：${research.coreOffer}`,
    `价格权益：${research.offerPrice}`,
    `用户顾虑：${research.objection}`,
    `可拍证明：${research.proofAssets}`,
    `承接方式：${research.conversionPath}`,
    diagnosisContext.currentAction ? `当前动作：${diagnosisContext.currentAction}` : '',
    diagnosisContext.bottleneck ? `老板自述卡点：${diagnosisContext.bottleneck}` : '',
    diagnosisContext.painSummary ? `痛点勾选：${diagnosisContext.painSummary}` : '',
    diagnosisContext.metrics ? `数据基线：${diagnosisContext.metrics}` : ''
  ].filter(Boolean)
}

const buildRiskBoundary = ({ research, industryStrategy }) => [
  '15 天计划适合作为短周期验证表，每天需要用播放、完播、互动、私信、核销或留资数据逐日复盘。',
  research.hasAd
    ? '投流预算建议先小额测试，高转化素材再加投，避免未验证素材直接放大。'
    : '自然流量阶段应优先验证选题、封面、前 3 秒和评论承接，先跑通内容模型再考虑投流。',
  ...industryStrategy.riskBoundary
]

const dayHooks = {
  1: (research) => `如果你是${research.audience}，又卡在“${research.bottleneck}”，先记住${research.coreOffer}的 3 个避坑点。`,
  2: (research) => `你现在这样做抖音：“${research.currentAction}”，今天换成真实过程给用户看。`,
  3: () => '前两条视频发完，今天只看 4 个数据，决定后面拍什么。',
  4: (research) => `昨天数据更好的方向，今天换成“${research.objection}”再拍一遍。`,
  5: () => '如果你最近正准备到店，今天这条直接讲怎么选更划算。',
  6: (research) => `${research.coreOffer}不要只拍一次，今天把它拆成 3 个版本。`,
  7: (research) => `这条视频专门复制前面数据最好的开头，继续讲${research.coreOffer}。`,
  8: () => '同样的服务，为什么有人觉得值，有人觉得踩坑？',
  9: () => '今天做一次内容淘汰，数据差的方向先停掉。',
  10: () => '今天用一个真实案例，把信任感补上。',
  11: () => '想到店的，今天这条把行动理由讲清楚。',
  12: (research) => `别只看我们怎么说，今天给你看${research.coreOffer}的真实反馈。`,
  13: () => '最后冲刺这 3 天，视频里要给用户一个马上行动的理由。',
  14: () => '15 天快结束了，今天把播放、咨询、成交摊开看。',
  15: () => '下一轮把这 15 天有效动作固化成 SOP。'
}

const buildShootingShots = ({ template, research }) => {
  const firstProof = getProofItem(research.proofAssets, 0)
  const secondProof = getProofItem(research.proofAssets, 1)
  const shotsByDay = {
    1: [`镜头 1：老板正面口播，直接点出${research.audience}最担心的“${research.bottleneck}”。`, `镜头 2：切到${firstProof}，用近景证明${research.coreOffer}。`, `镜头 3：拍权益说明，逐条对应${research.offerPrice}。`, '镜头 4：回到老板口播，提醒用户先收藏，再在评论区留下最担心的点。'],
    2: [`镜头 1：从门头或进店动线开拍，模拟${research.audience}第一次到店的视角。`, `镜头 2：连续拍服务或出品过程，重点给到${research.proofAssets}。`, `镜头 3：把${research.offerPrice}放到画面字幕里。`, `镜头 4：用手机展示主页或私信入口，引导用户按“${research.conversionPath}”行动。`],
    3: ['镜头 1：拍数据表或后台截图，只展示播放、完播、评论、私信四类数字。', `镜头 2：圈出表现最好的一条视频，说明它击中了${research.objection}中的哪一点。`, `镜头 3：圈出表现较弱的一条视频，说明它缺少${firstProof}这类证明。`, '镜头 4：写下明天保留的一个选题和一个要暂停的选题。'],
    4: [`镜头 1：用一句顾客疑问开场：“${research.objection}怎么办？”`, `镜头 2：拍${secondProof}或服务细节，用事实回应这个疑问。`, '镜头 3：老板补一句选择标准，告诉用户到店前先看哪 2 个细节。', '镜头 4：评论区置顶答疑，引导用户继续问具体情况。'],
    5: [`镜头 1：把${research.coreOffer}完整摆出来，先给用户一个清晰画面。`, `镜头 2：逐项拍权益内容，对照字幕写出${research.offerPrice}。`, `镜头 3：老板说明适合人群，点名${research.audience}的使用场景。`, `镜头 4：展示${research.actionEntry}，收口到“${research.conversionPath}”。`],
    6: ['镜头 1：同一地点连拍 3 个开头，分别对应痛点、过程和权益。', `镜头 2：痛点版开头只讲${research.objection}。`, `镜头 3：过程版开头只拍${research.proofAssets}。`, `镜头 4：权益版开头只讲${research.offerPrice}和行动入口。`],
    7: ['镜头 1：复用前面数据最好的 3 秒开头，画面保持同一构图。', `镜头 2：把案例换成${research.coreOffer}的具体使用场景。`, `镜头 3：加入顾客决策前的一个细节，例如${firstProof}。`, '镜头 4：用收藏提示收尾，让用户到店前能再看一遍。'],
    8: ['镜头 1：用顾客视角拍“来之前”和“体验后”的差异。', `镜头 2：拍一段真实对话，围绕${research.objection}展开。`, `镜头 3：展示${research.coreOffer}如何解决这个具体顾虑。`, '镜头 4：引导用户把自己的情况发来，方便做选择判断。'],
    9: ['镜头 1：打开复盘表，列出第 6-8 天三条视频。', `镜头 2：标红无法带来${research.conversionPath}的内容方向。`, `镜头 3：标绿能引发${research.objection}相关提问的内容方向。`, '镜头 4：宣布下一阶段只保留高意向方向继续拍。'],
    10: [`镜头 1：从一个真实顾客问题开场，问题围绕${research.objection}。`, `镜头 2：展示服务前的判断过程，给到${firstProof}。`, `镜头 3：展示服务后反馈或结果，给到${secondProof}。`, `镜头 4：老板总结这类顾客适合怎样选择${research.coreOffer}。`],
    11: ['镜头 1：老板直接说今天适合行动的人群画像。', `镜头 2：拍${research.coreOffer}权益内容，字幕写清${research.offerPrice}。`, '镜头 3：补充使用限制、预约方式或到店注意事项。', `镜头 4：把用户带到“${research.conversionPath}”这一具体动作。`],
    12: ['镜头 1：展示一条老客评价、聊天截图或到店反馈。', `镜头 2：对应拍${research.proofAssets}，解释评价背后的真实原因。`, `镜头 3：老板把反馈翻成选择标准，帮助${research.audience}判断。`, '镜头 4：提醒犹豫用户先问清自己的顾虑，再决定是否行动。'],
    13: ['镜头 1：用限时、限量或档期变化开场，制造行动理由。', `镜头 2：快速回顾${research.coreOffer}最核心的 2 个权益。`, `镜头 3：集中回答${research.objection}，减少用户临门一脚的犹豫。`, `镜头 4：评论区和私信同步承接，提醒用户按“${research.conversionPath}”操作。`],
    14: ['镜头 1：拍 15 天数据复盘表，先展示起始数据和当前数据。', '镜头 2：指出带来最多咨询或成交的一个视频类型。', `镜头 3：指出仍然卡住的一个问题，例如${research.bottleneck}。`, '镜头 4：写下下一轮要继续保留的内容和要优化的承接动作。'],
    15: ['镜头 1：把 15 天有效选题贴在白板或表格上。', `镜头 2：圈出最能击中${research.audience}的 3 个开头。`, `镜头 3：圈出最能推动${research.conversionPath}的 2 个承接动作。`, '镜头 4：宣布下一轮 SOP：固定选题、固定复盘周期、固定私信跟进。']
  }

  return shotsByDay[template.day] || [
    `镜头 1：${template.shootingMethod}开场，直接说今天目标。`,
    `镜头 2：拍${research.sceneAssets}，突出${research.coreOffer}。`,
    `镜头 3：补充${research.proofAssets}，回应${research.objection}。`,
    `镜头 4：收口到“${research.conversionPath}”。`
  ]
}

const buildShootingScript = ({ day, phase, goal, topicDirection, customerNurture, template, research }) => {
  const hook = (dayHooks[day] || dayHooks[1])(research)
  const talkingPoints = [
    replaceIntentTokens(template.goalIntent, research),
    replaceIntentTokens(template.topicIntent, research),
    `复盘重点：${replaceIntentTokens(template.metricIntent, research)}`
  ]
  const voiceover = `${hook} 今天处在${phase}，目标是${goal}。内容围绕${topicDirection}展开，镜头里要出现${research.proofAssets}，并把${research.offerPrice}讲清楚。结尾按“${customerNurture}”承接，让用户知道下一步怎么行动。`

  return {
    hook,
    shots: buildShootingShots({ template, research }),
    talkingPoints,
    voiceover,
    cta: `${customerNurture}。${research.cta}`,
    duration: template.workType === '复盘记录' ? '45-60 秒' : template.videoFunction === '成交转化' ? '35-50 秒' : '25-40 秒'
  }
}

const buildDayFromTemplate = ({ template, phase, research }) => {
  const goal = replaceIntentTokens(template.goalIntent, research)
  const topicDirection = replaceIntentTokens(template.topicIntent, research)
  const customerNurture = replaceIntentTokens(template.nurtureIntent, research)
  const baseMetric = replaceIntentTokens(template.metricIntent, research)
  const reviewMetrics = `${baseMetric}；关注${research.goalMetrics.slice(0, 3).join('、') || research.conversionMetric}`
  const adPlan = research.hasAd
    ? replaceIntentTokens(template.adIntent, research).replace('自然流量', `${research.adLabel}小额投流`)
    : replaceIntentTokens(template.adIntent, research)

  return normalizeQuickPlanDayCompat({
    day: template.day,
    phase: phase.phase,
    goal,
    workType: template.workType,
    videoFunction: template.videoFunction,
    shootingMethod: template.shootingMethod,
    topicDirection,
    executionTool: template.executionTool,
    adPlan,
    customerNurture,
    reviewMetrics,
    shootingScript: buildShootingScript({ day: template.day, phase: phase.phase, goal, topicDirection, customerNurture, template, research }),
    status: template.status
  })
}

export const buildQuickPlanFromTemplates = (input = {}) => {
  const normalizedInput = normalizeQuickPlanInput(input)
  const industryStrategy = getIndustryStrategy(normalizedInput.industryCode)
  const goalStrategy = getGoalStrategy(normalizedInput.goalCode, normalizedInput.industryCode)
  const research = buildResearchContext({ normalizedInput, industryStrategy, goalStrategy })
  const phases = groupQuickPlanTemplatesByPhase().map((phase) => ({
    name: phase.name,
    days: phase.days.map((template) => buildDayFromTemplate({ template, phase, research }))
  }))

  return normalizeQuickPlanResultCompat({
    title: `${research.industryName}行业 15 天${research.goalName}速胜计划`,
    summary: `围绕${research.coreOffer}，先验证内容方向，再放大有效视频，最后承接到${research.conversionMetric || research.goalName}。`,
    researchBrief: buildResearchBrief({ normalizedInput, research }),
    riskBoundary: buildRiskBoundary({ research, industryStrategy }),
    phases,
    meta: {
      planVersion: QUICK_PLAN_RESULT_VERSION,
      generationMode: 'rule',
      industryCode: normalizedInput.industryCode,
      goalCode: normalizedInput.goalCode,
      inputHash: createQuickPlanInputHash(normalizedInput),
      migrated: false
    },
    isRuleFallback: true
  })
}

export const normalizeQuickPlanDayCompat = (day = {}) => {
  const normalized = { ...day }

  quickPlanCompatFieldPairs.forEach(([primaryKey, legacyKey]) => {
    const value = firstPresent(normalized[primaryKey], normalized[legacyKey])
    if (value !== undefined) {
      normalized[primaryKey] = value
      normalized[legacyKey] = firstPresent(normalized[legacyKey], value)
    }
  })

  return normalized
}

export const normalizeQuickPlanResultCompat = (plan) => {
  if (!plan || typeof plan !== 'object') return plan

  return {
    ...plan,
    phases: Array.isArray(plan.phases)
      ? plan.phases.map((phase) => ({
          ...phase,
          days: Array.isArray(phase.days)
            ? phase.days.map((day) => normalizeQuickPlanDayCompat(day))
            : phase.days
        }))
      : plan.phases
  }
}

const normalizeStringList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    const values = value.map((item) => normalizeText(item)).filter(Boolean)
    if (values.length) return values
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return [...fallback]
}

const normalizeShots = (shots, fallbackShots = []) => {
  const normalized = normalizeStringList(shots, fallbackShots)
  const fallback = normalizeStringList(fallbackShots, [])
  while (normalized.length < 4) {
    normalized.push(fallback[normalized.length] || `镜头 ${normalized.length + 1}：围绕当天任务补充一个执行画面。`)
  }
  return normalized.slice(0, 4)
}

const normalizeShootingScript = ({ day, fallbackDay }) => {
  const script = day.shootingScript && typeof day.shootingScript === 'object' ? day.shootingScript : {}
  const fallbackScript = fallbackDay.shootingScript || {}

  return {
    hook: normalizeText(script.hook, fallbackScript.hook || day.goal || fallbackDay.goal),
    shots: normalizeShots(script.shots, fallbackScript.shots),
    talkingPoints: normalizeStringList(script.talkingPoints, fallbackScript.talkingPoints || [day.goal || fallbackDay.goal]),
    voiceover: normalizeText(script.voiceover, fallbackScript.voiceover || `今天执行${day.goal || fallbackDay.goal}，并按复盘指标判断效果。`),
    cta: normalizeText(script.cta, fallbackScript.cta || day.customerNurture || fallbackDay.customerNurture),
    duration: normalizeText(script.duration, fallbackScript.duration || '30-45 秒')
  }
}

const normalizeQuickPlanDay = ({ day = {}, fallbackDay = {} }) => {
  const normalized = normalizeQuickPlanDayCompat({
    day: firstPresent(day.day, fallbackDay.day),
    phase: firstPresent(day.phase, fallbackDay.phase),
    goal: firstPresent(day.goal, day.action, fallbackDay.goal, fallbackDay.action),
    action: firstPresent(day.action, day.goal, fallbackDay.action, fallbackDay.goal),
    workType: firstPresent(day.workType, fallbackDay.workType),
    videoFunction: firstPresent(day.videoFunction, fallbackDay.videoFunction),
    shootingMethod: firstPresent(day.shootingMethod, fallbackDay.shootingMethod),
    topicDirection: firstPresent(day.topicDirection, day.content, fallbackDay.topicDirection, fallbackDay.content),
    content: firstPresent(day.content, day.topicDirection, fallbackDay.content, fallbackDay.topicDirection),
    executionTool: firstPresent(day.executionTool, fallbackDay.executionTool),
    adPlan: firstPresent(day.adPlan, day.ad, fallbackDay.adPlan, fallbackDay.ad),
    ad: firstPresent(day.ad, day.adPlan, fallbackDay.ad, fallbackDay.adPlan),
    customerNurture: firstPresent(day.customerNurture, fallbackDay.customerNurture),
    reviewMetrics: firstPresent(day.reviewMetrics, day.kpi, fallbackDay.reviewMetrics, fallbackDay.kpi),
    kpi: firstPresent(day.kpi, day.reviewMetrics, fallbackDay.kpi, fallbackDay.reviewMetrics),
    status: firstPresent(day.status, fallbackDay.status, '未开始')
  })

  return {
    ...normalized,
    shootingScript: normalizeShootingScript({ day: { ...day, ...normalized }, fallbackDay })
  }
}

const normalizeQuickPlanPhases = ({ plan, fallbackPlan }) => {
  const phases = Array.isArray(plan.phases) ? plan.phases : []
  return fallbackPlan.phases.map((fallbackPhase, phaseIndex) => {
    const phase = phases[phaseIndex] && typeof phases[phaseIndex] === 'object' ? phases[phaseIndex] : {}
    const days = Array.isArray(phase.days) ? phase.days : []
    return {
      name: normalizeText(phase.name, fallbackPhase.name),
      days: fallbackPhase.days.map((fallbackDay, dayIndex) => normalizeQuickPlanDay({
        day: days[dayIndex],
        fallbackDay
      }))
    }
  })
}

export const validateQuickPlanResult = (plan, input = {}, options = {}) => {
  const fallbackPlan = buildQuickPlanFromTemplates(input)
  const hasUsablePlan = plan && typeof plan === 'object' && Array.isArray(plan.phases)
  const sourcePlan = plan && typeof plan === 'object' ? plan : {}
  const normalizedInput = normalizeQuickPlanInput(input)
  const normalized = normalizeQuickPlanResultCompat({
    title: normalizeText(sourcePlan.title, fallbackPlan.title),
    summary: normalizeText(sourcePlan.summary, fallbackPlan.summary),
    researchBrief: normalizeStringList(sourcePlan.researchBrief, fallbackPlan.researchBrief),
    riskBoundary: normalizeStringList(sourcePlan.riskBoundary, fallbackPlan.riskBoundary),
    phases: normalizeQuickPlanPhases({ plan: sourcePlan, fallbackPlan }),
    meta: {
      ...fallbackPlan.meta,
      ...(sourcePlan.meta && typeof sourcePlan.meta === 'object' ? sourcePlan.meta : {}),
      planVersion: QUICK_PLAN_RESULT_VERSION,
      generationMode: hasUsablePlan
        ? normalizeText(sourcePlan.meta?.generationMode || options.generationMode, options.generationMode || 'ai')
        : 'ruleFallback',
      industryCode: normalizedInput.industryCode,
      goalCode: normalizedInput.goalCode,
      inputHash: createQuickPlanInputHash(normalizedInput),
      migrated: Boolean(sourcePlan.meta?.migrated)
    },
    isRuleFallback: sourcePlan.isRuleFallback || !hasUsablePlan || options.generationMode === 'ruleFallback'
  })

  if (normalized.meta.generationMode === 'ruleFallback') normalized.isRuleFallback = true
  return normalized
}

import express from 'express'
import { query } from '../models/db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { isGuestModeEnabled } from '../middleware/auth.js'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const xhsKnowledge = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../knowledge-base/structured/xhs/xhs-knowledge.json'), 'utf8')
)

// 中间件：验证会员等级
const checkAccess = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isGuestModeEnabled()) {
      req.userLevel = 'annual'
      req.userId = null
      return next()
    }
    return res.status(401).json({ error: '未授权', requiredLevel: 'free' })
  }

  try {
    const jwt = await import('jsonwebtoken')
    const token = authHeader.split(' ')[1]
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'woai-ai-secret-key')

    const users = await query('SELECT member_level FROM users WHERE id = ?', [decoded.userId])
    if (users.length === 0) return res.status(403).json({ error: '用户不存在' })

    req.userLevel = users[0].member_level || 'free'
    req.userId = decoded.userId
    next()
  } catch (error) {
    if (isGuestModeEnabled()) {
      req.userLevel = 'annual'
      req.userId = null
      return next()
    }
    res.status(401).json({ error: '无效的 Token' })
  }
}

// 智能体权限映射
const AGENT_ACCESS = {
  account_diagnosis: 'free',
  'account-diagnosis': 'free',
  quick_start_plan: 'pro',
  'quick-start-plan': 'pro',
  growth_strategy: 'annual',
  'growth-strategy': 'annual',
  topic_generator: 'starter',
  'topic-generator': 'starter',
  script_generator: 'starter',
  'script-generator': 'starter',
  title_generator: 'starter',
  'title-generator': 'starter',
  cover_helper: 'starter',
  'cover-helper': 'starter',
  note_diagnoser: 'pro',
  'note-diagnoser': 'pro',
  account_reviewer: 'pro',
  'account-reviewer': 'pro',
  seo_optimizer: 'pro',
  'seo-optimizer': 'pro',
  conversion_optimizer: 'pro',
  'conversion-optimizer': 'pro',
  competitor_analyzer: 'annual',
  'competitor-analyzer': 'annual',
  grass_converter: 'pro',
  'grass-converter': 'pro',
  shutiao_calculator: 'free',
  'shutiao-calculator': 'free',
  juguang_strategy: 'pro',
  'juguang-strategy': 'pro',
  ip_positioning: 'annual',
  'ip-positioning': 'annual',
  ip_consistency: 'annual',
  'ip-consistency': 'annual'
}

const requireLevel = (requiredLevel) => (req, res, next) => {
  const levelOrder = { free: 0, starter: 1, pro: 2, annual: 3 }
  if (levelOrder[req.userLevel] < levelOrder[requiredLevel]) {
    return res.status(403).json({ error: '需要更高会员等级', requiredLevel })
  }
  next()
}

const industryMap = {
  beauty: '美妆护肤',
  fashion: '穿搭时尚',
  food: '美食探店',
  restaurant: '餐饮门店',
  education: '知识教育',
  home: '家居家装',
  parenting: '母婴育儿',
  fitness: '运动健身'
}

function getIndustryLabel(value) {
  return industryMap[value] || value || '小红书账号'
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function getTitleExamples(industry, count = 4) {
  const key = industry === 'food' ? 'restaurant' : industry
  return xhsKnowledge.titleFormulas.slice(0, count).map(formula => ({
    formula: formula.name,
    example: formula.examples[key] || formula.examples.restaurant
  }))
}

function buildAgentResponse(agent, req) {
  const body = req.body || {}
  const industry = getIndustryLabel(body.industry)
  const topic = body.topic || body.product || body.positioning || `${industry}内容`
  const audience = body.audience || body.targetAudience || '目标用户'
  const notes = toNumber(body.notes || body.noteCount, 12)
  const views = toNumber(body.views || body.avgViews || body.reads, 0)
  const likes = toNumber(body.likes, 0)
  const collects = toNumber(body.collects || body.saves, 0)
  const comments = toNumber(body.comments, 0)
  const follows = toNumber(body.follows, 0)
  const orders = toNumber(body.orders || body.deals, 0)
  const revenue = toNumber(body.revenue, 0)
  const cost = toNumber(body.cost || body.budget, 0)
  const interactionRate = views > 0 ? ((likes + collects + comments) / views * 100) : 0
  const collectRate = views > 0 ? (collects / views * 100) : 0
  const conversionRate = views > 0 ? (orders / views * 100) : 0
  const roi = cost > 0 ? revenue / cost : 0

  const commonMeta = {
    engineType: 'rule-based-knowledge',
    knowledgeSource: 'knowledge-base/structured/xhs/xhs-knowledge.json',
    degraded: false
  }

  const responses = {
    'quick-start-plan': {
      title: '15 天起号计划',
      summary: `${industry}新号冷启动计划已生成`,
      sections: [
        { title: '第 1-3 天：账号定盘', items: ['明确单一赛道、人群和转化目标', '完成昵称、简介、置顶笔记和视觉模板统一', '拆解 10 个同赛道高互动账号，沉淀选题库'] },
        { title: '第 4-10 天：标签建立', items: ['每天发布 1 篇垂直笔记，标题使用搜索关键词', '每篇只解决一个具体问题，优先教程、避坑、清单结构', '评论区固定引导收藏、提问或私信咨询'] },
        { title: '第 11-15 天：数据复盘', items: ['按阅读、赞藏、评论、私信四类指标筛选样本', '保留互动率高于 3% 的主题继续迭代', '将低互动笔记复盘为封面、标题、正文和话题四类问题'] }
      ],
      actions: ['今天完成账号定位表', '3 天内发布首批 3 篇垂直笔记', '第 15 天形成下一轮选题清单'],
      recommendedTools: ['topic-generator', 'title-generator', 'cover-helper']
    },
    'growth-strategy': {
      title: '90 天增长战略',
      summary: `${industry}90 天增长框架已生成`,
      sections: [
        { title: '0-30 天：定位与标签', items: ['锁定 1 个主赛道和 2 个内容栏目', '建立标题、封面、正文和话题模板', '重点看账号垂直度、互动率和收藏率'] },
        { title: '31-60 天：爆款复制', items: ['围绕高收藏主题做系列化扩展', '把评论区问题转成选题', '对封面和标题做双版本测试'] },
        { title: '61-90 天：转化承接', items: ['搭建私信关键词和咨询 SOP', '用案例笔记承接高意向用户', '每周复盘阅读到成交的漏斗数据'] }
      ],
      actions: ['先完成近 30 天数据整理', '每周固定复盘一次内容漏斗', '高阶全案建议结合专家 1v1 深化'],
      recommendedTools: ['account-reviewer', 'conversion-optimizer', 'ip-positioning']
    },
    'script-generator': {
      title: '正文脚本生成',
      summary: `${topic}正文脚本已生成`,
      sections: [
        { title: '图文结构', items: [`标题：${topic}，${audience}先收藏`, `开头：先指出一个具体场景痛点`, `正文：按问题、原因、判断方法、行动建议展开`, `结尾：引导评论关键词或私信咨询`] },
        { title: '视频结构', items: ['0-3 秒抛出反常识或结果', '3-15 秒展示真实场景', '15-40 秒给出步骤或对比', '结尾提醒收藏并给出下一步动作'] }
      ],
      actions: ['把脚本替换为真实案例', '拍摄前准备 3 张关键画面', '发布后记录完读率和收藏率'],
      recommendedTools: ['title-generator', 'cover-helper', 'seo-optimizer']
    },
    'cover-helper': {
      title: '封面文案助手',
      summary: `${topic}封面文案已生成`,
      sections: [
        { title: '封面标题', items: [`${audience}必看`, `${topic}避坑清单`, `这 3 点先确认`, `收藏这份攻略`] },
        { title: '视觉建议', items: ['3:4 竖版构图，主体占画面 60% 以上', '主标题控制在 8-14 字', '使用统一字体、底色和栏目标签'] }
      ],
      actions: ['优先做 2 个封面版本测试', '封面文字只保留一个核心利益点', '把关键词放在首屏可见位置'],
      recommendedTools: ['title-generator', 'script-generator']
    },
    'note-diagnoser': {
      title: '笔记数据诊断',
      summary: `${topic}笔记数据诊断已完成`,
      metrics: { views, interactionRate: `${interactionRate.toFixed(1)}%`, collectRate: `${collectRate.toFixed(1)}%` },
      sections: [
        { title: '数据判断', items: [`互动率：${interactionRate.toFixed(1)}%，图文优秀线参考 5% 以上，视频优秀线参考 8% 以上`, `收藏率：${collectRate.toFixed(1)}%，优秀线参考 3% 以上`, views < 500 ? '当前阅读样本偏小，先检查封面、标题和发布时间' : '当前已有可复盘样本，重点拆互动与收藏来源'] },
        { title: '优化方向', items: ['封面先给结果或清单', '正文前三行讲清适合人群', '评论区置顶一个具体问题引导互动'] }
      ],
      actions: ['复盘同主题前 5 篇笔记', '保留高收藏段落并改写成系列', '48 小时后复查互动质量'],
      recommendedTools: ['seo-optimizer', 'title-generator']
    },
    'account-reviewer': {
      title: '账号复盘助手',
      summary: `${industry}账号阶段复盘已生成`,
      metrics: { notes, avgViews: views, interactionRate: `${interactionRate.toFixed(1)}%` },
      sections: [
        { title: '复盘结论', items: [`近阶段笔记数：${notes}`, `平均阅读：${views}`, `互动率：${interactionRate.toFixed(1)}%`, '优先找出高收藏、高评论、高私信三类样本'] },
        { title: '下阶段重点', items: ['固定 2 个主栏目', '把爆款主题做系列化', '用搜索关键词提升长尾流量'] }
      ],
      actions: ['建立周复盘表', '每周保留 3 个有效选题', '低质主题暂停连续发布'],
      recommendedTools: ['topic-generator', 'seo-optimizer', 'growth-strategy']
    },
    'seo-optimizer': {
      title: 'SEO 关键词优化',
      summary: `${topic}关键词方案已生成`,
      sections: [
        { title: '关键词布局', items: [`核心词：${topic}`, `人群词：${audience}`, `场景词：新手、避坑、教程、清单、测评`, `地域词：本地门店可加入城市和商圈`] },
        { title: '正文位置', items: ['标题放 1 个核心关键词', '正文前 100 字重复核心词和人群词', '话题保留 3-5 个精准标签'] }
      ],
      actions: ['先整理 20 个搜索词', '每篇笔记只主攻 1 个核心词', '7 天后查看搜索来源占比'],
      recommendedTools: ['title-generator', 'topic-generator']
    },
    'conversion-optimizer': {
      title: '转化链路优化',
      summary: `${industry}小红书转化链路方案已生成`,
      sections: [
        { title: '合规承接', items: ['评论区引导用户提出具体问题', '私信首轮先做需求确认', '资料、预约、体验权益要写清使用条件'] },
        { title: '漏斗指标', items: ['阅读量到主页访问', '主页访问到私信咨询', '私信咨询到预约或成交', '成交后复购和转介绍'] }
      ],
      actions: ['整理 5 条高频私信回复', '设置咨询分层标签', '每周复盘咨询到成交比例'],
      recommendedTools: ['grass-converter', 'account-reviewer']
    },
    'competitor-analyzer': {
      title: '竞对分析器',
      summary: `${industry}竞对拆解框架已生成`,
      sections: [
        { title: '拆解维度', items: ['账号定位和人设', '高互动选题结构', '封面标题风格', '评论区需求', '转化入口与权益表达'] },
        { title: '差异化方向', items: [`围绕${topic}寻找更细分人群`, '使用真实案例提升信任', '用本地场景或专业经验形成记忆点'] }
      ],
      actions: ['选择 5 个同赛道账号', '记录近 30 天高互动笔记', '提炼 3 个可借鉴但需原创表达的方向'],
      recommendedTools: ['ip-positioning', 'topic-generator']
    },
    'grass-converter': {
      title: '种草转化计算器',
      summary: `${industry}种草转化测算已完成`,
      metrics: { views, orders, revenue, cost, conversionRate: `${conversionRate.toFixed(2)}%`, roi: roi.toFixed(2) },
      sections: [
        { title: '漏斗结果', items: [`阅读量：${views}`, `成交数：${orders}`, `阅读到成交率：${conversionRate.toFixed(2)}%`, `ROI：${roi.toFixed(2)}`] },
        { title: '经营判断', items: [roi >= 2 ? '当前 ROI 具备继续放大观察价值' : '当前 ROI 需要先优化内容和承接', '同步关注成交毛利、复购和咨询质量'] }
      ],
      actions: ['拆分自然流量和投放流量', '记录每篇笔记的咨询数', '用高转化笔记反推选题公式'],
      recommendedTools: ['conversion-optimizer', 'juguang-strategy']
    },
    'juguang-strategy': {
      title: '聚光投放策略',
      summary: `${industry}聚光投放框架已生成`,
      sections: [
        { title: '投前筛选', items: ['先选自然互动表现较好的笔记', '封面点击和收藏率达标后再放量', '评论区负反馈较多的笔记暂停投放'] },
        { title: '投放结构', items: ['测试期小预算验证关键词和人群', '放量期保留高转化人群包', '复盘期按咨询成本和成交质量判断'] }
      ],
      actions: ['准备 3 篇候选笔记', '先跑 1-2 天小预算测试', '按咨询成本决定加预算'],
      recommendedTools: ['note-diagnoser', 'grass-converter']
    },
    'ip-positioning': {
      title: '博主 IP 定位',
      summary: `${industry}IP 定位已生成`,
      sections: [
        { title: '定位公式', items: [`我是面向${audience}的${industry}经验分享者`, `核心内容围绕${topic}`, '表达风格保持真实、专业、可执行'] },
        { title: '内容栏目', items: ['避坑清单', '真实案例', '教程步骤', '行业观察'] }
      ],
      actions: ['确定一句话定位', '固定头像、简介和置顶笔记', '连续 30 天保持栏目一致'],
      recommendedTools: ['ip-consistency', 'topic-generator']
    },
    'ip-consistency': {
      title: '人设一致性检查',
      summary: `${industry}人设一致性检查已完成`,
      sections: [
        { title: '检查项', items: ['昵称和简介是否指向同一赛道', '封面风格是否统一', '正文语气是否稳定', '选题是否持续服务同一人群'] },
        { title: '修正建议', items: [`围绕${topic}减少无关内容`, '用固定栏目增强识别度', '把个人经历和专业观点绑定'] }
      ],
      actions: ['清理偏离定位的内容', '统一封面模板', '每周检查一次选题偏移'],
      recommendedTools: ['ip-positioning', 'account-reviewer']
    }
  }

  const response = responses[agent] || {
    title: agent,
    summary: `${industry}小红书智能体结果已生成`,
    sections: [{ title: '建议', items: ['聚焦垂直赛道', '保持稳定更新', '复盘互动和转化数据'] }],
    actions: ['补齐真实业务数据后复盘'],
    recommendedTools: ['account-diagnosis']
  }

  return {
    agent,
    status: 'success',
    ...response,
    titleExamples: getTitleExamples(body.industry, 3),
    riskNotes: ['结果基于小红书结构化知识库和用户输入生成，需要结合账号后台真实数据复核。'],
    meta: commonMeta
  }
}

// 1. 账号体检表
router.post('/account-diagnosis', checkAccess, requireLevel('free'), async (req, res) => {
  const { industry, verticalityPains, interactionPains, activityPains, violationStatus } = req.body
  
  const model = xhsKnowledge.xhsDiagnosisModel
  const vScore = Math.max(20, 100 - (verticalityPains?.length || 0) * 20)
  const iScore = Math.max(25, 100 - (interactionPains?.length || 0) * 18)
  const aScore = Math.max(30, 100 - (activityPains?.length || 0) * 15)
  const violationScore = violationStatus === 'none' ? 100 : violationStatus === 'minor' ? 80 : violationStatus === 'multiple' ? 50 : 20
  const completenessScore = 80 // 默认
  
  const total = Math.round(vScore * 0.3 + iScore * 0.25 + aScore * 0.2 + violationScore * 0.15 + completenessScore * 0.1)
  
  res.json({
    agent: 'account_diagnosis',
    result: {
      radar: [
        { name: '内容垂直度', score: vScore, color: vScore < 50 ? '#ef4444' : vScore < 80 ? '#f59e0b' : '#10b981' },
        { name: '互动质量', score: iScore, color: iScore < 50 ? '#ef4444' : iScore < 80 ? '#f59e0b' : '#10b981' },
        { name: '发布活跃度', score: aScore, color: aScore < 50 ? '#ef4444' : aScore < 80 ? '#f59e0b' : '#10b981' },
        { name: '违规记录', score: violationScore, color: violationScore < 60 ? '#ef4444' : '#10b981' },
        { name: '账号完善度', score: completenessScore, color: '#10b981' }
      ],
      totalScore: total,
      level: total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 50 ? 'C' : 'D',
      diagnosis: `您的账号整体健康度为${total}分，属于${total >= 85 ? '健康' : total >= 70 ? '良好' : total >= 50 ? '预警' : '危险'}状态。`,
      suggestions: ['优化内容垂直度，聚焦单一赛道', '提高互动率，多引导收藏和评论', '保持每周 3-4 篇的稳定更新频率']
    }
  })
})

// 2. 爆款选题库
router.post('/topic-generator', checkAccess, requireLevel('starter'), async (req, res) => {
  const { industry, audience, method, hotspot } = req.body
  
  const formulas = xhsKnowledge.titleFormulas
  // 简单模拟根据行业生成
  const examples = formulas.map(f => ({
    title: f.examples[industry] || f.examples.restaurant,
    formula: f.name,
    tags: ['搜索', '互动', '收藏']
  }))

  res.json({
    agent: 'topic_generator',
    topics: examples.slice(0, 5).map((t, i) => ({
      ...t,
      id: i + 1,
      searchVolume: Math.floor(Math.random() * 50000) + 10000,
      competition: ['低', '中', '高'][Math.floor(Math.random() * 3)]
    }))
  })
})

// 3. 标题生成器
router.post('/title-generator', checkAccess, requireLevel('starter'), async (req, res) => {
  const { industry, topic, formulaType } = req.body
  const formulas = xhsKnowledge.titleFormulas
  
  let selected = formulas
  if (formulaType) {
    selected = formulas.filter(f => f.id === formulaType)
  }

  res.json({
    agent: 'title_generator',
    titles: selected.slice(0, 6).map(f => ({
      title: f.examples[industry] || f.examples.restaurant,
      type: f.name,
      ctr: Math.floor(Math.random() * 15) + 5 + '%'
    }))
  })
})

// 4. 薯条投放计算器
router.post('/shutiao-calculator', checkAccess, requireLevel('free'), async (req, res) => {
  const { budget, goal, ctr, interactionRate } = req.body
  const benchmarks = xhsKnowledge.shutiaoBenchmarks
  
  const isWorthInvesting = parseFloat(ctr) > 10 && parseFloat(interactionRate) > 5
  
  const cpm = (benchmarks.cpm.min + benchmarks.cpm.max) / 2
  const exposures = Math.round((budget / cpm) * 1000)
  
  res.json({
    agent: 'shutiao_calculator',
    isWorthInvesting,
    screeningResult: isWorthInvesting ? '✅ 符合投放标准，建议投放' : '⚠️ 数据未达标，建议优化内容后再投',
    exposures,
    cpm: cpm.toFixed(0),
    benchmark: benchmarks.screeningCriteria
  })
})

// 5-17 端点使用规则知识库结构化生成
const structuredAgents = [
  'quick-start-plan', 'growth-strategy', 'script-generator', 'cover-helper',
  'note-diagnoser', 'account-reviewer', 'seo-optimizer', 'conversion-optimizer',
  'competitor-analyzer', 'grass-converter', 'juguang-strategy', 'ip-positioning', 'ip-consistency'
]

structuredAgents.forEach(agent => {
  router.post(`/${agent}`, checkAccess, requireLevel(AGENT_ACCESS[agent] || 'pro'), (req, res) => {
    res.json(buildAgentResponse(agent, req))
  })
})

export default router
